-- Drop all existing document bucket policies to start fresh
DROP POLICY IF EXISTS "Admins can upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Create new simple policies without recursion

-- Admin upload policy - uses email directly, no role lookup
CREATE POLICY "Admin email can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (auth.jwt() ->> 'email') = 'williamsbenjaminacc@gmail.com'
);

-- Public read access - anyone can download
CREATE POLICY "Anyone can download documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Admin can update documents
CREATE POLICY "Admin email can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.jwt() ->> 'email') = 'williamsbenjaminacc@gmail.com'
);

-- Admin can delete documents
CREATE POLICY "Admin email can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (auth.jwt() ->> 'email') = 'williamsbenjaminacc@gmail.com'
);