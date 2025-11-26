import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 온톨로지 관계 추론 스케줄러
 * Cron Job으로 주기적으로 실행되어 pending 상태의 엔티티에 대한 관계 추론을 실행
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🕐 Ontology inference scheduler started');

    // Pending 엔티티 수 확인
    const { count, error: countError } = await supabase
      .from('ontology_relation_inference_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (countError) throw countError;

    console.log(`📊 Pending entities: ${count || 0}`);

    if (!count || count === 0) {
      console.log('✅ No pending entities, skipping inference');
      return new Response(
        JSON.stringify({ success: true, message: 'No pending entities' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // infer-entity-relations 함수 호출
    console.log('🚀 Invoking infer-entity-relations...');

    const { data, error } = await supabase.functions.invoke('infer-entity-relations', {
      body: {
        batch_size: 20, // 한 번에 20개씩 처리
      },
    });

    if (error) {
      console.error('❌ Inference invocation error:', error);
      throw error;
    }

    console.log('✅ Inference completed:', data);

    return new Response(
      JSON.stringify({
        success: true,
        result: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Scheduler error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
