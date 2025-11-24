-- Phase 4: Convert products table RLS policies to organization-based access

-- Drop existing user_id-based policies on products
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;

-- Create organization-based RLS policies for products
CREATE POLICY "Org members can view org products"
ON public.products
FOR SELECT
TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can update org products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org products"
ON public.products
FOR DELETE
TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_user_org ON public.products(user_id, org_id);