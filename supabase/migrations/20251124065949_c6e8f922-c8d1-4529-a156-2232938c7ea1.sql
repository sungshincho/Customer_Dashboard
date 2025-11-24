
-- Add missing columns to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS area_sqm numeric,
ADD COLUMN IF NOT EXISTS opening_date date,
ADD COLUMN IF NOT EXISTS store_format text,
ADD COLUMN IF NOT EXISTS hq_store_code text;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_status ON public.stores(status);

-- Create index on org_id and status for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_stores_org_status ON public.stores(org_id, status);
