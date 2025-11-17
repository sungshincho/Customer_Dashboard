import { supabase } from "@/integrations/supabase/client";
import type { ModelLayer } from "../components/ModelLayerManager";
import { parseModelFilename } from "./modelFilenameParser";

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

    // 2. 온톨로지 엔티티 타입 메타데이터 로드 (인스턴스 참조용)
    const { data: entityTypes } = await supabase
      .from('ontology_entity_types')
      .select('*')
      .eq('user_id', userId);

    // 3. 온톨로지 엔티티 인스턴스만 로드 (개별 인스턴스명으로 표시)
    let entitiesQuery = supabase
      .from('graph_entities')
      .select('*, entity_type:ontology_entity_types(*)')
      .eq('user_id', userId);

    if (storeId) {
      entitiesQuery = entitiesQuery.eq('store_id', storeId);
    }

    const { data: entities } = await entitiesQuery;

    if (entities) {
      for (const entity of entities) {
        const entityType = entity.entity_type as any;
        if (!entityType) continue;

        // 엔티티 타입의 model_3d_type이 있으면 우선 사용, 없으면 이름으로 추론
        const type = entityType.model_3d_type || inferModelTypeFromEntityType(entityType.name);
        
        // Properties에 model_url이 있으면 (Storage 변환 인스턴스) 그것을 사용
        const properties = entity.properties as any;
        const modelUrl = properties?.model_url || entityType.model_3d_url;
        
        // 모델 URL이 없으면 스킵
        if (!modelUrl) continue;

        // 실제 파일명에서 dimensions 추출 (원본 파일명이 있는 경우)
        let actualDimensions = entityType.model_3d_dimensions as any;
        if (properties?.original_file) {
          const parsed = parseModelFilename(properties.original_file);
          if (parsed.isValid && parsed.dimensions) {
            actualDimensions = parsed.dimensions;
          }
        }

        models.push({
          id: `entity-${entity.id}`,
          name: entity.label,
          type,
          model_url: modelUrl,
          dimensions: actualDimensions,
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
  
  if (lower.includes('space') || lower.includes('store') || lower.includes('room') ||
      lower.includes('매장')) {
    return 'space';
  }
  if (lower.includes('shelf') || lower.includes('rack') || lower.includes('furniture') || 
      lower.includes('table') || lower.includes('desk') || lower.includes('mannequin') ||
      lower.includes('마네킹')) {
    return 'furniture';
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('제품')) {
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
      lower.includes('building') || lower.includes('floor') || lower.includes('매장')) {
    return 'space';
  }
  if (lower.includes('shelf') || lower.includes('rack') || lower.includes('furniture') || 
      lower.includes('table') || lower.includes('display') || lower.includes('counter') ||
      lower.includes('mannequin') || lower.includes('마네킹')) {
    return 'furniture';
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('goods') ||
      lower.includes('제품')) {
    return 'product';
  }
  
  return 'other';
}
