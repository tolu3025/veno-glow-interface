
-- First, let's create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$;

-- Drop existing problematic policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own role" ON public.user_roles;

-- Create new non-recursive policies for user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to insert roles (for admin setup)
CREATE POLICY "Authenticated users can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure storage policies don't reference user_roles recursively
-- Drop and recreate storage object policies that might be problematic
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public access to chat files" ON storage.objects;

-- Create simple storage policies
CREATE POLICY "Anyone can upload to chat-files bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can read from chat-files bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files');

CREATE POLICY "Anyone can update chat-files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-files');

CREATE POLICY "Anyone can delete from chat-files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-files');

-- Ensure the chat-files bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat-files';
