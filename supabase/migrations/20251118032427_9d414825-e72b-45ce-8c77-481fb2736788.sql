-- Add file_path column to user_data_imports for tracking storage location
ALTER TABLE user_data_imports 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add comment for clarity
COMMENT ON COLUMN user_data_imports.file_path IS 'Storage path of the original file in store-data bucket';