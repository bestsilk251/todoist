alter table public.tasks
  add column if not exists priority text not null default 'medium'
  check (priority in ('urgent','high','medium','low'));

update public.tasks set priority = 'high' where important = true;;
