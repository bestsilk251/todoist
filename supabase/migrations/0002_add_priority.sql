-- Adds a 4-level priority to tasks so the dark v5 UI can persist it
-- (urgent / high / medium / low). Existing "important" rows become "high".

alter table public.tasks
  add column if not exists priority text not null default 'medium'
  check (priority in ('urgent', 'high', 'medium', 'low'));

update public.tasks set priority = 'high' where important = true;
