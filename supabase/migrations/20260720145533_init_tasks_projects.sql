create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  due_date date,
  due_time time,
  is_all_day boolean not null default true,
  needs_confirmation boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'done')),
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_due_date_idx on public.tasks (user_id, due_date);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy tasks_owner_policy on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy projects_owner_policy on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.tasks;;
