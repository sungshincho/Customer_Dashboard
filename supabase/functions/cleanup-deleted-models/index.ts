import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupRequest {
  fileUrl: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabaseClient.auth.setSession({
        access_token: authHeader.replace('Bearer ', ''),
        refresh_token: '',
      });
    }

    const { fileUrl, userId }: CleanupRequest = await req.json();

    console.log('Cleaning up deleted model:', fileUrl);

    // 1. ontology_entity_types에서 해당 URL을 사용하는 레코드의 model_3d_url을 null로 업데이트
    const { data: entityTypes, error: entityTypesError } = await supabaseClient
      .from('ontology_entity_types')
      .update({ model_3d_url: null })
      .eq('user_id', userId)
      .eq('model_3d_url', fileUrl)
      .select();

    if (entityTypesError) {
      console.error('Error updating entity types:', entityTypesError);
    } else {
      console.log(`Updated ${entityTypes?.length || 0} entity types`);
    }

    // 2. graph_entities에서 properties.model_url이 해당 URL인 레코드 찾기
    const { data: entities, error: entitiesSelectError } = await supabaseClient
      .from('graph_entities')
      .select('id, properties')
      .eq('user_id', userId);

    if (entitiesSelectError) {
      console.error('Error selecting entities:', entitiesSelectError);
    } else {
      // properties에서 model_url 제거 또는 전체 삭제
      const entitiesToUpdate = entities?.filter(
        (entity) => entity.properties && (entity.properties as any).model_url === fileUrl
      ) || [];

      for (const entity of entitiesToUpdate) {
        const newProperties = { ...(entity.properties as any) };
        delete newProperties.model_url;

        const { error: updateError } = await supabaseClient
          .from('graph_entities')
          .update({ properties: newProperties })
          .eq('id', entity.id);

        if (updateError) {
          console.error(`Error updating entity ${entity.id}:`, updateError);
        }
      }

      console.log(`Cleaned up ${entitiesToUpdate.length} entity instances`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Model references cleaned up successfully',
        entityTypesUpdated: entityTypes?.length || 0,
        entitiesUpdated: entities?.filter(
          (e) => e.properties && (e.properties as any).model_url === fileUrl
        ).length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cleanup-deleted-models:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
