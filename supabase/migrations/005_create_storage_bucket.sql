-- Create a storage bucket for paper PDFs if not exists
-- Note: In Supabase, buckets are managed via `storage.buckets` table
insert into storage.buckets (id, name, public)
select 'papers', 'papers', true
where not exists (select 1 from storage.buckets where id = 'papers');

-- Allow public read from the bucket
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access to papers'
  ) then
    create policy "Public Access to papers" on storage.objects
    for select using (bucket_id = 'papers');
  end if;
end $$;

-- Allow service-role (edge function) to insert
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Edge can upload to papers'
  ) then
    create policy "Edge can upload to papers" on storage.objects
    for insert with check (bucket_id = 'papers');
  end if;
end $$;

