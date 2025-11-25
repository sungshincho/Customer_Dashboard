import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { hq_store_id, local_store_id, sync_enabled = true } = await req.json();
    console.log('Mapping stores:', { hq_store_id, local_store_id, user_id: user.id });

    // HQ 매장 정보 가져오기
    const { data: hqStore, error: hqError } = await supabaseClient
      .from('hq_store_master')
      .select('*')
      .eq('id', hq_store_id)
      .eq('user_id', user.id)
      .single();

    if (hqError || !hqStore) {
      throw new Error('HQ store not found');
    }

    // 로컬 매장 정보 가져오기
    const { data: localStore, error: localError } = await supabaseClient
      .from('stores')
      .select('*')
      .eq('id', local_store_id)
      .eq('user_id', user.id)
      .single();

    if (localError || !localStore) {
      throw new Error('Local store not found');
    }

    // 매핑 생성 또는 업데이트
    const { data: mapping, error: mappingError } = await supabaseClient
      .from('store_mappings')
      .upsert(
        {
          user_id: user.id,
          hq_store_id,
          local_store_id,
          mapping_status: 'active',
          sync_enabled,
          last_synced_at: new Date().toISOString(),
          metadata: {
            mapped_by: 'manual',
            mapped_at: new Date().toISOString(),
          },
        },
        { onConflict: 'user_id,hq_store_id,local_store_id' }
      )
      .select()
      .single();

    if (mappingError) {
      console.error('Failed to create mapping:', mappingError);
      throw mappingError;
    }

    // sync_enabled가 true면 HQ 정보를 로컬 매장에 동기화
    if (sync_enabled) {
      const { error: syncError } = await supabaseClient
        .from('stores')
        .update({
          store_name: hqStore.hq_store_name,
          store_code: hqStore.hq_store_code,
          address: hqStore.address,
          phone: hqStore.phone,
          email: hqStore.email,
          manager_name: hqStore.manager_name,
          metadata: {
            ...localStore.metadata,
            hq_synced: true,
            hq_store_id: hqStore.id,
            store_format: hqStore.store_format,
            region: hqStore.region,
            district: hqStore.district,
            area: hqStore.area_sqm,
            last_hq_sync: new Date().toISOString(),
          },
        })
        .eq('id', local_store_id);

      if (syncError) {
        console.error('Failed to sync store data:', syncError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mapping,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error mapping stores:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
