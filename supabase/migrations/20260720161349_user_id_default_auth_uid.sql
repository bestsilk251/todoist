alter table public.tasks alter column user_id set default auth.uid();
alter table public.projects alter column user_id set default auth.uid();;
