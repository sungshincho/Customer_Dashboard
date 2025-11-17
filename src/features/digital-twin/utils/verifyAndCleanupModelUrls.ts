import { supabase } from "@/integrations/supabase/client";

/**
 * 모든 엔티티 타입의 3D 모델 URL을 검증하고, 
 * 존재하지 않는 파일을 가리키는 URL을 자동으로 제거
 */
export async function verifyAndCleanupModelUrls(userId: string) {
  try {
    console.log('🔍 Starting model URL verification...');

    // 1. model_3d_url이 있는 모든 엔티티 타입 조회
    const { data: entityTypes, error: fetchError } = await supabase
      .from('ontology_entity_types')
      .select('id, name, label, model_3d_url')
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching entity types:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!entityTypes || entityTypes.length === 0) {
      console.log('✅ No entity types with model URLs found');
      return { success: true, checked: 0, cleaned: 0 };
    }

    console.log(`📋 Found ${entityTypes.length} entity types with model URLs`);

    const invalidUrls: Array<{ id: string; name: string; url: string }> = [];

    // 2. 각 URL에 대해 파일 존재 여부 확인
    for (const entityType of entityTypes) {
      const url = entityType.model_3d_url;
      if (!url) continue;

      try {
        // URL에서 bucket과 path 추출
        // 예: https://fbffryjvvykhgoviektl.supabase.co/storage/v1/object/public/3d-models/path/to/file.glb
        const urlParts = url.split('/storage/v1/object/public/');
        if (urlParts.length !== 2) {
          console.warn(`⚠️ Invalid URL format: ${url}`);
          invalidUrls.push({ id: entityType.id, name: entityType.name, url });
          continue;
        }

        const [bucket, ...pathParts] = urlParts[1].split('/');
        const filePath = pathParts.join('/');

        // 파일 존재 여부 확인
        const { data: fileData, error: fileError } = await supabase.storage
          .from(bucket)
          .list(filePath.split('/').slice(0, -1).join('/'), {
            search: filePath.split('/').pop()
          });

        if (fileError || !fileData || fileData.length === 0) {
          console.warn(`❌ File not found: ${filePath} in bucket ${bucket}`);
          invalidUrls.push({ id: entityType.id, name: entityType.name, url });
        } else {
          console.log(`✅ File exists: ${entityType.name} (${filePath})`);
        }
      } catch (error) {
        console.error(`Error checking file for ${entityType.name}:`, error);
        invalidUrls.push({ id: entityType.id, name: entityType.name, url });
      }
    }

    // 3. 존재하지 않는 파일을 가리키는 URL 제거
    if (invalidUrls.length > 0) {
      console.log(`🧹 Cleaning up ${invalidUrls.length} invalid URLs...`);

      for (const invalid of invalidUrls) {
        const { error: updateError } = await supabase
          .from('ontology_entity_types')
          .update({ model_3d_url: null })
          .eq('id', invalid.id);

        if (updateError) {
          console.error(`Error updating ${invalid.name}:`, updateError);
        } else {
          console.log(`✅ Cleaned: ${invalid.name}`);
        }
      }
    }

    return {
      success: true,
      checked: entityTypes.length,
      cleaned: invalidUrls.length,
      invalidUrls: invalidUrls.map(u => ({ name: u.name, url: u.url }))
    };
  } catch (error) {
    console.error('Error in verifyAndCleanupModelUrls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
