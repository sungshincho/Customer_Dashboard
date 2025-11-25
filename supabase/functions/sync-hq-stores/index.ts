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

    // Verify NEURALTWIN_ADMIN role for internal admin operations
    const { data: isAdmin, error: adminCheckError } = await supabaseClient
      .rpc('is_neuraltwin_admin', { _user_id: user.id });

    if (adminCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: NEURALTWIN_ADMIN access required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    const { external_system_id, external_api_url, api_key } = await req.json();
    console.log('Syncing HQ stores for:', { user_id: user.id, external_system_id });

    // 동기화 로그 시작
    const { data: syncLog, error: logError } = await supabaseClient
      .from('hq_sync_logs')
      .insert({
        user_id: user.id,
        sync_type: 'full_sync',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
      throw logError;
    }

    let processedCount = 0;
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // 외부 시스템 API 호출 (데모용 - 실제로는 외부 API 호출)
      // const response = await fetch(`${external_api_url}/stores`, {
      //   headers: { 'Authorization': `Bearer ${api_key}` }
      // });
      // const externalStores = await response.json();

      // 데모용 샘플 데이터
      const externalStores = [
        {
          store_code: 'HQ-001',
          store_name: '강남점',
          format: 'flagship',
          region: '서울',
          district: '강남구',
          address: '서울시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          email: 'gangnam@example.com',
          manager_name: '김매니저',
          opening_date: '2020-01-15',
          area_sqm: 250,
        },
        {
          store_code: 'HQ-002',
          store_name: '홍대점',
          format: 'standard',
          region: '서울',
          district: '마포구',
          address: '서울시 마포구 양화로 456',
          phone: '02-2345-6789',
          email: 'hongdae@example.com',
          manager_name: '이매니저',
          opening_date: '2021-03-20',
          area_sqm: 180,
        },
        {
          store_code: 'HQ-003',
          store_name: '부산점',
          format: 'regional',
          region: '부산',
          district: '해운대구',
          address: '부산시 해운대구 센텀로 789',
          phone: '051-3456-7890',
          email: 'busan@example.com',
          manager_name: '박매니저',
          opening_date: '2022-06-10',
          area_sqm: 200,
        },
      ];

      processedCount = externalStores.length;

      for (const store of externalStores) {
        try {
          // HQ 매장 마스터에 upsert
          const { error: upsertError } = await supabaseClient
            .from('hq_store_master')
            .upsert(
              {
                user_id: user.id,
                hq_store_code: store.store_code,
                hq_store_name: store.store_name,
                store_format: store.format,
                region: store.region,
                district: store.district,
                address: store.address,
                phone: store.phone,
                email: store.email,
                manager_name: store.manager_name,
                opening_date: store.opening_date,
                area_sqm: store.area_sqm,
                external_system_id,
                last_synced_at: new Date().toISOString(),
                metadata: { source: 'hq_api', sync_version: '1.0' },
              },
              { onConflict: 'user_id,hq_store_code' }
            );

          if (upsertError) {
            console.error('Failed to sync store:', store.store_code, upsertError);
            failedCount++;
          } else {
            syncedCount++;
          }
        } catch (error) {
          console.error('Error processing store:', store.store_code, error);
          failedCount++;
        }
      }

      // 동기화 로그 업데이트 (성공)
      await supabaseClient
        .from('hq_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: processedCount,
          records_synced: syncedCount,
          records_failed: failedCount,
        })
        .eq('id', syncLog.id);

      return new Response(
        JSON.stringify({
          success: true,
          sync_log_id: syncLog.id,
          results: {
            processed: processedCount,
            synced: syncedCount,
            failed: failedCount,
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      // 동기화 로그 업데이트 (실패)
      await supabaseClient
        .from('hq_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          records_processed: processedCount,
          records_synced: syncedCount,
          records_failed: failedCount,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', syncLog.id);

      throw error;
    }
  } catch (error) {
    console.error('Error syncing HQ stores:', error);
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
