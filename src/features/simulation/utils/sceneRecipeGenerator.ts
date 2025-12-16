import { supabase } from "@/integrations/supabase/client";
import type {
  SceneRecipe,
  AILayoutResult,
  OntologyQueryResult,
  SpaceAsset,
  FurnitureAsset,
  ProductAsset,
  StaffAsset,
  CustomerAsset,
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
    model_url: spaceType?.model_3d_url || '', // Empty string will trigger fallback rendering
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

  // 6. Load Staff Avatars
  const staff = await loadStaffAvatars(userId);

  // 7. Load Customer Avatars (for simulation)
  const customers = await loadCustomerAvatars(userId);

  return {
    space,
    furniture,
    products,
    staff,
    customers,
    lighting,
    effects,
    camera: {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };
}

/**
 * Load staff avatars from staff table
 */
async function loadStaffAvatars(userId: string): Promise<StaffAsset[]> {
  const { data: staffData, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('Failed to load staff avatars:', error);
    return [];
  }

  return (staffData || [])
    .filter(s => s.avatar_url)
    .map(s => ({
      id: s.id,
      type: 'staff' as const,
      model_url: s.avatar_url!,
      position: (s.avatar_position as Vector3D) || { x: 0, y: 0, z: 0 },
      rotation: (s.avatar_rotation as Vector3D) || { x: 0, y: 0, z: 0 },
      scale: (s.avatar_scale as Vector3D) || { x: 1, y: 1, z: 1 },
      staff_id: s.id,
      staff_name: s.staff_name,
      role: s.role || 'staff',
      assigned_zone_id: s.assigned_zone_id || s.department
    }));
}

/**
 * Load customer avatars for simulation
 * Uses generic avatar models based on customer segment
 */
async function loadCustomerAvatars(userId: string): Promise<CustomerAsset[]> {
  const { data: customersData, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .not('avatar_url', 'is', null)
    .limit(50); // Limit for performance

  if (error) {
    console.warn('Failed to load customer avatars:', error);
    return [];
  }

  return (customersData || [])
    .filter(c => c.avatar_url)
    .map(c => ({
      id: c.id,
      type: 'customer' as const,
      model_url: c.avatar_url!,
      position: { x: 0, y: 0, z: 0 }, // Position will be determined by simulation
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      customer_id: c.id,
      customer_segment: (c.avatar_type as 'vip' | 'regular' | 'new') || 'regular',
      is_animated: false
    }));
}

/**
 * Generate scene recipe with store-specific data
 */
export async function generateSceneRecipeForStore(
  storeId: string,
  userId: string
): Promise<SceneRecipe> {
  // Fetch products with placement info
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId);

  // Fetch staff with avatars
  const { data: staffData } = await supabase
    .from('staff')
    .select('*')
    .eq('store_id', storeId);

  // Fetch entity types for 3D models
  const { data: entityTypes } = await supabase
    .from('ontology_entity_types')
    .select('*')
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`);

  // Build products array with placement info
  const products: ProductAsset[] = (productsData || [])
    .filter(p => p.model_3d_url)
    .map(p => ({
      id: p.id,
      type: 'product' as const,
      model_url: p.model_3d_url!,
      position: (p.model_3d_position as Vector3D) || { x: 0, y: 0, z: 0 },
      rotation: (p.model_3d_rotation as Vector3D) || { x: 0, y: 0, z: 0 },
      scale: (p.model_3d_scale as Vector3D) || { x: 1, y: 1, z: 1 },
      product_id: p.id,
      sku: p.sku,
      movable: p.movable ?? true,
      initial_furniture_id: p.initial_furniture_id,
      slot_id: p.slot_id
    }));

  // Build staff array with avatars
  const staff: StaffAsset[] = (staffData || [])
    .filter(s => s.avatar_url)
    .map(s => ({
      id: s.id,
      type: 'staff' as const,
      model_url: s.avatar_url!,
      position: (s.avatar_position as Vector3D) || { x: 0, y: 0, z: 0 },
      rotation: (s.avatar_rotation as Vector3D) || { x: 0, y: 0, z: 0 },
      scale: (s.avatar_scale as Vector3D) || { x: 1, y: 1, z: 1 },
      staff_id: s.id,
      staff_name: s.staff_name,
      role: s.role || 'staff',
      assigned_zone_id: s.assigned_zone_id || s.department
    }));

  // Find space model from entity types
  const spaceType = entityTypes?.find(et => et.model_3d_type === 'space');
  const space: SpaceAsset = {
    id: 'main-space',
    type: 'space',
    model_url: spaceType?.model_3d_url || '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: spaceType?.model_3d_dimensions as unknown as ModelDimensions | undefined
  };

  return {
    space,
    furniture: [], // Furniture loaded separately
    products,
    staff,
    customers: [], // Customers loaded for simulation
    lighting: DEFAULT_LIGHTING,
    effects: [],
    camera: {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };
}
