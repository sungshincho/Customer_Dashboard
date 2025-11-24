-- Phase 4 (Part 2): Integration & Data Sync tables RLS policy conversion

-- ============================================================================
-- API_CONNECTIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own API connections" ON public.api_connections;
DROP POLICY IF EXISTS "Users can delete their own API connections" ON public.api_connections;
DROP POLICY IF EXISTS "Users can update their own API connections" ON public.api_connections;
DROP POLICY IF EXISTS "Users can view their own API connections" ON public.api_connections;

CREATE POLICY "Org members can view org api connections"
ON public.api_connections FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can create org api connections"
ON public.api_connections FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can update org api connections"
ON public.api_connections FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org api connections"
ON public.api_connections FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- EXTERNAL_DATA_SOURCES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own data sources" ON public.external_data_sources;
DROP POLICY IF EXISTS "Users can delete their own data sources" ON public.external_data_sources;
DROP POLICY IF EXISTS "Users can update their own data sources" ON public.external_data_sources;
DROP POLICY IF EXISTS "Users can view their own data sources" ON public.external_data_sources;

CREATE POLICY "Org members can view org data sources"
ON public.external_data_sources FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can create org data sources"
ON public.external_data_sources FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can update org data sources"
ON public.external_data_sources FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org data sources"
ON public.external_data_sources FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- DATA_SYNC_SCHEDULES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own sync schedules" ON public.data_sync_schedules;
DROP POLICY IF EXISTS "Users can delete their own sync schedules" ON public.data_sync_schedules;
DROP POLICY IF EXISTS "Users can update their own sync schedules" ON public.data_sync_schedules;
DROP POLICY IF EXISTS "Users can view their own sync schedules" ON public.data_sync_schedules;

CREATE POLICY "Org members can view org sync schedules"
ON public.data_sync_schedules FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can create org sync schedules"
ON public.data_sync_schedules FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can update org sync schedules"
ON public.data_sync_schedules FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org sync schedules"
ON public.data_sync_schedules FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- DATA_SYNC_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON public.data_sync_logs;
DROP POLICY IF EXISTS "Users can view their own sync logs" ON public.data_sync_logs;

CREATE POLICY "Org members can view org sync logs"
ON public.data_sync_logs FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org sync logs"
ON public.data_sync_logs FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_api_connections_org_id ON public.api_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_external_data_sources_org_id ON public.external_data_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_schedules_org_id ON public.data_sync_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_org_id ON public.data_sync_logs(org_id);