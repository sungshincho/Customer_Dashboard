-- Phase 4 (Part 1): Core tables RLS policy conversion to organization-based access

-- ============================================================================
-- STORES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON public.stores;
DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;

CREATE POLICY "Org members can view org stores"
ON public.stores FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org stores"
ON public.stores FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can update org stores"
ON public.stores FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org stores"
ON public.stores FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- DASHBOARD_KPIS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own dashboard kpis" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can delete their own dashboard KPIs" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can delete their own dashboard kpis" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can insert their own dashboard KPIs" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can update their own dashboard KPIs" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can update their own dashboard kpis" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can view their own dashboard KPIs" ON public.dashboard_kpis;
DROP POLICY IF EXISTS "Users can view their own dashboard kpis" ON public.dashboard_kpis;

CREATE POLICY "Org members can view org dashboard kpis"
ON public.dashboard_kpis FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org dashboard kpis"
ON public.dashboard_kpis FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org dashboard kpis"
ON public.dashboard_kpis FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org dashboard kpis"
ON public.dashboard_kpis FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- ============================================================================
-- AI_RECOMMENDATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own ai recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can delete their own AI recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can delete their own ai recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can insert their own AI recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can update their own AI recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can update their own ai recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can view their own AI recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Users can view their own ai recommendations" ON public.ai_recommendations;

CREATE POLICY "Org members can view org ai recommendations"
ON public.ai_recommendations FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org ai recommendations"
ON public.ai_recommendations FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can update org ai recommendations"
ON public.ai_recommendations FOR UPDATE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can delete org ai recommendations"
ON public.ai_recommendations FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

-- ============================================================================
-- ANALYSIS_HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their store analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Users can delete their store analysis history" ON public.analysis_history;
DROP POLICY IF EXISTS "Users can view their store analysis history" ON public.analysis_history;

CREATE POLICY "Org members can view org analysis history"
ON public.analysis_history FOR SELECT TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org members can create org analysis history"
ON public.analysis_history FOR INSERT TO authenticated
WITH CHECK (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)
);

CREATE POLICY "Org admins can delete org analysis history"
ON public.analysis_history FOR DELETE TO authenticated
USING (
  org_id IS NULL AND auth.uid() = user_id
  OR org_id IS NOT NULL AND public.is_org_admin(auth.uid(), org_id)
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_stores_org_id ON public.stores(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_kpis_org_id ON public.dashboard_kpis(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_org_id ON public.ai_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_org_id ON public.analysis_history(org_id);