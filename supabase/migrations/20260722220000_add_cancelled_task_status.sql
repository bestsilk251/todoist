-- Keep cancelled tasks recoverable without treating them as active or completed.
alter table public.tasks
  drop constraint if exists tasks_status_check;

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pending', 'done', 'cancelled'));

comment on column public.tasks.status is
  'Task lifecycle state: pending, done, or cancelled. Cancelled tasks remain recoverable.';
