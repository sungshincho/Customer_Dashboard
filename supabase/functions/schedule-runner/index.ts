import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Schedule runner started at:', new Date().toISOString());

    // Get all enabled schedules that are due to run
    const now = new Date().toISOString();
    const { data: schedules, error: schedulesError } = await supabase
      .from('data_sync_schedules')
      .select('*')
      .eq('is_enabled', true)
      .or(`next_run_at.is.null,next_run_at.lte.${now}`);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} schedules to run`);

    const results = [];

    // Run each schedule
    for (const schedule of schedules || []) {
      console.log(`Running schedule: ${schedule.schedule_name} (${schedule.id})`);

      try {
        // Call sync-api-data function for this schedule
        const { data: syncResult, error: syncError } = await supabase.functions.invoke(
          'sync-api-data',
          {
            body: { 
              scheduleId: schedule.id,
              manualRun: false 
            }
          }
        );

        if (syncError) {
          console.error(`Sync failed for schedule ${schedule.id}:`, syncError);
          results.push({
            schedule_id: schedule.id,
            schedule_name: schedule.schedule_name,
            success: false,
            error: syncError.message
          });
        } else {
          console.log(`Sync successful for schedule ${schedule.id}`);
          results.push({
            schedule_id: schedule.id,
            schedule_name: schedule.schedule_name,
            success: true,
            records_synced: syncResult?.records_synced || 0
          });
        }
      } catch (scheduleError: any) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
        results.push({
          schedule_id: schedule.id,
          schedule_name: schedule.schedule_name,
          success: false,
          error: scheduleError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Schedule runner completed. Success: ${successCount}, Failed: ${failureCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} schedules`,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in schedule-runner:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
