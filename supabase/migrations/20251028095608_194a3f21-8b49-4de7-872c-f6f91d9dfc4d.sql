-- Clean up old insecure admin email-based policies
DROP POLICY IF EXISTS "Admin email can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin email can delete documents" ON storage.objects;