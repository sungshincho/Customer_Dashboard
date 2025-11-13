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
}

export interface FurnitureAsset extends SceneAsset {
  type: 'furniture';
  furniture_type?: string;
  movable?: boolean;
  suggested_position?: Vector3D;
  suggested_rotation?: Vector3D;
  optimization_reason?: string;
}

export interface ProductAsset extends SceneAsset {
  type: 'product';
  product_id?: string;
  sku?: string;
  movable?: boolean;
  suggested_position?: Vector3D;
  suggested_rotation?: Vector3D;
  optimization_reason?: string;
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
  lighting: LightingPreset;
  effects?: EffectLayer[];
  camera?: {
    position: Vector3D;
    target: Vector3D;
    fov?: number;
  };
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
