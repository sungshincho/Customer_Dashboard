import { supabase } from "@/integrations/supabase/client";
import type { ModelLayer } from "../components/digital-twin/ModelLayerManager";
import { parseModelFilename } from "./modelFilenameParser";

/**
 * 사용자의 3D 모델 로드
 * - Supabase Storage에서 실제 업로드된 모델만 로드
 */
export async function loadUserModels(
  userId: string,
  storeId?: string
): Promise<ModelLayer[]> {
  const models: ModelLayer[] = [];

  try {
    // Storage에서 업로드된 모델만 로드
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
          
          // 파일명에서 dimensions 추출
          const parsed = parseModelFilename(file.name);

          models.push({
            id: `storage-${file.name}`,
            name: file.name.replace(/\.(glb|gltf)$/i, ''),
            type,
            model_url: publicUrl,
            dimensions: parsed.isValid && parsed.dimensions ? parsed.dimensions : undefined,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          });
        }
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

