import { supabase } from "@/integrations/supabase/client";
import type { 
  SceneRecipe, 
  AILayoutResult, 
  OntologyQueryResult,
  SpaceAsset,
  FurnitureAsset,
  ProductAsset,
  LightingPreset,
  ModelDimensions,
  Vector3D
} from "@/types/scene3d";

const DEFAULT_LIGHTING: LightingPreset = {
  name: "default",
  description: "Default retail lighting",
  lights: [
    { type: "ambient", color: "#ffffff", intensity: 0.5 },
    { 
      type: "directional", 
      color: "#ffffff", 
      intensity: 0.8,
      position: { x: 5, y: 10, z: 5 },
      target: { x: 0, y: 0, z: 0 }
    }
  ]
};

export async function generateSceneRecipe(
  aiResult: AILayoutResult,
  userId: string
): Promise<SceneRecipe> {
  // Fetch ontology data
  const { data: entityTypes } = await supabase
    .from('ontology_entity_types')
    .select('*')
    .eq('user_id', userId);

  const { data: entities } = await supabase
    .from('graph_entities')
    .select('*')
    .eq('user_id', userId);

  const ontologyData: OntologyQueryResult = {
    entity_types: (entityTypes || []).map(et => ({
      id: et.id,
      name: et.name,
      model_3d_url: et.model_3d_url || undefined,
      model_3d_dimensions: et.model_3d_dimensions as unknown as ModelDimensions | undefined,
      model_3d_type: et.model_3d_type || undefined
    })),
    entities: (entities || []).map(e => ({
      id: e.id,
      entity_type_id: e.entity_type_id,
      label: e.label,
      properties: e.properties as Record<string, any>,
      model_3d_position: e.model_3d_position as unknown as Vector3D | undefined,
      model_3d_rotation: e.model_3d_rotation as unknown as Vector3D | undefined,
      model_3d_scale: e.model_3d_scale as unknown as Vector3D | undefined
    }))
  };

  // 1. Select Space Model
  const spaceType = entityTypes?.find(et => et.model_3d_type === 'space');
  const space: SpaceAsset = {
    id: 'main-space',
    type: 'space',
    model_url: spaceType?.model_3d_url || '/models/default-store.glb',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: spaceType?.model_3d_dimensions as unknown as ModelDimensions | undefined
  };

  // 2. Layout Furniture
  const furniture: FurnitureAsset[] = [];
  for (const zone of aiResult.zones) {
    for (const furnitureItem of zone.furniture || []) {
      const entity = entities?.find(e => e.id === furnitureItem.furniture_id);
      const entityType = entityTypes?.find(et => et.id === entity?.entity_type_id);
      
      if (entityType?.model_3d_url) {
        furniture.push({
          id: furnitureItem.furniture_id,
          type: 'furniture',
          model_url: entityType.model_3d_url,
          position: furnitureItem.position,
          rotation: furnitureItem.rotation,
          scale: (entity?.model_3d_scale as unknown as Vector3D) || { x: 1, y: 1, z: 1 },
          dimensions: entityType.model_3d_dimensions as unknown as ModelDimensions | undefined,
          furniture_type: entityType.name
        });
      }
    }
  }

  // 3. Place Products
  const products: ProductAsset[] = [];
  for (const zone of aiResult.zones) {
    for (const productItem of zone.products || []) {
      const entity = entities?.find(e => e.id === productItem.product_id);
      const entityType = entityTypes?.find(et => et.id === entity?.entity_type_id);
      
      if (entityType?.model_3d_url) {
        products.push({
          id: productItem.product_id,
          type: 'product',
          model_url: entityType.model_3d_url,
          position: productItem.position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: (entity?.model_3d_scale as unknown as Vector3D) || { x: 1, y: 1, z: 1 },
          dimensions: entityType.model_3d_dimensions as unknown as ModelDimensions | undefined,
          product_id: entity?.id,
          sku: (entity?.properties as any)?.sku as string | undefined
        });
      }
    }
  }

  // 4. Select Lighting
  let lighting = DEFAULT_LIGHTING;
  if (aiResult.lighting_suggestion) {
    try {
      const response = await fetch(`/lighting-presets/${aiResult.lighting_suggestion}.json`);
      if (response.ok) {
        lighting = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load lighting preset, using default', error);
    }
  }

  // 5. Apply Effects
  const effects = [];
  if (aiResult.heatmap_data) {
    effects.push({
      type: 'heatmap' as const,
      data: aiResult.heatmap_data,
      opacity: 0.6
    });
  }

  return {
    space,
    furniture,
    products,
    lighting,
    effects,
    camera: {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };
}
