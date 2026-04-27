-- Drop the previous restrictive policies that require authentication
DROP POLICY IF EXISTS "Allow authenticated users to upload invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete invoices" ON storage.objects;

-- Create policies that allow anon/public to insert and delete
-- This is necessary because the React app is currently using anon keys for uploading
create policy "Allow public uploads to invoices"
on storage.objects for insert
to public
with check ( bucket_id = 'invoices' );

create policy "Allow public deletion from invoices"
on storage.objects for delete
to public
using ( bucket_id = 'invoices' );
