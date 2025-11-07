-- Add sheet_name column to user_data_imports table
ALTER TABLE public.user_data_imports 
ADD COLUMN IF NOT EXISTS sheet_name TEXT;

-- Add index for better performance when filtering by sheet
CREATE INDEX IF NOT EXISTS idx_user_data_imports_sheet_name 
ON public.user_data_imports(sheet_name);