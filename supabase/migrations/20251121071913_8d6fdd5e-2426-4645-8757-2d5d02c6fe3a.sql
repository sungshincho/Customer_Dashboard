-- Create store-data storage bucket for user data files
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-data', 'store-data', false);

-- RLS Policies for store-data bucket

-- 1. Users can upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-data' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Users can read files from their own folder
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'store-data'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Users can update files in their own folder
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-data'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Users can delete files from their own folder
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-data'
  AND (storage.foldername(name))[1] = auth.uid()::text
);