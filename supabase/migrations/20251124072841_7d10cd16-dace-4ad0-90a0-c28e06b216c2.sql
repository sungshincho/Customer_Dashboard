-- Phase 4: RLS 정책 전환 (user_id 기반 → org_id + 조직 멤버십 기반)
-- 남은 테이블들의 RLS 정책을 조직 기반으로 변경

-- 1. economic_indicators 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own economic indicators" ON economic_indicators;
DROP POLICY IF EXISTS "Users can insert their own economic indicators" ON economic_indicators;
DROP POLICY IF EXISTS "Users can update their own economic indicators" ON economic_indicators;
DROP POLICY IF EXISTS "Users can delete their own economic indicators" ON economic_indicators;

CREATE POLICY "Org members can view org economic indicators"
  ON economic_indicators FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org economic indicators"
  ON economic_indicators FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org economic indicators"
  ON economic_indicators FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org economic indicators"
  ON economic_indicators FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 2. funnel_metrics 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own funnel metrics" ON funnel_metrics;
DROP POLICY IF EXISTS "Users can insert their own funnel metrics" ON funnel_metrics;

CREATE POLICY "Org members can view org funnel metrics"
  ON funnel_metrics FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org funnel metrics"
  ON funnel_metrics FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org funnel metrics"
  ON funnel_metrics FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org funnel metrics"
  ON funnel_metrics FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 3. holidays_events 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own holidays/events" ON holidays_events;
DROP POLICY IF EXISTS "Users can insert their own holidays/events" ON holidays_events;
DROP POLICY IF EXISTS "Users can update their own holidays/events" ON holidays_events;
DROP POLICY IF EXISTS "Users can delete their own holidays/events" ON holidays_events;

CREATE POLICY "Org members can view org holidays/events"
  ON holidays_events FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org holidays/events"
  ON holidays_events FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org holidays/events"
  ON holidays_events FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org holidays/events"
  ON holidays_events FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 4. hq_store_master 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own HQ store master" ON hq_store_master;
DROP POLICY IF EXISTS "Users can insert their own HQ store master" ON hq_store_master;
DROP POLICY IF EXISTS "Users can update their own HQ store master" ON hq_store_master;
DROP POLICY IF EXISTS "Users can delete their own HQ store master" ON hq_store_master;

CREATE POLICY "Org members can view org HQ store master"
  ON hq_store_master FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can create org HQ store master"
  ON hq_store_master FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can update org HQ store master"
  ON hq_store_master FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org HQ store master"
  ON hq_store_master FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 5. hq_sync_logs 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own sync logs" ON hq_sync_logs;
DROP POLICY IF EXISTS "Users can insert their own sync logs" ON hq_sync_logs;

CREATE POLICY "Org members can view org sync logs"
  ON hq_sync_logs FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org sync logs"
  ON hq_sync_logs FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

-- 6. neuralsense_devices 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own devices" ON neuralsense_devices;
DROP POLICY IF EXISTS "Users can create their own devices" ON neuralsense_devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON neuralsense_devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON neuralsense_devices;

CREATE POLICY "Org members can view org devices"
  ON neuralsense_devices FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org devices"
  ON neuralsense_devices FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org devices"
  ON neuralsense_devices FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org devices"
  ON neuralsense_devices FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 7. notification_settings 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;

CREATE POLICY "Org members can view org notification settings"
  ON notification_settings FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org notification settings"
  ON notification_settings FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

-- 8. ontology_entity_types 테이블 RLS 정책 전환 (중복 정책 제거)
DROP POLICY IF EXISTS "Users can view their own entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can view their own ontology entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can create their own entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can create their own ontology entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can update their own entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can update their own ontology entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can delete their own entity types" ON ontology_entity_types;
DROP POLICY IF EXISTS "Users can delete their own ontology entity types" ON ontology_entity_types;

CREATE POLICY "Org members can view org entity types"
  ON ontology_entity_types FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org entity types"
  ON ontology_entity_types FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org entity types"
  ON ontology_entity_types FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org entity types"
  ON ontology_entity_types FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 9. ontology_mapping_cache 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own mapping cache" ON ontology_mapping_cache;
DROP POLICY IF EXISTS "Users can create their own mapping cache" ON ontology_mapping_cache;
DROP POLICY IF EXISTS "Users can update their own mapping cache" ON ontology_mapping_cache;
DROP POLICY IF EXISTS "Users can delete their own mapping cache" ON ontology_mapping_cache;

CREATE POLICY "Org members can view org mapping cache"
  ON ontology_mapping_cache FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org mapping cache"
  ON ontology_mapping_cache FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org mapping cache"
  ON ontology_mapping_cache FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org mapping cache"
  ON ontology_mapping_cache FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 10. ontology_relation_types 테이블 RLS 정책 전환 (중복 정책 제거)
DROP POLICY IF EXISTS "Users can view their own relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can view their own ontology relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can create their own relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can create their own ontology relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can update their own relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can update their own ontology relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can delete their own relation types" ON ontology_relation_types;
DROP POLICY IF EXISTS "Users can delete their own ontology relation types" ON ontology_relation_types;

CREATE POLICY "Org members can view org relation types"
  ON ontology_relation_types FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org relation types"
  ON ontology_relation_types FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can update org relation types"
  ON ontology_relation_types FOR UPDATE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org admins can delete org relation types"
  ON ontology_relation_types FOR DELETE
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_admin(auth.uid(), org_id))
  );

-- 11. ontology_schema_versions 테이블 RLS 정책 전환
DROP POLICY IF EXISTS "Users can view their own schema versions" ON ontology_schema_versions;
DROP POLICY IF EXISTS "Users can create their own schema versions" ON ontology_schema_versions;

CREATE POLICY "Org members can view org schema versions"
  ON ontology_schema_versions FOR SELECT
  USING (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

CREATE POLICY "Org members can create org schema versions"
  ON ontology_schema_versions FOR INSERT
  WITH CHECK (
    (org_id IS NULL AND auth.uid() = user_id) OR
    (org_id IS NOT NULL AND is_org_member(auth.uid(), org_id))
  );

-- 성능 최적화를 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_economic_indicators_org_id ON economic_indicators(org_id);
CREATE INDEX IF NOT EXISTS idx_funnel_metrics_org_id ON funnel_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_holidays_events_org_id ON holidays_events(org_id);
CREATE INDEX IF NOT EXISTS idx_hq_store_master_org_id ON hq_store_master(org_id);
CREATE INDEX IF NOT EXISTS idx_hq_sync_logs_org_id ON hq_sync_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_neuralsense_devices_org_id ON neuralsense_devices(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_org_id ON notification_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_entity_types_org_id ON ontology_entity_types(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_mapping_cache_org_id ON ontology_mapping_cache(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_relation_types_org_id ON ontology_relation_types(org_id);
CREATE INDEX IF NOT EXISTS idx_ontology_schema_versions_org_id ON ontology_schema_versions(org_id);