alter table public.tasks add column category text not null default 'Особисте';
alter table public.tasks add column important boolean not null default false;;
