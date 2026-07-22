-- Preserve the exact moment a task was cancelled. Existing rows remain valid;
-- the client falls back to updated_at until those tasks change status again.
alter table public.tasks
  add column if not exists cancelled_at timestamptz;

comment on column public.tasks.cancelled_at is
  'Exact cancellation timestamp. Null for active and completed tasks.';

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

  if new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  elsif new.status <> 'cancelled' then
    new.cancelled_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_completion_metadata_trigger on public.tasks;
create trigger tasks_completion_metadata_trigger
before insert or update of status, duration_minutes on public.tasks
for each row execute function public.set_task_completion_metadata();

-- Public image delivery with owner-only writes. Files are stored under
-- <auth.uid()>/avatar.<extension>, so one user cannot replace another avatar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar owner insert" on storage.objects;
create policy "avatar owner insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar owner update" on storage.objects;
create policy "avatar owner update" on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
