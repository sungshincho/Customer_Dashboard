import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  importId?: string;
  filePath?: string;
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

    const { importId, filePath }: CleanupRequest = await req.json();
    const userId = user.id;

    let targetImportIds: string[] = [];

    // filePath로 import_id 직접 찾기
    if (filePath) {
      const { data: imports, error: importError } = await supabase
        .from('user_data_imports')
        .select('id')
        .eq('user_id', userId)
        .eq('file_path', filePath);

      if (importError) throw importError;
      targetImportIds = imports?.map(imp => imp.id) || [];
    } else if (importId) {
      targetImportIds = [importId];
    }

    if (targetImportIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No imports found to clean up',
          deletedEntities: 0,
          deletedRelations: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cleaning up imports:', targetImportIds);

    let totalEntitiesDeleted = 0;
    let totalRelationsDeleted = 0;

    for (const impId of targetImportIds) {
      // source_import_id로 엔티티 찾기
      const { data: entities, error: entitiesError } = await supabase
        .from('graph_entities')
        .select('id')
        .eq('user_id', userId)
        .contains('properties', { source_import_id: impId });

      if (entitiesError) {
        console.error('Error fetching entities:', entitiesError);
        continue;
      }

      const entityIds = entities?.map(e => e.id) || [];

      if (entityIds.length > 0) {
        // 관련 릴레이션 삭제
        const { error: relError } = await supabase
          .from('graph_relations')
          .delete()
          .eq('user_id', userId)
          .or(`source_entity_id.in.(${entityIds.join(',')}),target_entity_id.in.(${entityIds.join(',')})`);

        if (relError) {
          console.error('Error deleting relations:', relError);
        } else {
          console.log(`Deleted relations for ${entityIds.length} entities`);
        }

        // 엔티티 삭제
        const { error: entError, count } = await supabase
          .from('graph_entities')
          .delete()
          .in('id', entityIds)
          .eq('user_id', userId);

        if (entError) {
          console.error('Error deleting entities:', entError);
        } else {
          totalEntitiesDeleted += count || entityIds.length;
          console.log(`Deleted ${count || entityIds.length} entities`);
        }
      }

      // user_data_imports 삭제
      const { error: importError } = await supabase
        .from('user_data_imports')
        .delete()
        .eq('id', impId)
        .eq('user_id', userId);

      if (importError) {
        console.error('Error deleting import:', importError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedEntities: totalEntitiesDeleted,
        deletedRelations: totalRelationsDeleted,
        cleanedImports: targetImportIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
