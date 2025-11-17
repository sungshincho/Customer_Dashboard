import { supabase } from "@/integrations/supabase/client";
import type { ModelLayer } from "../components/ModelLayerManager";

/**
 * 사용자의 모든 3D 모델 로드
 * - Supabase Storage에서 업로드된 모델
 * - 온톨로지 엔티티 타입에 연결된 모델
 */
export async function loadUserModels(
  userId: string,
  storeId?: string
): Promise<ModelLayer[]> {
  const models: ModelLayer[] = [];

  try {
    // 1. Storage에서 업로드된 모델 로드
    const storagePath = storeId 
      ? `${userId}/${storeId}/3d-models`
      : `${userId}/3d-models`;

    const { data: files, error: storageError } = await supabase.storage
      .from('3d-models')
      .list(storagePath);

    if (!storageError && files) {
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
          const { data: { publicUrl } } = supabase.storage
            .from('3d-models')
            .getPublicUrl(`${storagePath}/${file.name}`);

          // 파일명에서 타입 추론
          const type = inferModelType(file.name);

          models.push({
            id: `storage-${file.name}`,
            name: file.name.replace(/\.(glb|gltf)$/i, ''),
            type,
            model_url: publicUrl,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
        }
      }
    }

    // 2. 온톨로지 엔티티 타입에서 3D 모델 로드
    const query = supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);

    if (storeId) {
      // 스토어 특정 엔티티 가져오기
      const { data: storeEntities } = await supabase
        .from('graph_entities')
        .select('entity_type_id')
        .eq('user_id', userId)
        .eq('store_id', storeId);

      if (storeEntities && storeEntities.length > 0) {
        const typeIds = [...new Set(storeEntities.map(e => e.entity_type_id))];
        query.in('id', typeIds);
      }
    }

    const { data: entityTypes, error: ontologyError } = await query;

    if (!ontologyError && entityTypes) {
      for (const entityType of entityTypes) {
        const type = inferModelTypeFromEntityType(entityType.name);
        
        models.push({
          id: `ontology-${entityType.id}`,
          name: entityType.label || entityType.name,
          type,
          model_url: entityType.model_3d_url!,
          dimensions: entityType.model_3d_dimensions as any,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          metadata: {
            entityTypeId: entityType.id,
            entityTypeName: entityType.name,
            color: entityType.color,
            icon: entityType.icon
          }
        });
      }
    }

    // 3. 온톨로지 엔티티 인스턴스에서 위치 정보 로드
    const { data: entities } = await supabase
      .from('graph_entities')
      .select('*')
      .eq('user_id', userId)
      .eq('store_id', storeId || '')
      .not('model_3d_position', 'is', null);

    if (entities) {
      for (const entity of entities) {
        const entityType = entityTypes?.find(et => et.id === entity.entity_type_id);
        if (!entityType) continue;

        const type = inferModelTypeFromEntityType(entityType.name);
        
        // Properties에 model_url이 있으면 (Storage 변환 인스턴스) 그것을 사용
        const properties = entity.properties as any;
        const modelUrl = properties?.model_url || entityType.model_3d_url;
        if (!modelUrl) continue;

        models.push({
          id: `entity-${entity.id}`,
          name: entity.label,
          type,
          model_url: modelUrl,
          dimensions: entityType.model_3d_dimensions as any,
          position: entity.model_3d_position as any || { x: 0, y: 0, z: 0 },
          rotation: entity.model_3d_rotation as any || { x: 0, y: 0, z: 0 },
          scale: entity.model_3d_scale as any || { x: 1, y: 1, z: 1 },
          metadata: {
            entityId: entity.id,
            entityTypeId: entity.entity_type_id,
            entityTypeName: entityType.name,
            properties: entity.properties
          }
        });
      }
    }

  } catch (error) {
    console.error('Error loading user models:', error);
  }

  return models;
}

/**
 * 파일명에서 모델 타입 추론
 */
function inferModelType(filename: string): ModelLayer['type'] {
  const lower = filename.toLowerCase();
  
  if (lower.includes('space') || lower.includes('store') || lower.includes('room')) {
    return 'space';
  }
  if (lower.includes('shelf') || lower.includes('rack') || lower.includes('furniture') || 
      lower.includes('table') || lower.includes('desk')) {
    return 'furniture';
  }
  if (lower.includes('product') || lower.includes('item')) {
    return 'product';
  }
  
  return 'other';
}

/**
 * 엔티티 타입 이름에서 모델 타입 추론
 */
function inferModelTypeFromEntityType(name: string): ModelLayer['type'] {
  const lower = name.toLowerCase();
  
  if (lower.includes('space') || lower.includes('store') || lower.includes('room') || 
      lower.includes('building') || lower.includes('floor')) {
    return 'space';
  }
  if (lower.includes('shelf') || lower.includes('rack') || lower.includes('furniture') || 
      lower.includes('table') || lower.includes('display') || lower.includes('counter')) {
    return 'furniture';
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('goods')) {
    return 'product';
  }
  
  return 'other';
}
