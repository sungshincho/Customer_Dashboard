import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[ETL Scheduler] Starting scheduled ETL pipeline...');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get all organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id');

    const results: any[] = [];

    for (const org of orgs || []) {
      console.log(`[ETL Scheduler] Processing org: ${org.id}`);

      // Run L1→L2 ETL
      try {
        const l1Response = await fetch(`${supabaseUrl}/functions/v1/etl-l1-to-l2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            org_id: org.id,
            date_from: yesterday,
            date_to: today,
          }),
        });
        const l1Result = await l1Response.json();
        console.log(`[ETL Scheduler] L1→L2 result for ${org.id}:`, l1Result);
        results.push({ org_id: org.id, phase: 'L1→L2', result: l1Result });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ETL Scheduler] L1→L2 error for ${org.id}:`, error);
        results.push({ org_id: org.id, phase: 'L1→L2', error: errorMessage });
      }

      // Run L2→L3 ETL
      try {
        const l2Response = await fetch(`${supabaseUrl}/functions/v1/etl-l2-to-l3`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            org_id: org.id,
            date_from: yesterday,
            date_to: today,
          }),
        });
        const l2Result = await l2Response.json();
        console.log(`[ETL Scheduler] L2→L3 result for ${org.id}:`, l2Result);
        results.push({ org_id: org.id, phase: 'L2→L3', result: l2Result });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ETL Scheduler] L2→L3 error for ${org.id}:`, error);
        results.push({ org_id: org.id, phase: 'L2→L3', error: errorMessage });
      }
    }

    console.log('[ETL Scheduler] Completed all ETL pipelines');

    return new Response(JSON.stringify({
      success: true,
      orgs_processed: orgs?.length || 0,
      results,
      executed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[ETL Scheduler] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Scheduler failed';
    return new Response(JSON.stringify({
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
