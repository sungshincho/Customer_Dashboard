import { supabase } from "@/integrations/supabase/client";
import type { ModelLayer } from "../components/digital-twin/ModelLayerManager";
import { parseModelFilename } from "./modelFilenameParser";

/**
 * 사용자의 3D 모델 로드
 * 1. DB: graph_entities (3D 모델 인스턴스 - 위치/회전/스케일)
 * 2. DB: ontology_entity_types (3D 모델 타입 정의 - 인스턴스 없는 것들)
 * 3. Storage: 직접 업로드된 모델 (레거시 지원)
 */
export async function loadUserModels(
  userId: string,
  storeId?: string
): Promise<ModelLayer[]> {
  console.log('=== [loadUserModels] CALLED ===', { userId, storeId });

  const models: ModelLayer[] = [];
  const loadedUrls = new Set<string>(); // 중복 방지

  try {
    // ============================================
    // 1. DB에서 graph_entities 로드 (인스턴스)
    // ============================================
    if (storeId) {
      const { data: entities, error: entitiesError } = await supabase
        .from('graph_entities')
        .select(`
          id,
          label,
          properties,
          model_3d_position,
          model_3d_rotation,
          model_3d_scale,
          entity_type_id,
          ontology_entity_types (
            id,
            name,
            label,
            model_3d_url,
            model_3d_type,
            model_3d_dimensions,
            model_3d_metadata
          )
        `)
        .eq('store_id', storeId)
        .eq('user_id', userId);

      if (!entitiesError && entities) {
        console.log(`[ModelLoader] Section 1: Loading ${entities.length} entities from graph_entities`);

        for (const entity of entities) {
          const entityType = entity.ontology_entity_types as any;
          const properties = parseJsonField<Record<string, any>>(entity.properties, {});

          // model_url 우선순위:
          // 1순위: entity.properties.model_url (인스턴스별 개별 URL)
          // 2순위: entityType.model_3d_url (타입 기본 URL)
          const modelUrl = properties?.model_url || entityType?.model_3d_url || null;

          console.log(`[ModelLoader] Processing entity: ${entity.label}`, {
            hasPropertiesModelUrl: !!properties?.model_url,
            hasEntityTypeModelUrl: !!entityType?.model_3d_url,
            resolvedUrl: modelUrl ? modelUrl.substring(0, 50) + '...' : 'NONE',
            position: entity.model_3d_position,
          });

          // 3D 모델 URL이 있는 엔티티만 처리
          if (modelUrl) {
            const position = parseJsonField(entity.model_3d_position, { x: 0, y: 0, z: 0 });
            const rotation = parseJsonField(entity.model_3d_rotation, { x: 0, y: 0, z: 0 });
            const scale = parseJsonField(entity.model_3d_scale, { x: 1, y: 1, z: 1 });
            const dimensions = parseJsonField(entityType?.model_3d_dimensions, undefined);

            // model_3d_type으로 레이어 타입 결정
            const type = inferTypeFromModel3dType(entityType?.model_3d_type);

            console.log(`[ModelLoader] Entity: ${entity.label}, Position:`, position, `URL: ${modelUrl}`);

            models.push({
              id: `entity-${entity.id}`,
              name: entity.label || entityType?.label || entityType?.name || 'Unknown',
              type,
              model_url: modelUrl,
              dimensions,
              position,
              rotation,
              scale,
              metadata: {
                entityId: entity.id,
                entityTypeId: entityType?.id,
                entityTypeName: entityType?.label || entityType?.name,
                properties: entity.properties,
                model3dMetadata: entityType?.model_3d_metadata
              }
            });

            loadedUrls.add(modelUrl);
          }
        }
      }
    }

    // ============================================
    // 2. DB에서 entity_types 로드 (타입 정의 - 인스턴스 없는 것들)
    // ============================================
    console.log(`[ModelLoader] Section 2: Loading entity_types for user ${userId}`);
    const { data: entityTypes, error: typesError } = await supabase
      .from('ontology_entity_types')
      .select('id, name, label, model_3d_url, model_3d_type, model_3d_dimensions, model_3d_metadata')
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);

    console.log(`[ModelLoader] Found ${entityTypes?.length || 0} entity_types with model_3d_url`);

    if (!typesError && entityTypes) {
      for (const entityType of entityTypes) {
        // 이미 인스턴스로 로드된 URL은 스킵 (중복 방지)
        if (entityType.model_3d_url && !loadedUrls.has(entityType.model_3d_url)) {
          const dimensions = parseJsonField(entityType.model_3d_dimensions, undefined);
          const metadata = parseJsonField<{ defaultPosition?: { x: number; y: number; z: number } }>(entityType.model_3d_metadata, {});
          const type = inferTypeFromModel3dType(entityType.model_3d_type);

          // defaultPosition이 있으면 사용
          const defaultPosition = metadata?.defaultPosition || { x: 0, y: 0, z: 0 };

          console.log(`[ModelLoader] EntityType: ${entityType.label || entityType.name}, Position:`, defaultPosition, `(isTypeOnly: true)`);

          models.push({
            id: `type-${entityType.id}`,
            name: entityType.label || entityType.name,
            type,
            model_url: entityType.model_3d_url,
            dimensions,
            position: defaultPosition,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            metadata: {
              entityTypeId: entityType.id,
              entityTypeName: entityType.label || entityType.name,
              isTypeOnly: true, // 인스턴스 없이 타입만 있는 경우
              model3dMetadata: metadata
            }
          });

          loadedUrls.add(entityType.model_3d_url);
        } else if (loadedUrls.has(entityType.model_3d_url)) {
          console.log(`[ModelLoader] EntityType: ${entityType.label || entityType.name} - SKIPPED (already loaded as instance)`);
        }
      }
    }

    // ============================================
    // 3. Storage에서 직접 업로드된 모델 로드 (레거시)
    // ============================================
    // 여러 경로 형식 지원 (레거시 호환성)
    const storagePaths: string[] = [];
    if (storeId) {
      storagePaths.push(`${userId}/${storeId}`);  // 새 형식: userId/storeId
      storagePaths.push(storeId);                  // 레거시 형식: storeId만
    } else {
      storagePaths.push(userId);
    }

    for (const storagePath of storagePaths) {
      const { data: files, error: storageError } = await supabase.storage
        .from('3d-models')
        .list(storagePath);

      if (!storageError && files) {
        for (const file of files) {
          if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
            const { data: { publicUrl } } = supabase.storage
              .from('3d-models')
              .getPublicUrl(`${storagePath}/${file.name}`);

            // 이미 DB에서 로드된 URL은 스킵
            if (loadedUrls.has(publicUrl)) {
              continue;
            }

            // 파일명에서 타입 추론
            const type = inferModelTypeFromFilename(file.name);

            // 파일명에서 dimensions 추출
            const parsed = parseModelFilename(file.name);

            models.push({
              id: `storage-${storagePath}-${file.name}`,
              name: file.name.replace(/\.(glb|gltf)$/i, ''),
              type,
              model_url: publicUrl,
              dimensions: parsed.isValid && parsed.dimensions ? parsed.dimensions : undefined,
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            });

            loadedUrls.add(publicUrl);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error loading user models:', error);
  }

  // ============================================
  // 중복 제거: 같은 이름의 모델이 여러 개 있으면 위치값이 있는 것을 우선
  // ============================================
  const deduplicatedModels: ModelLayer[] = [];
  const modelsByName = new Map<string, ModelLayer[]>();

  // 이름별로 그룹화
  for (const model of models) {
    const existing = modelsByName.get(model.name) || [];
    existing.push(model);
    modelsByName.set(model.name, existing);
  }

  // 각 그룹에서 최적의 모델 선택
  for (const [name, group] of modelsByName) {
    if (group.length === 1) {
      deduplicatedModels.push(group[0]);
    } else {
      // 위치가 (0,0,0)이 아닌 것을 우선 선택
      const withPosition = group.filter(m =>
        m.position && (m.position.x !== 0 || m.position.y !== 0 || m.position.z !== 0)
      );

      if (withPosition.length > 0) {
        // 위치가 있는 것들만 추가
        deduplicatedModels.push(...withPosition);
        console.log(`[ModelLoader] Dedupe: "${name}" - kept ${withPosition.length} with position, removed ${group.length - withPosition.length} at origin`);
      } else {
        // 모두 (0,0,0)이면 첫 번째 하나만
        deduplicatedModels.push(group[0]);
        console.log(`[ModelLoader] Dedupe: "${name}" - all at origin, kept 1 of ${group.length}`);
      }
    }
  }

  console.log(`[ModelLoader] After deduplication: ${models.length} → ${deduplicatedModels.length} models`);

  // 타입 순서로 정렬: space > furniture > product > other
  const typeOrder = { space: 0, furniture: 1, product: 2, other: 3 };
  deduplicatedModels.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  console.log('=== [loadUserModels] COMPLETE ===', {
    totalModels: deduplicatedModels.length,
    models: deduplicatedModels.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      position: m.position,
    }))
  });

  return deduplicatedModels;
}

