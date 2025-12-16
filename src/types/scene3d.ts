// 3D Scene Composition Types

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface SceneAsset {
  id: string;
  model_url: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  dimensions?: ModelDimensions;
  metadata?: Record<string, any>;
}

export interface SpaceAsset extends SceneAsset {
  type: 'space';
  zone_name?: string;
  /** Blender에서 combined bake된 모델인지 여부 - true면 조명/환경 영향 제외 */
  isBaked?: boolean;
}

export interface FurnitureAsset extends SceneAsset {
  type: 'furniture';
  furniture_type?: string;
  movable?: boolean;
  suggested_position?: Vector3D;
  suggested_rotation?: Vector3D;
  optimization_reason?: string;
}

export type ProductDisplayType = 'hanging' | 'folded' | 'standing' | 'boxed' | 'stacked';

export interface ProductAsset extends SceneAsset {
  type: 'product';
  product_id?: string;
  sku?: string;
  movable?: boolean;
  display_type?: ProductDisplayType;
  suggested_position?: Vector3D;
  suggested_rotation?: Vector3D;
  optimization_reason?: string;
  // Placement info
  initial_furniture_id?: string;
  slot_id?: string;
  expected_impact?: {
    revenue_change_pct: number;
    visibility_score: number;
    accessibility_score: number;
  };
}

export interface StaffAsset extends SceneAsset {
  type: 'staff';
  staff_id: string;
  staff_name: string;
  role: string;
  assigned_zone_id?: string;
  shift_start?: string;
  shift_end?: string;
}

export interface CustomerAsset extends SceneAsset {
  type: 'customer';
  customer_id?: string;
  customer_segment: 'vip' | 'regular' | 'new';
  is_animated?: boolean;
  path_points?: Vector3D[];  // 동선 애니메이션용
  current_zone_id?: string;
}

export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position?: Vector3D;
  target?: Vector3D;
}

export interface LightingPreset {
  name: string;
  description: string;
  lights: LightConfig[];
  environment?: {
    background?: string;
    fog?: {
      color: string;
      near: number;
      far: number;
    };
  };
}

export interface EffectLayer {
  type: 'heatmap' | 'pathflow' | 'zone_highlight' | 'ai_suggestion';
  data: any;
  opacity?: number;
  blendMode?: string;
}

export interface SceneRecipe {
  space: SpaceAsset;
  furniture: FurnitureAsset[];
  products: ProductAsset[];
  staff?: StaffAsset[];
  customers?: CustomerAsset[];
  lighting: LightingPreset;
  effects?: EffectLayer[];
  camera?: {
    position: Vector3D;
    target: Vector3D;
    fov?: number;
  };
}

// Product Placement Types
export interface ProductPlacement {
  product_id: string;
  sku: string;
  model_url: string;

  initial_placement: {
    zone_id: string;
    furniture_id: string;
    furniture_type: string;
    slot_id: string;
    position: Vector3D;
    rotation: Vector3D;
    relative_position?: Vector3D;
  };

  optimization_result?: {
    suggested_zone_id?: string;
    suggested_furniture_id?: string;
    suggested_slot_id?: string;
    suggested_position: Vector3D;
    suggested_rotation?: Vector3D;
    optimization_reason: string;
    expected_impact: {
      revenue_change_pct: number;
      visibility_score: number;
      accessibility_score: number;
    };
    confidence: number;
  };

  movable: boolean;
}

// Layout Optimization Types
export interface AILayoutOptimizationResult {
  optimization_id: string;
  store_id: string;
  created_at: string;
  optimization_type: 'furniture' | 'product' | 'both';

  furniture_changes: Array<{
    furniture_id: string;
    furniture_type: string;
    movable: boolean;

    current: {
      zone_id: string;
      position: Vector3D;
      rotation: Vector3D;
    };

    suggested: {
      zone_id: string;
      position: Vector3D;
      rotation: Vector3D;
    };

    reason: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: number;
  }>;

  product_changes: Array<{
    product_id: string;
    sku: string;

    current: {
      zone_id: string;
      furniture_id: string;
      slot_id: string;
      position: Vector3D;
    };

    suggested: {
      zone_id: string;
      furniture_id: string;
      slot_id: string;
      position: Vector3D;
    };

    reason: string;
    priority: 'high' | 'medium' | 'low';
    expected_revenue_impact: number;
    expected_visibility_impact: number;
  }>;

  summary: {
    total_furniture_changes: number;
    total_product_changes: number;
    expected_revenue_improvement: number;
    expected_traffic_improvement: number;
    expected_conversion_improvement: number;
  };
}

// Furniture Slot Types
export type SlotType = 'hanger' | 'shelf' | 'table' | 'rack' | 'hook' | 'drawer';

export interface FurnitureSlot {
  id: string;
  furniture_id: string;
  furniture_type: string;
  slot_id: string;  // e.g., "A1", "B2", "TOP-L"
  slot_type?: SlotType;
  slot_position: Vector3D;  // Relative position within furniture
  slot_rotation: Vector3D;
  compatible_display_types?: ProductDisplayType[];  // Compatible product display types
  max_product_width?: number;
  max_product_height?: number;
  max_product_depth?: number;
  is_occupied: boolean;
  occupied_by_product_id?: string;
}

// Slot Snap Result
export interface SlotSnapResult {
  world_position: Vector3D;
  world_rotation: Vector3D;
  slot_id: string;
  furniture_id: string;
  furniture_world_position: Vector3D;
  furniture_world_rotation: Vector3D;
}

// Placement Visualization Config
export interface PlacementVisualizationConfig {
  showMovementPath: boolean;
  pathColor: string;
  pathWidth: number;
  pathAnimated: boolean;

  showGhostModel: boolean;
  ghostOpacity: number;
  ghostColor: string;

  showImpactIndicator: boolean;
  impactBadgePosition: 'top' | 'side';

  comparisonMode: 'side-by-side' | 'overlay' | 'toggle';
}

export interface AILayoutResult {
  zones: Array<{
    zone_id: string;
    zone_type: string;
    furniture: Array<{
      furniture_id: string;
      entity_type: string;
      movable?: boolean;
      current_position: Vector3D;
      position: Vector3D;
      suggested_position?: Vector3D;
      rotation: Vector3D;
      suggested_rotation?: Vector3D;
      optimization_reason?: string;
    }>;
    products: Array<{
      product_id: string;
      entity_type?: string;
      movable?: boolean;
      current_position?: Vector3D;
      position: Vector3D;
      suggested_position?: Vector3D;
      shelf_id?: string;
      optimization_reason?: string;
    }>;
  }>;
  lighting_suggestion?: string;
  heatmap_data?: any;
  optimization_summary?: string;
}

export interface OntologyQueryResult {
  entity_types: Array<{
    id: string;
    name: string;
    model_3d_url?: string;
    model_3d_dimensions?: ModelDimensions;
    model_3d_type?: string;
  }>;
  entities: Array<{
    id: string;
    entity_type_id: string;
    label: string;
    properties: Record<string, any>;
    model_3d_position?: Vector3D;
    model_3d_rotation?: Vector3D;
    model_3d_scale?: Vector3D;
  }>;
}
