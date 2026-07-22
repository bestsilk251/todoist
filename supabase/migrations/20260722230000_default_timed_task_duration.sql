-- Timed tasks occupy one hour unless the user specifies another duration.
create or replace function public.ensure_timed_task_duration()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.due_time is not null
    and not coalesce(new.is_all_day, false)
    and new.duration_minutes is null then
    new.duration_minutes := 60;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_default_timed_duration_trigger on public.tasks;
create trigger tasks_default_timed_duration_trigger
before insert or update of due_time, is_all_day, duration_minutes on public.tasks
for each row execute function public.ensure_timed_task_duration();

-- Bring existing timed tasks under the same rule without touching all-day tasks.
update public.tasks
set duration_minutes = 60,
    updated_at = now()
where due_time is not null
  and not coalesce(is_all_day, false)
  and duration_minutes is null;

comment on function public.ensure_timed_task_duration() is
  'Defaults timed tasks without an explicit duration to 60 minutes.';