/**
 * model_3d_type 필드에서 레이어 타입 추론
 */
function inferTypeFromModel3dType(model3dType?: string): ModelLayer['type'] {
  if (!model3dType) return 'other';
  
  const lower = model3dType.toLowerCase();
  
  if (lower === 'building' || lower === 'space' || lower === 'store') {
    return 'space';
  }
  if (lower === 'furniture') {
    return 'furniture';
  }
  if (lower === 'product') {
    return 'product';
  }
  
  return 'other';
}

/**
 * 파일명에서 모델 타입 추론 (레거시 Storage 파일용)
 */
function inferModelTypeFromFilename(filename: string): ModelLayer['type'] {
  const lower = filename.toLowerCase();
  
  if (lower.includes('space') || lower.includes('store') || lower.includes('room') ||
      lower.includes('매장')) {
    return 'space';
  }
  if (lower.includes('shelf') || lower.includes('rack') || lower.includes('furniture') || 
      lower.includes('table') || lower.includes('desk') || lower.includes('mannequin') ||
      lower.includes('counter') || lower.includes('마네킹')) {
    return 'furniture';
  }
  if (lower.includes('product') || lower.includes('item') || lower.includes('제품')) {
    return 'product';
  }
  
  return 'other';
}

/**
 * JSON 필드 파싱 헬퍼
 */
function parseJsonField<T>(field: any, defaultValue: T): T {
  if (!field) return defaultValue;
  
  // 이미 객체인 경우
  if (typeof field === 'object') {
    return field as T;
  }
  
  // 문자열인 경우 파싱
  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      return defaultValue;
    }
  }
  
  return defaultValue;
}

