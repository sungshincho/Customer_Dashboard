-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_name TEXT NOT NULL,
  store_code TEXT NOT NULL,
  address TEXT,
  manager_name TEXT,
  phone TEXT,
  email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_code)
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Users can view their own stores"
  ON public.stores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stores"
  ON public.stores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores"
  ON public.stores
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores"
  ON public.stores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for store data
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-data', 'store-data', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store-data bucket
-- Users can view files in their own store folders
CREATE POLICY "Users can view their own store files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'store-data' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload files to their own store folders
CREATE POLICY "Users can upload to their own store folders"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update files in their own store folders
CREATE POLICY "Users can update their own store files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'store-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete files in their own store folders
CREATE POLICY "Users can delete their own store files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'store-data'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );