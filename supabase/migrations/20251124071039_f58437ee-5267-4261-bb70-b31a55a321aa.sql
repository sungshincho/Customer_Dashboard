-- Phase 4 (Part 3): Inventory, Ontology & Graph tables RLS policy conversion

-- ============================================================================
-- AUTO_ORDER_SUGGESTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own order suggestions" ON public.auto_order_suggestions;
DROP POLICY IF EXISTS "Users can delete their own order suggestions" ON public.auto_order_suggestions;
DROP POLICY IF EXISTS "Users can update their own order suggestions" ON public.auto_order_suggestions;
DROP POLICY IF EXISTS "Users can view their own order suggestions" ON public.auto_order_suggestions;

CREATE POLICY "Org members can view org order suggestions"
ON public.auto_order_suggestions FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org order suggestions"
ON public.auto_order_suggestions FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org order suggestions"
ON public.auto_order_suggestions FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org order suggestions"
ON public.auto_order_suggestions FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- INVENTORY_LEVELS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own inventory levels" ON public.inventory_levels;
DROP POLICY IF EXISTS "Users can delete their own inventory levels" ON public.inventory_levels;
DROP POLICY IF EXISTS "Users can update their own inventory levels" ON public.inventory_levels;
DROP POLICY IF EXISTS "Users can view their own inventory levels" ON public.inventory_levels;

CREATE POLICY "Org members can view org inventory levels"
ON public.inventory_levels FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org inventory levels"
ON public.inventory_levels FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org inventory levels"
ON public.inventory_levels FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org inventory levels"
ON public.inventory_levels FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- GRAPH_ENTITIES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own graph entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can create their store entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can delete their own graph entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can delete their store entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can update their own graph entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can update their store entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can view their own graph entities" ON public.graph_entities;
DROP POLICY IF EXISTS "Users can view their store entities" ON public.graph_entities;

CREATE POLICY "Org members can view org graph entities"
ON public.graph_entities FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org graph entities"
ON public.graph_entities FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org graph entities"
ON public.graph_entities FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org graph entities"
ON public.graph_entities FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- GRAPH_RELATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own graph relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can create their store relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can delete their own graph relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can delete their store relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can update their own graph relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can update their store relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can view their own graph relations" ON public.graph_relations;
DROP POLICY IF EXISTS "Users can view their store relations" ON public.graph_relations;

CREATE POLICY "Org members can view org graph relations"
ON public.graph_relations FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org graph relations"
ON public.graph_relations FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org graph relations"
ON public.graph_relations FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org graph relations"
ON public.graph_relations FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_auto_order_suggestions_org_id ON public.auto_order_suggestions(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_org_id ON public.inventory_levels(org_id);
CREATE INDEX IF NOT EXISTS idx_graph_entities_org_id ON public.graph_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_graph_relations_org_id ON public.graph_relations(org_id);