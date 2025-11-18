import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  filePaths?: string[]; // 스토리지 파일 경로 배열
  deleteAllData?: boolean; // 전체 데이터 삭제 플래그
  storeId?: string; // 특정 매장만 삭제
}

interface CleanupResult {
  success: boolean;
  storageFilesDeleted: number;
  importsDeleted: number;
  entitiesDeleted: number;
  relationsDeleted: number;
  entityTypesUpdated: number;
  scenesDeleted: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { filePaths, deleteAllData, storeId }: CleanupRequest = await req.json();
    const userId = user.id;

    const result: CleanupResult = {
      success: true,
      storageFilesDeleted: 0,
      importsDeleted: 0,
      entitiesDeleted: 0,
      relationsDeleted: 0,
      entityTypesUpdated: 0,
      scenesDeleted: 0,
      errors: []
    };

    console.log('🧹 Starting integrated cleanup:', { filePaths, deleteAllData, storeId });

    if (deleteAllData) {
      // 전체 데이터 초기화
      await cleanupAllUserData(supabase, userId, storeId, result);
    } else if (filePaths && filePaths.length > 0) {
      // 특정 파일 삭제
      await cleanupSpecificFiles(supabase, userId, filePaths, result);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        storageFilesDeleted: 0,
        importsDeleted: 0,
        entitiesDeleted: 0,
        relationsDeleted: 0,
        entityTypesUpdated: 0,
        scenesDeleted: 0,
        errors: [errorMessage]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * 전체 사용자 데이터 초기화
 */
async function cleanupAllUserData(
  supabase: any,
  userId: string,
  storeId: string | undefined,
  result: CleanupResult
) {
  console.log('🗑️ Cleaning up all user data...');

  // 1. 스토리지 파일 삭제
  try {
    const storePath = storeId ? `${userId}/${storeId}` : `${userId}`;
    
    // store-data 버킷
    const { data: dataFiles } = await supabase.storage
      .from('store-data')
      .list(storePath);
    
    if (dataFiles && dataFiles.length > 0) {
      const dataFilePaths = dataFiles.map((f: any) => `${storePath}/${f.name}`);
      const { error: dataDeleteError } = await supabase.storage
        .from('store-data')
        .remove(dataFilePaths);
      
      if (dataDeleteError) {
        result.errors.push(`Storage delete error (store-data): ${dataDeleteError.message}`);
      } else {
        result.storageFilesDeleted += dataFilePaths.length;
      }
    }

    // 3d-models 버킷
    const { data: modelFiles } = await supabase.storage
      .from('3d-models')
      .list(storePath);
    
    if (modelFiles && modelFiles.length > 0) {
      const modelFilePaths = modelFiles.map((f: any) => `${storePath}/${f.name}`);
      const { error: modelDeleteError } = await supabase.storage
        .from('3d-models')
        .remove(modelFilePaths);
      
      if (modelDeleteError) {
        result.errors.push(`Storage delete error (3d-models): ${modelDeleteError.message}`);
      } else {
        result.storageFilesDeleted += modelFilePaths.length;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Storage cleanup error: ${errorMessage}`);
  }

  // 2. graph_relations 삭제
  try {
    const relQuery = supabase
      .from('graph_relations')
      .delete()
      .eq('user_id', userId);
    
    if (storeId) {
      relQuery.eq('store_id', storeId);
    }
    
    const { error: relError, count } = await relQuery;
    
    if (relError) {
      result.errors.push(`Relations delete error: ${relError.message}`);
    } else {
      result.relationsDeleted = count || 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Relations cleanup error: ${errorMessage}`);
  }

  // 3. graph_entities 삭제
  try {
    const entQuery = supabase
      .from('graph_entities')
      .delete()
      .eq('user_id', userId);
    
    if (storeId) {
      entQuery.eq('store_id', storeId);
    }
    
    const { error: entError, count } = await entQuery;
    
    if (entError) {
      result.errors.push(`Entities delete error: ${entError.message}`);
    } else {
      result.entitiesDeleted = count || 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Entities cleanup error: ${errorMessage}`);
  }

  // 4. store_scenes 삭제
  try {
    const sceneQuery = supabase
      .from('store_scenes')
      .delete()
      .eq('user_id', userId);
    
    if (storeId) {
      sceneQuery.eq('store_id', storeId);
    }
    
    const { error: sceneError, count } = await sceneQuery;
    
    if (sceneError) {
      result.errors.push(`Scenes delete error: ${sceneError.message}`);
    } else {
      result.scenesDeleted = count || 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Scenes cleanup error: ${errorMessage}`);
  }

  // 5. user_data_imports 삭제
  try {
    const importQuery = supabase
      .from('user_data_imports')
      .delete()
      .eq('user_id', userId);
    
    if (storeId) {
      importQuery.eq('store_id', storeId);
    }
    
    const { error: importError, count } = await importQuery;
    
    if (importError) {
      result.errors.push(`Imports delete error: ${importError.message}`);
    } else {
      result.importsDeleted = count || 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Imports cleanup error: ${errorMessage}`);
  }

  // 6. ontology_entity_types의 3D 모델 참조 제거
  try {
    const { error: typeError, count } = await supabase
      .from('ontology_entity_types')
      .update({ 
        model_3d_url: null,
        model_3d_type: null,
        model_3d_dimensions: null,
        model_3d_metadata: null
      })
      .eq('user_id', userId)
      .not('model_3d_url', 'is', null);
    
    if (typeError) {
      result.errors.push(`Entity types update error: ${typeError.message}`);
    } else {
      result.entityTypesUpdated = count || 0;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(`Entity types cleanup error: ${errorMessage}`);
  }

  console.log('✅ All data cleanup completed:', result);
}

/**
 * 특정 파일들과 관련 데이터 삭제
 */
async function cleanupSpecificFiles(
  supabase: any,
  userId: string,
  filePaths: string[],
  result: CleanupResult
) {
  console.log('🗑️ Cleaning up specific files:', filePaths);

  for (const filePath of filePaths) {
    try {
      // 파일 경로에서 버킷 판단
      const is3DModel = filePath.includes('.glb') || filePath.includes('.gltf');
      const bucket = is3DModel ? '3d-models' : 'store-data';

      // 1. 스토리지 파일 삭제
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        result.errors.push(`Storage delete error (${filePath}): ${storageError.message}`);
        continue;
      }
      result.storageFilesDeleted++;

      // 2. user_data_imports에서 해당 파일 찾기
      const { data: imports } = await supabase
        .from('user_data_imports')
        .select('id')
        .eq('user_id', userId)
        .eq('file_path', filePath);

      if (imports && imports.length > 0) {
        for (const imp of imports) {
          // 3. 관련 graph_entities 찾기
          const { data: entities } = await supabase
            .from('graph_entities')
            .select('id')
            .eq('user_id', userId)
            .contains('properties', { source_import_id: imp.id });

          if (entities && entities.length > 0) {
            const entityIds = entities.map((e: any) => e.id);

            // 4. 관련 graph_relations 삭제
            const { error: relError, count: relCount } = await supabase
              .from('graph_relations')
              .delete()
              .eq('user_id', userId)
              .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`);

            if (!relError) {
              result.relationsDeleted += relCount || 0;
            }

            // 5. graph_entities 삭제
            const { error: entError, count: entCount } = await supabase
              .from('graph_entities')
              .delete()
              .in('id', entityIds)
              .eq('user_id', userId);

            if (!entError) {
              result.entitiesDeleted += entCount || entityIds.length;
            }
          }

          // 6. user_data_imports 삭제
          const { error: importError } = await supabase
            .from('user_data_imports')
            .delete()
            .eq('id', imp.id)
            .eq('user_id', userId);

          if (!importError) {
            result.importsDeleted++;
          }
        }
      }

      // 7. 3D 모델인 경우 ontology_entity_types 정리
      if (is3DModel) {
        const fileUrl = `${supabase.storage.url}/object/public/${bucket}/${filePath}`;
        
        const { error: typeError, count: typeCount } = await supabase
          .from('ontology_entity_types')
          .update({ 
            model_3d_url: null,
            model_3d_type: null,
            model_3d_dimensions: null,
            model_3d_metadata: null
          })
          .eq('user_id', userId)
          .eq('model_3d_url', fileUrl);

        if (!typeError) {
          result.entityTypesUpdated += typeCount || 0;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`File cleanup error (${filePath}): ${errorMessage}`);
    }
  }

  console.log('✅ Specific files cleanup completed:', result);
}
