with demo_user as (
  select id
  from auth.users
  where lower(email) = lower('olenamelnyk@gmail.com')
  limit 1
), seeded as (
  select
    t.*,
    (t.completed_at at time zone 'Europe/Kyiv')::date as completed_day
  from public.tasks t
  join demo_user u on u.id = t.user_id
  where t.source_text = '[demo-analytics-v1]'
)
select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'total', count(*),
      'completed', count(*) filter (where status = 'done'),
      'pending', count(*) filter (where status = 'pending'),
      'overduePending', count(*) filter (
        where status = 'pending'
          and due_date < (now() at time zone 'Europe/Kyiv')::date
      ),
      'futurePending', count(*) filter (
        where status = 'pending'
          and due_date > (now() at time zone 'Europe/Kyiv')::date
      ),
      'withoutDuration', count(*) filter (where duration_minutes is null),
      'withoutCategory', count(*) filter (where trim(category) = ''),
      'firstCompletedDay', min(completed_day),
      'lastCompletedDay', max(completed_day),
      'lastDueDay', max(due_date)
    )
    from seeded
  ),
  'byStatus', (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('status', status, 'count', task_count)
        order by status
      ),
      '[]'::jsonb
    )
    from (
      select status, count(*) as task_count
      from seeded
      group by status
    ) grouped
  ),
  'byCategory', (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('category', category_name, 'count', task_count)
        order by task_count desc
      ),
      '[]'::jsonb
    )
    from (
      select
        coalesce(nullif(trim(category), ''), 'Без категорії') as category_name,
        count(*) as task_count
      from seeded
      group by 1
    ) grouped
  )
) as verification;
