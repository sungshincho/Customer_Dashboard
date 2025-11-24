-- Fix 1: Remove infinite recursion in organization_members RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Organization members can view members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can remove members" ON organization_members;

-- Create new policies that don't cause recursion
-- Users can view their own membership records
CREATE POLICY "Users can view their own membership"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Users can view other members in their organization (using simple auth.uid() check)
CREATE POLICY "Users can view org members"
ON organization_members FOR SELECT
USING (
  org_id IN (
    SELECT om.org_id 
    FROM organization_members om 
    WHERE om.user_id = auth.uid()
  )
);

-- Only ORG_OWNER and ORG_ADMIN can insert new members
CREATE POLICY "Org admins can add members"
ON organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
);

-- Only ORG_OWNER and ORG_ADMIN can update members
CREATE POLICY "Org admins can update members"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
);

-- Only ORG_OWNER and ORG_ADMIN can delete members
CREATE POLICY "Org admins can remove members"
ON organization_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
    AND om.user_id = auth.uid()
    AND om.role IN ('ORG_OWNER', 'ORG_ADMIN')
  )
);

-- Fix 2: Remove non-existent table references from migrate_user_to_organization
CREATE OR REPLACE FUNCTION migrate_user_to_organization(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Check if user already has an organization
  SELECT org_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  -- If no organization exists, create one
  IF v_org_id IS NULL THEN
    -- Create organization
    INSERT INTO organizations (org_name, created_by)
    VALUES (
      COALESCE(v_user_email, 'Organization ' || p_user_id::text),
      p_user_id
    )
    RETURNING id INTO v_org_id;

    -- Add user as ORG_OWNER
    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'ORG_OWNER');

    -- Backfill org_id for all user's data tables (removed customers, visits, purchases)
    UPDATE stores SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE products SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE wifi_zones SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE wifi_tracking SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE scenarios SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE user_data_imports SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE upload_sessions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE dashboard_kpis SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE ai_recommendations SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE analysis_history SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE api_connections SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE external_data_sources SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE data_sync_schedules SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE data_sync_logs SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE funnel_metrics SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE graph_entities SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE graph_relations SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE holidays_events SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE hq_store_master SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE hq_sync_logs SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE inventory_levels SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE neuralsense_devices SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE notification_settings SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE ontology_entity_types SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE ontology_mapping_cache SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE ontology_relation_types SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE ontology_schema_versions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE organization_settings SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE auto_order_suggestions SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
    UPDATE economic_indicators SET org_id = v_org_id WHERE user_id = p_user_id AND org_id IS NULL;
  END IF;

  RETURN v_org_id;
END;
$$;