import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SceneRecipe, SpaceAsset, FurnitureAsset, ProductAsset } from '@/types/scene3d';

const DEFAULT_LIGHTING = {
  name: "기본 조명",
  description: "균형잡힌 매장 조명",
  lights: [
    { type: 'ambient' as const, color: '#ffffff', intensity: 0.5 },
    { type: 'directional' as const, color: '#ffffff', intensity: 0.8, position: { x: 5, y: 10, z: 5 } }
  ]
};

export function useStoreScene() {
  const { user } = useAuth();
  const [sceneRecipe, setSceneRecipe] = useState<SceneRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScene = async () => {
    if (!user) {
      setError('로그인이 필요합니다');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 온톨로지 엔티티 타입 가져오기
      const { data: entityTypes, error: entityTypesError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', user.id);

      if (entityTypesError) throw entityTypesError;

      // 온톨로지 엔티티 가져오기
      const { data: entities, error: entitiesError } = await supabase
        .from('graph_entities')
        .select('*')
        .eq('user_id', user.id);

      if (entitiesError) throw entitiesError;

      if (!entityTypes || !entities || entities.length === 0) {
        throw new Error('온톨로지 데이터가 없습니다');
      }

      // Space 찾기
      const spaceType = entityTypes.find(t => t.name === 'space' || t.model_3d_type === 'space');
      const spaceEntity = entities.find(e => e.entity_type_id === spaceType?.id);

      if (!spaceType || !spaceEntity) {
        throw new Error('매장 공간 정보를 찾을 수 없습니다');
      }

      const space: SpaceAsset = {
        id: spaceEntity.id,
        type: 'space',
        model_url: spaceType.model_3d_url || '',
        position: (spaceEntity.model_3d_position as any) || { x: 0, y: 0, z: 0 },
        rotation: (spaceEntity.model_3d_rotation as any) || { x: 0, y: 0, z: 0 },
        scale: (spaceEntity.model_3d_scale as any) || { x: 1, y: 1, z: 1 },
        dimensions: spaceType.model_3d_dimensions as any,
        zone_name: spaceEntity.label
      };

      // Furniture 찾기
      const furnitureType = entityTypes.find(t => t.name === 'furniture' || t.model_3d_type === 'furniture');
      const furnitureEntities = entities.filter(e => e.entity_type_id === furnitureType?.id);

      const furniture: FurnitureAsset[] = furnitureEntities.map(entity => ({
        id: entity.id,
        type: 'furniture',
        model_url: furnitureType?.model_3d_url || '',
        position: (entity.model_3d_position as any) || { x: 0, y: 0, z: 0 },
        rotation: (entity.model_3d_rotation as any) || { x: 0, y: 0, z: 0 },
        scale: (entity.model_3d_scale as any) || { x: 1, y: 1, z: 1 },
        dimensions: furnitureType?.model_3d_dimensions as any,
        furniture_type: entity.label
      }));

      // Products 찾기
      const productType = entityTypes.find(t => t.name === 'product' || t.model_3d_type === 'product');
      const productEntities = entities.filter(e => e.entity_type_id === productType?.id);

      const products: ProductAsset[] = productEntities.map(entity => ({
        id: entity.id,
        type: 'product',
        model_url: productType?.model_3d_url || '',
        position: (entity.model_3d_position as any) || { x: 0, y: 0, z: 0 },
        rotation: (entity.model_3d_rotation as any) || { x: 0, y: 0, z: 0 },
        scale: (entity.model_3d_scale as any) || { x: 1, y: 1, z: 1 },
        dimensions: productType?.model_3d_dimensions as any,
        sku: (entity.properties as any)?.sku,
        product_id: entity.id
      }));

      const recipe: SceneRecipe = {
        space,
        furniture,
        products,
        lighting: DEFAULT_LIGHTING,
        camera: {
          position: { x: 0, y: 5, z: 10 },
          target: { x: 0, y: 0, z: 0 },
          fov: 75
        }
      };

      setSceneRecipe(recipe);
    } catch (err) {
      console.error('씬 생성 실패:', err);
      setError(err instanceof Error ? err.message : '씬 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return {
    sceneRecipe,
    loading,
    error,
    generateScene,
    setSceneRecipe
  };
}
