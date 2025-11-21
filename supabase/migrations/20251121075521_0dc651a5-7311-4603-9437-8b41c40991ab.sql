-- Enable RLS on all tables
ALTER TABLE graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_entity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ontology_relation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_scenes ENABLE ROW LEVEL SECURITY;

-- Graph Entities Policies
CREATE POLICY "Users can view their own graph entities"
  ON graph_entities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own graph entities"
  ON graph_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own graph entities"
  ON graph_entities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own graph entities"
  ON graph_entities FOR DELETE
  USING (auth.uid() = user_id);

-- Graph Relations Policies
CREATE POLICY "Users can view their own graph relations"
  ON graph_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own graph relations"
  ON graph_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own graph relations"
  ON graph_relations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own graph relations"
  ON graph_relations FOR DELETE
  USING (auth.uid() = user_id);

-- Ontology Entity Types Policies
CREATE POLICY "Users can view their own ontology entity types"
  ON ontology_entity_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ontology entity types"
  ON ontology_entity_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ontology entity types"
  ON ontology_entity_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ontology entity types"
  ON ontology_entity_types FOR DELETE
  USING (auth.uid() = user_id);

-- Ontology Relation Types Policies
CREATE POLICY "Users can view their own ontology relation types"
  ON ontology_relation_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ontology relation types"
  ON ontology_relation_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ontology relation types"
  ON ontology_relation_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ontology relation types"
  ON ontology_relation_types FOR DELETE
  USING (auth.uid() = user_id);

-- User Data Imports Policies
CREATE POLICY "Users can view their own data imports"
  ON user_data_imports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data imports"
  ON user_data_imports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data imports"
  ON user_data_imports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data imports"
  ON user_data_imports FOR DELETE
  USING (auth.uid() = user_id);

-- Dashboard KPIs Policies
CREATE POLICY "Users can view their own dashboard kpis"
  ON dashboard_kpis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard kpis"
  ON dashboard_kpis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard kpis"
  ON dashboard_kpis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard kpis"
  ON dashboard_kpis FOR DELETE
  USING (auth.uid() = user_id);

-- AI Recommendations Policies
CREATE POLICY "Users can view their own ai recommendations"
  ON ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ai recommendations"
  ON ai_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai recommendations"
  ON ai_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai recommendations"
  ON ai_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Store Scenes Policies
CREATE POLICY "Users can view their own store scenes"
  ON store_scenes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store scenes"
  ON store_scenes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store scenes"
  ON store_scenes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store scenes"
  ON store_scenes FOR DELETE
  USING (auth.uid() = user_id);