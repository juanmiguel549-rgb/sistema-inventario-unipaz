-- Create a new storage bucket for invoices
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Set up Role Level Security for the bucket
-- Allow public access to read files (so the PDF viewer works)
create policy "Allow public to read invoices"
on storage.objects for select
to public
using ( bucket_id = 'invoices' );

-- Allow authenticated users to upload files
create policy "Allow authenticated users to upload invoices"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'invoices' );

-- Allow authenticated users to delete their files
create policy "Allow authenticated users to delete invoices"
on storage.objects for delete
to authenticated
using ( bucket_id = 'invoices' );
