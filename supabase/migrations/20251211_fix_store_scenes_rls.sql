-- Fix store_scenes RLS policies to support organization members
-- Current policy only allows store owner (stores.user_id = auth.uid())
-- This change allows org members to create/update/delete scenes for org stores

-- Drop ALL existing policies (both simple and complex versions)
DROP POLICY IF EXISTS "Users can create their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can view their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can update their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can delete their store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can create their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can view their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can update their own store scenes" ON public.store_scenes;
DROP POLICY IF EXISTS "Users can delete their own store scenes" ON public.store_scenes;

-- Create new INSERT policy that supports both personal and org stores
CREATE POLICY "Users can create store scenes" ON public.store_scenes
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) AND (
    (store_id IS NULL) OR
    -- Personal store: user owns the store directly
    (EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_scenes.store_id
      AND stores.user_id = auth.uid()
      AND stores.org_id IS NULL
    )) OR
    -- Org store: user is a member of the org that owns the store
    (EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = store_scenes.store_id
      AND s.org_id IS NOT NULL
      AND om.user_id = auth.uid()
    ))
  )
);

-- Create new SELECT policy
CREATE POLICY "Users can view store scenes" ON public.store_scenes
FOR SELECT
USING (
  (auth.uid() = user_id) AND (
    (store_id IS NULL) OR
    -- Personal store
    (EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_scenes.store_id
      AND stores.user_id = auth.uid()
      AND stores.org_id IS NULL
    )) OR
    -- Org store
    (EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = store_scenes.store_id
      AND s.org_id IS NOT NULL
      AND om.user_id = auth.uid()
    ))
  )
);

-- Create new UPDATE policy
CREATE POLICY "Users can update store scenes" ON public.store_scenes
FOR UPDATE
USING (
  (auth.uid() = user_id) AND (
    (store_id IS NULL) OR
    -- Personal store
    (EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_scenes.store_id
      AND stores.user_id = auth.uid()
      AND stores.org_id IS NULL
    )) OR
    -- Org store
    (EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = store_scenes.store_id
      AND s.org_id IS NOT NULL
      AND om.user_id = auth.uid()
    ))
  )
);

-- Create new DELETE policy
CREATE POLICY "Users can delete store scenes" ON public.store_scenes
FOR DELETE
USING (
  (auth.uid() = user_id) AND (
    (store_id IS NULL) OR
    -- Personal store
    (EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = store_scenes.store_id
      AND stores.user_id = auth.uid()
      AND stores.org_id IS NULL
    )) OR
    -- Org store
    (EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.org_memberships om ON om.org_id = s.org_id
      WHERE s.id = store_scenes.store_id
      AND s.org_id IS NOT NULL
      AND om.user_id = auth.uid()
    ))
  )
);

-- Also allow org members to view scenes created by other org members for the same store
CREATE POLICY "Org members can view org store scenes" ON public.store_scenes
FOR SELECT
USING (
  store_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.org_memberships om ON om.org_id = s.org_id
    WHERE s.id = store_scenes.store_id
    AND s.org_id IS NOT NULL
    AND om.user_id = auth.uid()
  )
);
