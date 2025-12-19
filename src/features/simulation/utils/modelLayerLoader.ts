import { supabase } from "@/integrations/supabase/client";
import type { ModelLayer } from "../components/digital-twin/ModelLayerManager";
import { parseModelFilename } from "./modelFilenameParser";

/**
 * 사용자의 3D 모델 로드 (v3 - stores/furniture/products 테이블 직접 로드)
 * 1. DB: stores (매장 공간 3D 모델)
 * 2. DB: furniture (가구 테이블)
 * 3. DB: products (상품 3D 모델)
 * 4. DB: ontology_entity_types (기본 모델 타입 - 레거시)
 * 5. Storage: 직접 업로드된 모델 (레거시 지원)
 */
export async function loadUserModels(
  userId: string,
  storeId?: string
): Promise<ModelLayer[]> {
  console.log('=== [loadUserModels] v3 CALLED ===', { userId, storeId });

  const models: ModelLayer[] = [];
  const loadedUrls = new Set<string>(); // 중복 방지

  try {
    if (storeId) {
      // ============================================
      // 0. stores 테이블에서 매장 공간 모델 로드
      // ============================================
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      const storeAny = storeData as any;
      if (!storeError && storeAny && storeAny.model_3d_url) {
        console.log(`[ModelLoader] Section 0: Loading store space model: ${storeAny.store_name}`);
        models.push({
          id: `space-${storeAny.id}`,
          name: storeAny.store_name || 'Store Space',
          type: 'space',
          model_url: storeAny.model_3d_url,
          dimensions: parseJsonField(storeAny.dimensions, undefined),
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          metadata: {
            storeId: storeAny.id,
            storeName: storeAny.store_name
          }
        });
        loadedUrls.add(storeAny.model_3d_url);
        console.log(`[ModelLoader] Store: ${storeAny.store_name}, Model URL: ${storeAny.model_3d_url}`);
      } else if (storeError) {
        console.error('[ModelLoader] Error loading store:', storeError);
      }

      // ============================================
      // 1. furniture 테이블에서 가구 로드
      // ============================================
      const { data: furnitureData, error: furnitureError } = await supabase
        .from('furniture')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (!furnitureError && furnitureData) {
        console.log(`[ModelLoader] Section 1: Loading ${furnitureData.length} furniture items`);

        for (const f of furnitureData) {
          if (f.model_url) {
            // position/rotation/scale은 JSONB 또는 개별 컬럼일 수 있음
            const pos = parseJsonField((f as any).position, null) ||
                       { x: Number((f as any).position_x) || 0, y: Number((f as any).position_y) || 0, z: Number((f as any).position_z) || 0 };
            const rot = parseJsonField((f as any).rotation, null) ||
                       { x: Number((f as any).rotation_x) || 0, y: Number((f as any).rotation_y) || 0, z: Number((f as any).rotation_z) || 0 };
            const scl = parseJsonField((f as any).scale, null) ||
                       { x: Number((f as any).scale_x) || 1, y: Number((f as any).scale_y) || 1, z: Number((f as any).scale_z) || 1 };

            models.push({
              id: `furniture-${f.id}`,
              name: (f as any).furniture_name || f.name || 'Furniture',
              type: 'furniture',
              model_url: f.model_url,
              dimensions: {
                width: f.width || 1,
                height: f.height || 1,
                depth: f.depth || 1
              },
              position: pos,
              rotation: rot,
              scale: scl,
              metadata: {
                furnitureId: f.id,
                furnitureType: f.furniture_type,
                furnitureCode: (f as any).furniture_code,
                zoneId: (f as any).zone_id,
                movable: (f as any).movable,
                properties: f.properties
              }
            });
            loadedUrls.add(f.model_url);
            console.log(`[ModelLoader] Furniture: ${(f as any).furniture_name || f.name}, Type: ${f.furniture_type}, Position:`, pos);
          }
        }
      } else if (furnitureError) {
        console.error('[ModelLoader] Error loading furniture:', furnitureError);
      }

      // ============================================
      // 2. products 테이블에서 상품 3D 모델 로드
      // ============================================
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .not('model_3d_url', 'is', null);

      if (!productsError && productsData) {
        console.log(`[ModelLoader] Section 2: Loading ${productsData.length} products with 3D models`);

        for (const p of productsData) {
          if (p.model_3d_url) {
            // 🔍 디버그: DB 원본 값 출력
            console.log(`[ModelLoader] Product ${p.product_name} raw DB values:`, {
              model_3d_position: (p as any).model_3d_position,
              model_3d_position_type: typeof (p as any).model_3d_position,
            });

            const pos = parseJsonField((p as any).model_3d_position, { x: 0, y: 0, z: 0 });
            const rot = parseJsonField((p as any).model_3d_rotation, { x: 0, y: 0, z: 0 });
            const scl = parseJsonField((p as any).model_3d_scale, { x: 1, y: 1, z: 1 });

            models.push({
              id: `product-${p.id}`,
              name: p.product_name || p.sku || 'Product',
              type: 'product',
              model_url: p.model_3d_url,
              position: pos,
              rotation: rot,
              scale: scl,
              metadata: {
                productId: p.id,
                productName: p.product_name,
                sku: p.sku,
                category: p.category,
                initialFurnitureId: (p as any).initial_furniture_id,
                slotId: (p as any).slot_id,
                movable: (p as any).movable ?? true
              }
            });
            loadedUrls.add(p.model_3d_url);
            console.log(`[ModelLoader] Product: ${p.product_name}, SKU: ${p.sku}, Position:`, pos);
          }
        }
      } else if (productsError) {
        console.error('[ModelLoader] Error loading products:', productsError);
      }

      // ============================================
      // 3. product_placements 테이블에서 상품 배치 로드 (v3 - 슬롯/가구 조인 포함)
      // ============================================
      const { data: placementsData, error: placementsError } = await (supabase as any)
        .from('product_placements')
        .select(`
          *,
          products (
            id,
            product_name,
            category,
            sku,
            model_3d_url
          ),
          furniture_slots (
            id,
            slot_index,
            slot_position,
            slot_rotation,
            furniture:furniture_id (
              id,
              furniture_name,
              position,
              rotation
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true);

      if (!placementsError && placementsData) {
        console.log(`[ModelLoader] Section 3: Loading ${placementsData.length} product placements`);

        for (const placement of placementsData) {
          const p = placement as any;
          const product = p.products;
          const slot = p.furniture_slots;
          const furniture = slot?.furniture;

          // model_3d_url 우선, 없으면 placement의 model_url, 마지막으로 기본 URL
          const modelUrl = product?.model_3d_url || p.model_url || getDefaultProductModelUrl(product?.category);

          if (modelUrl) {
            // 슬롯이 있으면 월드 좌표 계산 (가구 위치 + 슬롯 오프셋)
            let worldPosition = { x: Number(p.position_x) || 0, y: Number(p.position_y) || 0, z: Number(p.position_z) || 0 };
            let worldRotation = { x: Number(p.rotation_x) || 0, y: Number(p.rotation_y) || 0, z: Number(p.rotation_z) || 0 };

            if (slot && furniture) {
              const furniturePos = parseJsonField(furniture.position, { x: 0, y: 0, z: 0 });
              const furnitureRot = parseJsonField(furniture.rotation, { x: 0, y: 0, z: 0 });
              const slotOffset = parseJsonField(slot.slot_position, { x: 0, y: 0, z: 0 });
              const slotRot = parseJsonField(slot.slot_rotation, { x: 0, y: 0, z: 0 });

              // 월드 좌표 = 가구 위치 + 슬롯 오프셋
              worldPosition = {
                x: furniturePos.x + slotOffset.x,
                y: furniturePos.y + slotOffset.y,
                z: furniturePos.z + slotOffset.z
              };

              // 회전 합산
              worldRotation = {
                x: furnitureRot.x + slotRot.x,
                y: furnitureRot.y + slotRot.y,
                z: furnitureRot.z + slotRot.z
              };

              console.log(`[ModelLoader] Placement ${product?.product_name}: furniture(${furniture.furniture_name}) + slot → world:`, worldPosition);
            }

            models.push({
              id: `placement-${p.id}`,  // placement- prefix로 변경하여 products와 구분
              name: product?.product_name || 'Unknown Product',
              type: 'product',
              model_url: modelUrl,
              position: worldPosition,
              rotation: worldRotation,
              scale: { x: Number(p.scale_x) || 1, y: Number(p.scale_y) || 1, z: Number(p.scale_z) || 1 },
              metadata: {
                placementId: p.id,
                productId: p.product_id,
                productName: product?.product_name,
                category: product?.category,
                sku: product?.sku,
                slotId: p.slot_id,
                slotIndex: slot?.slot_index,
                furnitureId: furniture?.id,
                furnitureName: furniture?.furniture_name,
                zoneId: p.zone_id,
                displayQuantity: p.display_quantity,
                properties: p.properties,
                isPlacement: true  // placement에서 온 데이터임을 표시
              }
            });
            loadedUrls.add(modelUrl);
            console.log(`[ModelLoader] Placement: ${product?.product_name}, Slot: ${slot?.slot_index ?? 'none'}, Position:`, worldPosition);
          }
        }
      } else if (placementsError) {
        console.error('[ModelLoader] Error loading product placements:', placementsError);
      }
    }

    // ============================================
    // 4. DB에서 entity_types 로드 (레거시 - 기본 모델)
    // ============================================
    console.log(`[ModelLoader] Section 4: Loading entity_types for user ${userId} (legacy)`);
    const { data: entityTypes, error: typesError } = await supabase
      .from('ontology_entity_types')
      .select('id, name, label, model_3d_url, model_3d_type, model_3d_dimensions, model_3d_metadata')
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);

    console.log(`[ModelLoader] Found ${entityTypes?.length || 0} entity_types with model_3d_url`);

    if (!typesError && entityTypes) {
      for (const entityType of entityTypes) {
        // 이미 로드된 URL은 스킵 (중복 방지)
        if (entityType.model_3d_url && !loadedUrls.has(entityType.model_3d_url)) {
          const dimensions = parseJsonField(entityType.model_3d_dimensions, undefined);
          const metadata = parseJsonField<{ defaultPosition?: { x: number; y: number; z: number } }>(entityType.model_3d_metadata, {});
          const type = inferTypeFromModel3dType(entityType.model_3d_type);
          const defaultPosition = metadata?.defaultPosition || { x: 0, y: 0, z: 0 };

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
              isTypeOnly: true,
              model3dMetadata: metadata
            }
          });

          loadedUrls.add(entityType.model_3d_url);
          console.log(`[ModelLoader] EntityType: ${entityType.label || entityType.name}, Type: ${type}`);
        }
      }
    }

    // ============================================
    // 5. Storage에서 직접 업로드된 모델 로드 (레거시)
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
  // 중복 제거: placement 우선, productId 기준으로 중복 제거
  // - placement 데이터는 모두 유지 (동일 상품이 여러 슬롯에 배치 가능)
  // - products 테이블 데이터는 해당 productId의 placement가 없을 때만 유지
  // ============================================
  const deduplicatedModels: ModelLayer[] = [];
  const placementProductIds = new Set<string>();

  // 1차: placement 모델 모두 추가 (슬롯 배치된 상품)
  for (const model of models) {
    if ((model.metadata as any)?.isPlacement) {
      deduplicatedModels.push(model);
      const productId = (model.metadata as any)?.productId;
      if (productId) {
        placementProductIds.add(productId);
      }
    }
  }

  console.log(`[ModelLoader] Dedupe: Added ${deduplicatedModels.length} placements, productIds:`, Array.from(placementProductIds));

  // 2차: non-placement 모델 중 placement가 없는 것만 추가
  const modelsByName = new Map<string, ModelLayer[]>();

  for (const model of models) {
    if ((model.metadata as any)?.isPlacement) continue; // placement는 이미 추가됨

    // products 테이블 데이터: 해당 productId의 placement가 있으면 스킵
    if (model.id.startsWith('product-')) {
      const productId = (model.metadata as any)?.productId;
      if (productId && placementProductIds.has(productId)) {
        console.log(`[ModelLoader] Dedupe: Skipping raw product "${model.name}" (productId: ${productId}) - has placement`);
        continue;
      }
    }

    // 나머지는 이름별로 그룹화
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
        deduplicatedModels.push(...withPosition);
        console.log(`[ModelLoader] Dedupe: "${name}" - kept ${withPosition.length} with position, removed ${group.length - withPosition.length} at origin`);
      } else {
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
 * 카테고리별 기본 상품 모델 URL 반환
 */
function getDefaultProductModelUrl(category?: string): string | null {
  // TODO: 실제 기본 모델 URL로 교체 필요
  const defaults: Record<string, string> = {
    'outer': 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/defaults/product_coat.glb',
    'top': 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/defaults/product_top.glb',
    'bottom': 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/defaults/product_pants.glb',
    'shoes': 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/defaults/product_shoes.glb',
    'accessory': 'https://bdrvowacecxnraaivlhr.supabase.co/storage/v1/object/public/3d-models/defaults/product_accessory.glb',
  };

  if (!category) return null;
  const lower = category.toLowerCase();
  return defaults[lower] || null;
}

/**
 * 엔티티 이름에서 타입 추론 (한국어 지원) - 레거시 호환용
 */
function inferTypeFromName(name?: string): ModelLayer['type'] | null {
  if (!name) return null;

  const lower = name.toLowerCase();

  // 가구/설비 키워드
  const furnitureKeywords = [
    '선반', '행거', '계산대', '카운터', '탈의실', '출입구', '테이블', '진열대',
    'shelf', 'rack', 'hanger', 'counter', 'fitting', 'entrance', 'exit', 'table', 'display',
    '마네킹', 'mannequin', '거울', 'mirror', '의자', 'chair', '소파', 'sofa'
  ];

  // 공간 키워드
  const spaceKeywords = ['space', 'store', 'room', '매장', '공간'];

  for (const kw of spaceKeywords) {
    if (lower.includes(kw)) return 'space';
  }

  for (const kw of furnitureKeywords) {
    if (lower.includes(kw)) return 'furniture';
  }

  return null;
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

