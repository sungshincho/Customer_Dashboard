-- Create store_scenes table for saving 3D scene recipes
CREATE TABLE public.store_scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Scene',
  recipe_data jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.store_scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their store scenes"
ON public.store_scenes
FOR SELECT
USING (
  auth.uid() = user_id 
  AND (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_scenes.store_id 
    AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create their store scenes"
ON public.store_scenes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_scenes.store_id 
    AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their store scenes"
ON public.store_scenes
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_scenes.store_id 
    AND stores.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their store scenes"
ON public.store_scenes
FOR DELETE
USING (
  auth.uid() = user_id 
  AND (store_id IS NULL OR EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_scenes.store_id 
    AND stores.user_id = auth.uid()
  ))
);

-- Trigger for updated_at
CREATE TRIGGER update_store_scenes_updated_at
BEFORE UPDATE ON public.store_scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_store_scenes_user_id ON public.store_scenes(user_id);
CREATE INDEX idx_store_scenes_store_id ON public.store_scenes(store_id);
CREATE INDEX idx_store_scenes_is_active ON public.store_scenes(is_active) WHERE is_active = true;