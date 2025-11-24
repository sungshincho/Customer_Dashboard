-- =====================================================
-- Phase 3: Add org_id to Existing Data Tables
-- =====================================================
-- Adding org_id (nullable) to all data tables to preserve existing data
-- Will be backfilled and made NOT NULL in later phase

-- Core Store and Product Tables
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- KPI and Analytics Tables
ALTER TABLE public.dashboard_kpis
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.funnel_metrics
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.analysis_history
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Simulation Tables
ALTER TABLE public.scenarios
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.simulation_results
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.scenario_comparisons
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Graph/Ontology Tables
ALTER TABLE public.graph_entities
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.graph_relations
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.ontology_entity_types
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.ontology_relation_types
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.ontology_schema_versions
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.ontology_mapping_cache
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Data Management Tables
ALTER TABLE public.user_data_imports
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- AI Tables
ALTER TABLE public.ai_recommendations
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.ai_scene_analysis
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Inventory Tables
ALTER TABLE public.inventory_levels
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.auto_order_suggestions
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- External Data Tables
ALTER TABLE public.economic_indicators
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.holidays_events
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.regional_data
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Device and Hardware Tables
ALTER TABLE public.neuralsense_devices
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3D Scene Tables
ALTER TABLE public.store_scenes
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- HQ Sync Tables
ALTER TABLE public.hq_store_master
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.store_mappings
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.hq_sync_logs
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- External Integration Tables
ALTER TABLE public.external_data_sources
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.data_sync_schedules
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.data_sync_logs
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.api_connections
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Settings Tables
ALTER TABLE public.notification_settings
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.report_schedules
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.license_management
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =====================================================
-- Create Indexes for Performance
-- =====================================================
-- Indexes on org_id for faster filtering and joins

CREATE INDEX IF NOT EXISTS idx_stores_org_id ON public.stores(org_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_kpis_org_id ON public.dashboard_kpis(org_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_org_id ON public.scenarios(org_id);
CREATE INDEX IF NOT EXISTS idx_graph_entities_org_id ON public.graph_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_graph_relations_org_id ON public.graph_relations(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_entity_types_org_id ON public.ontology_entity_types(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relation_types_org_id ON public.ontology_relation_types(org_id);
CREATE INDEX IF NOT EXISTS idx_user_data_imports_org_id ON public.user_data_imports(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_org_id ON public.ai_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_store_scenes_org_id ON public.store_scenes(org_id);
CREATE INDEX IF NOT EXISTS idx_hq_store_master_org_id ON public.hq_store_master(org_id);