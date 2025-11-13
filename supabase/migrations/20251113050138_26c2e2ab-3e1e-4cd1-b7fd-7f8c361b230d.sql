-- Create storage bucket for store data
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-data', 'store-data', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store-data bucket
-- Users can view files in their own store folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own store files'
  ) THEN
    CREATE POLICY "Users can view their own store files"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'store-data' 
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Users can upload files to their own store folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload to their own store folders'
  ) THEN
    CREATE POLICY "Users can upload to their own store folders"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'store-data'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Users can update files in their own store folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own store files'
  ) THEN
    CREATE POLICY "Users can update their own store files"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'store-data'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Users can delete files in their own store folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own store files'
  ) THEN
    CREATE POLICY "Users can delete their own store files"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'store-data'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;