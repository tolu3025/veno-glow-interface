-- Fix infinite recursion issue in storage policies for documents bucket
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin access to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;

-- Create proper storage policies for documents bucket using security definer function
CREATE POLICY "Admins can insert documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Anyone can view public documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');