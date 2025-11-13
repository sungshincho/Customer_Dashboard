-- Add 3D model metadata columns to ontology_entity_types
ALTER TABLE ontology_entity_types
ADD COLUMN IF NOT EXISTS model_3d_url text,
ADD COLUMN IF NOT EXISTS model_3d_dimensions jsonb DEFAULT '{"width": 1, "height": 1, "depth": 1}'::jsonb,
ADD COLUMN IF NOT EXISTS model_3d_type text CHECK (model_3d_type IN ('space', 'furniture', 'product', 'decoration', 'lighting')),
ADD COLUMN IF NOT EXISTS model_3d_metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN ontology_entity_types.model_3d_url IS 'URL to 3D model file (.glb) in Supabase Storage';
COMMENT ON COLUMN ontology_entity_types.model_3d_dimensions IS 'Real-world dimensions in meters {width, height, depth}';
COMMENT ON COLUMN ontology_entity_types.model_3d_type IS 'Category of 3D asset for scene composition';
COMMENT ON COLUMN ontology_entity_types.model_3d_metadata IS 'Additional 3D metadata (LOD levels, materials, etc.)';

-- Add 3D model metadata columns to graph_entities
ALTER TABLE graph_entities
ADD COLUMN IF NOT EXISTS model_3d_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS model_3d_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS model_3d_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb;

COMMENT ON COLUMN graph_entities.model_3d_position IS '3D position in scene coordinates';
COMMENT ON COLUMN graph_entities.model_3d_rotation IS '3D rotation in radians';
COMMENT ON COLUMN graph_entities.model_3d_scale IS '3D scale multiplier';