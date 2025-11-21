-- Create 3d-models storage bucket for 3D model files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  '3d-models',
  '3d-models',
  true,
  52428800, -- 50MB limit
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
);

-- RLS policies for 3d-models bucket
CREATE POLICY "Users can upload their own 3D models"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own 3D models"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own 3D models"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own 3D models"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = '3d-models' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public access policy for viewing 3D models (since bucket is public)
CREATE POLICY "Public can view 3D models"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = '3d-models');