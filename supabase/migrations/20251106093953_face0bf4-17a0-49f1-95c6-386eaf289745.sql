-- Create table for user data imports
CREATE TABLE public.user_data_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  data_type TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  row_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own imports" 
ON public.user_data_imports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imports" 
ON public.user_data_imports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imports" 
ON public.user_data_imports 
FOR DELETE 
USING (auth.uid() = user_id);