-- Server-side analytics for the authenticated user's tasks.
-- Existing due_date/due_time and category columns are reused intentionally.

alter table public.tasks
  add column if not exists completed_at timestamptz,
  add column if not exists duration_minutes integer;

comment on column public.tasks.completed_at is
  'Exact completion timestamp. Nullable so historical rows are not guessed or rewritten.';
comment on column public.tasks.duration_minutes is
  'Optional planned duration in minutes. Null means the task has no known duration.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tasks_duration_minutes_nonnegative'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_duration_minutes_nonnegative
      check (duration_minutes is null or duration_minutes >= 0);
  end if;
end;
$$;

create or replace function public.set_task_completion_metadata()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'done' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_completion_metadata_trigger on public.tasks;
create trigger tasks_completion_metadata_trigger
before insert or update of status, duration_minutes on public.tasks
for each row execute function public.set_task_completion_metadata();

create index if not exists tasks_user_completed_at_idx
  on public.tasks (user_id, completed_at);
create index if not exists tasks_user_due_datetime_idx
  on public.tasks (user_id, due_date, due_time);
create index if not exists tasks_user_category_idx
  on public.tasks (user_id, category);

create or replace function public.get_task_analytics(
  p_from date,
  p_to date,
  p_timezone text default 'UTC'
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_days integer;
  v_previous_from date;
  v_previous_to date;
  v_from_ts timestamptz;
  v_to_exclusive_ts timestamptz;
  v_previous_from_ts timestamptz;
  v_current_completed integer := 0;
  v_previous_completed integer := 0;
  v_current_planned bigint := 0;
  v_previous_planned bigint := 0;
  v_current_deadline_count integer := 0;
  v_previous_deadline_count integer := 0;
  v_current_on_time_count integer := 0;
  v_previous_on_time_count integer := 0;
  v_current_on_time_rate integer;
  v_previous_on_time_rate integer;
  v_streak integer := 0;
  v_daily jsonb := '[]'::jsonb;
  v_heatmap jsonb := '[]'::jsonb;
  v_categories jsonb := '[]'::jsonb;
  v_productive_interval text;
  v_productive_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Invalid analytics date range' using errcode = '22007';
  end if;

  v_days := (p_to - p_from) + 1;
  if v_days > 366 then
    raise exception 'Analytics range cannot exceed 366 days' using errcode = '22023';
  end if;

  if not exists (select 1 from pg_timezone_names where name = p_timezone) then
    raise exception 'Unknown timezone: %', p_timezone using errcode = '22023';
  end if;

  v_previous_to := p_from - 1;
  v_previous_from := v_previous_to - (v_days - 1);
  v_from_ts := p_from::timestamp at time zone p_timezone;
  v_to_exclusive_ts := (p_to + 1)::timestamp at time zone p_timezone;
  v_previous_from_ts := v_previous_from::timestamp at time zone p_timezone;

  select
    count(*)::integer,
    coalesce(sum(t.duration_minutes), 0)::bigint,
    count(*) filter (where t.due_date is not null)::integer,
    count(*) filter (
      where t.due_date is not null
        and t.completed_at <= ((
          t.due_date + coalesce(t.due_time, time '23:59:59')
        ) at time zone p_timezone)
    )::integer
  into
    v_current_completed,
    v_current_planned,
    v_current_deadline_count,
    v_current_on_time_count
  from public.tasks t
  where t.user_id = v_user_id
    and t.status = 'done'
    and t.completed_at >= v_from_ts
    and t.completed_at < v_to_exclusive_ts;

  select
    count(*)::integer,
    coalesce(sum(t.duration_minutes), 0)::bigint,
    count(*) filter (where t.due_date is not null)::integer,
    count(*) filter (
      where t.due_date is not null
        and t.completed_at <= ((
          t.due_date + coalesce(t.due_time, time '23:59:59')
        ) at time zone p_timezone)
    )::integer
  into
    v_previous_completed,
    v_previous_planned,
    v_previous_deadline_count,
    v_previous_on_time_count
  from public.tasks t
  where t.user_id = v_user_id
    and t.status = 'done'
    and t.completed_at >= v_previous_from_ts
    and t.completed_at < v_from_ts;

  v_current_on_time_rate := case
    when v_current_deadline_count = 0 then null
    else round(v_current_on_time_count * 100.0 / v_current_deadline_count)::integer
  end;
  v_previous_on_time_rate := case
    when v_previous_deadline_count = 0 then null
    else round(v_previous_on_time_count * 100.0 / v_previous_deadline_count)::integer
  end;

  with recursive
    completed_days as materialized (
      select distinct (t.completed_at at time zone p_timezone)::date as day
      from public.tasks t
      where t.user_id = v_user_id
        and t.status = 'done'
        and t.completed_at is not null
        and (t.completed_at at time zone p_timezone)::date <= (now() at time zone p_timezone)::date
    ),
    streak(day, length) as (
      select (now() at time zone p_timezone)::date, 1
      where exists (
        select 1 from completed_days
        where day = (now() at time zone p_timezone)::date
      )
      union all
      select s.day - 1, s.length + 1
      from streak s
      where exists (select 1 from completed_days where day = s.day - 1)
    )
  select coalesce(max(length), 0) into v_streak from streak;

  with days as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  ), values_by_day as (
    select
      (t.completed_at at time zone p_timezone)::date as day,
      count(*)::integer as completed_tasks,
      coalesce(sum(t.duration_minutes), 0)::bigint as planned_minutes
    from public.tasks t
    where t.user_id = v_user_id
      and t.status = 'done'
      and t.completed_at >= v_from_ts
      and t.completed_at < v_to_exclusive_ts
    group by 1
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', d.day,
        'completedTasks', coalesce(v.completed_tasks, 0),
        'plannedMinutes', coalesce(v.planned_minutes, 0)
      ) order by d.day
    ),
    '[]'::jsonb
  ) into v_daily
  from days d
  left join values_by_day v on v.day = d.day;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'weekday', h.weekday,
        'hour', h.hour,
        'completedTasks', h.completed_tasks,
        'plannedMinutes', h.planned_minutes,
        'value', h.completed_tasks
      ) order by h.weekday, h.hour
    ),
    '[]'::jsonb
  ) into v_heatmap
  from (
    select
      extract(isodow from t.completed_at at time zone p_timezone)::integer as weekday,
      extract(hour from t.completed_at at time zone p_timezone)::integer as hour,
      count(*)::integer as completed_tasks,
      coalesce(sum(t.duration_minutes), 0)::bigint as planned_minutes
    from public.tasks t
    where t.user_id = v_user_id
      and t.status = 'done'
      and t.completed_at >= v_from_ts
      and t.completed_at < v_to_exclusive_ts
    group by 1, 2
  ) h;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', md5(c.name),
        'name', c.name,
        'completedTasks', c.completed_tasks,
        'plannedMinutes', c.planned_minutes,
        'percentage', case
          when v_current_planned > 0 then round(c.planned_minutes * 100.0 / v_current_planned)::integer
          when v_current_completed > 0 then round(c.completed_tasks * 100.0 / v_current_completed)::integer
          else 0
        end
      ) order by
        case when v_current_planned > 0 then c.planned_minutes else c.completed_tasks end desc,
        c.name
    ),
    '[]'::jsonb
  ) into v_categories
  from (
    select
      coalesce(nullif(trim(t.category), ''), 'Без категорії') as name,
      count(*)::integer as completed_tasks,
      coalesce(sum(t.duration_minutes), 0)::bigint as planned_minutes
    from public.tasks t
    where t.user_id = v_user_id
      and t.status = 'done'
      and t.completed_at >= v_from_ts
      and t.completed_at < v_to_exclusive_ts
    group by 1
  ) c;

  select p.interval_label, p.task_count
  into v_productive_interval, v_productive_count
  from (
    select
      case
        when extract(hour from t.completed_at at time zone p_timezone) >= 6
          and extract(hour from t.completed_at at time zone p_timezone) < 10 then '06:00–10:00'
        when extract(hour from t.completed_at at time zone p_timezone) >= 10
          and extract(hour from t.completed_at at time zone p_timezone) < 14 then '10:00–14:00'
        when extract(hour from t.completed_at at time zone p_timezone) >= 14
          and extract(hour from t.completed_at at time zone p_timezone) < 18 then '14:00–18:00'
        when extract(hour from t.completed_at at time zone p_timezone) >= 18
          and extract(hour from t.completed_at at time zone p_timezone) < 22 then '18:00–22:00'
        else '22:00–06:00'
      end as interval_label,
      count(*)::integer as task_count,
      min(extract(hour from t.completed_at at time zone p_timezone)) as first_hour
    from public.tasks t
    where t.user_id = v_user_id
      and t.status = 'done'
      and t.completed_at >= v_from_ts
      and t.completed_at < v_to_exclusive_ts
    group by 1
  ) p
  order by p.task_count desc, p.first_hour
  limit 1;

  return jsonb_build_object(
    'period', jsonb_build_object(
      'from', p_from,
      'to', p_to,
      'previousFrom', v_previous_from,
      'previousTo', v_previous_to
    ),
    'summary', jsonb_build_object(
      'completedTasks', v_current_completed,
      'completedTasksChange', case
        when v_previous_completed = 0 then null
        else round((v_current_completed - v_previous_completed) * 100.0 / v_previous_completed)::integer
      end,
      'plannedMinutes', v_current_planned,
      'plannedMinutesChange', case
        when v_previous_planned = 0 then null
        else round((v_current_planned - v_previous_planned) * 100.0 / v_previous_planned)::integer
      end,
      'onTimeRate', v_current_on_time_rate,
      'onTimeRateChange', case
        when v_current_on_time_rate is null or v_previous_on_time_rate is null then null
        else v_current_on_time_rate - v_previous_on_time_rate
      end,
      'streakDays', v_streak
    ),
    'daily', v_daily,
    'heatmap', v_heatmap,
    'categories', v_categories,
    'insights', jsonb_build_object(
      'mostProductiveInterval', v_productive_interval,
      'averageTasksPerDayInInterval', case
        when v_productive_interval is null then null
        else round(v_productive_count::numeric / v_days, 1)
      end,
      'focusRate', v_current_on_time_rate
    )
  );
end;
$$;

revoke all on function public.get_task_analytics(date, date, text) from public;
grant execute on function public.get_task_analytics(date, date, text) to authenticated;
