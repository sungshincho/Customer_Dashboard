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

    const { scheduleId, manualRun = false } = await req.json();

    if (!scheduleId) {
      throw new Error('scheduleId is required');
    }

    console.log(`Starting data sync for schedule: ${scheduleId}`);

    // Get schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('data_sync_schedules')
      .select('*, data_source:external_data_sources(*)')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) throw scheduleError;
    if (!schedule) throw new Error('Schedule not found');

    // Check if schedule is enabled
    if (!schedule.is_enabled && !manualRun) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Schedule is disabled' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry
    const logStartTime = new Date().toISOString();
    const { data: syncLog, error: logError } = await supabase
      .from('data_sync_logs')
      .insert({
        schedule_id: scheduleId,
        user_id: schedule.user_id,
        org_id: schedule.org_id,
        status: 'running',
        started_at: logStartTime,
        metadata: {
          manual_run: manualRun,
          source_type: schedule.data_source.source_type
        }
      })
      .select()
      .single();

    if (logError) throw logError;

    try {
      // Get API connection details
      const { data: connection, error: connError } = await supabase
        .from('api_connections')
        .select('*')
        .eq('id', schedule.data_source_id)
        .single();

      if (connError) throw connError;
      if (!connection) throw new Error('API connection not found');

      // Build request headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(connection.headers || {}),
      };

      // Add authentication
      if (connection.auth_type === 'api_key' && connection.auth_value) {
        headers['X-API-Key'] = connection.auth_value;
      } else if (connection.auth_type === 'bearer' && connection.auth_value) {
        headers['Authorization'] = `Bearer ${connection.auth_value}`;
      } else if (connection.auth_type === 'basic' && connection.auth_value) {
        headers['Authorization'] = `Basic ${connection.auth_value}`;
      }

      console.log(`Calling API: ${connection.url}`);

      // Call the external API
      const apiStartTime = Date.now();
      const apiResponse = await fetch(connection.url, {
        method: connection.method || 'GET',
        headers,
      });

      const apiResponseTime = ((Date.now() - apiStartTime) / 1000).toFixed(2);

      if (!apiResponse.ok) {
        throw new Error(`API request failed with status ${apiResponse.status}`);
      }

      const contentType = apiResponse.headers.get('content-type');
      let apiData: any;

      if (contentType?.includes('application/json')) {
        apiData = await apiResponse.json();
      } else {
        const textData = await apiResponse.text();
        apiData = { raw_data: textData };
      }

      console.log(`API call successful. Response time: ${apiResponseTime}s`);

      // Get field mapping and ontology options from sync_config
      const fieldMapping = schedule.sync_config?.field_mapping || {};
      const targetTable = schedule.sync_config?.target_table;
      const convertToOntology = schedule.sync_config?.convert_to_ontology || false;
      const ontologyEntityType = schedule.sync_config?.ontology_entity_type;

      let recordsSynced = 0;
      let importId: string | null = null;

      // Process and insert data based on target table
      if (targetTable && fieldMapping && Object.keys(fieldMapping).length > 0) {
        // Extract array from response (support nested paths)
        let dataArray = apiData;
        const dataPath = schedule.sync_config?.data_path;
        if (dataPath) {
          const pathParts = dataPath.split('.');
          for (const part of pathParts) {
            dataArray = dataArray?.[part];
          }
        }

        if (!Array.isArray(dataArray)) {
          dataArray = [dataArray];
        }

        // Map and insert records
        const mappedRecords = dataArray.map((record: any) => {
          const mappedRecord: any = {
            user_id: schedule.user_id,
            org_id: schedule.org_id,
            store_id: schedule.sync_config?.store_id || null,
          };

          // Apply field mapping
          for (const [dbColumn, apiField] of Object.entries(fieldMapping)) {
            const value = getNestedValue(record, apiField as string);
            if (value !== undefined) {
              mappedRecord[dbColumn] = value;
            }
          }

          return mappedRecord;
        });

        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < mappedRecords.length; i += batchSize) {
          const batch = mappedRecords.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from(targetTable)
            .insert(batch);

          if (insertError) {
            console.error(`Batch insert error:`, insertError);
            throw insertError;
          }

          recordsSynced += batch.length;
        }

        console.log(`Successfully synced ${recordsSynced} records to ${targetTable}`);

        // 온톨로지 변환 옵션이 활성화된 경우
        if (convertToOntology) {
          console.log('🧠 Starting ontology conversion...');

          // user_data_imports 레코드 생성
          const { data: importRecord, error: importError } = await supabase
            .from('user_data_imports')
            .insert({
              user_id: schedule.user_id,
              org_id: schedule.org_id,
              store_id: schedule.sync_config?.store_id || null,
              file_name: `api_sync_${scheduleId}_${Date.now()}.json`,
              file_type: 'json',
              data_type: targetTable,
              raw_data: dataArray,
              row_count: dataArray.length,
              status: 'pending',
            })
            .select()
            .single();

          if (importError) {
            console.error('Failed to create import record:', importError);
          } else if (importRecord) {
            importId = importRecord.id;
            console.log(`Created import record: ${importId}`);

            // integrated-data-pipeline 호출하여 온톨로지 변환 실행
            try {
              const pipelineResponse = await supabase.functions.invoke('integrated-data-pipeline', {
                body: {
                  import_id: importId,
                  store_id: schedule.sync_config?.store_id,
                  auto_fix: true,
                  skip_validation: false,
                },
              });

              if (pipelineResponse.error) {
                console.error('Ontology conversion error:', pipelineResponse.error);
              } else {
                console.log('✅ Ontology conversion completed');
                console.log(`  - Entities created: ${pipelineResponse.data?.etl?.entities_created || 0}`);
                console.log(`  - Relations created: ${pipelineResponse.data?.etl?.relations_created || 0}`);
              }
            } catch (pipelineError) {
              console.error('Pipeline invocation error:', pipelineError);
            }
          }
        }
      } else {
        console.log('No field mapping configured, skipping data insertion');
      }

      // Update sync log with success
      await supabase
        .from('data_sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          metadata: {
            manual_run: manualRun,
            source_type: schedule.data_source.source_type,
            api_response_time: `${apiResponseTime}s`,
            target_table: targetTable,
            records_processed: recordsSynced,
            ontology_conversion: convertToOntology,
            import_id: importId,
          }
        })
        .eq('id', syncLog.id);

      // Update schedule's last run timestamp
      const nextRunAt = manualRun ? schedule.next_run_at : calculateNextRun(schedule.cron_expression);
      await supabase
        .from('data_sync_schedules')
        .update({
          last_run_at: new Date().toISOString(),
          last_status: 'success',
          next_run_at: nextRunAt,
          error_message: null
        })
        .eq('id', scheduleId);

      // Update API connection last sync
      await supabase
        .from('api_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', connection.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Data sync completed successfully',
          records_synced: recordsSynced,
          log_id: syncLog.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError: any) {
      console.error('Sync error:', syncError);

      // Update sync log with failure
      await supabase
        .from('data_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message,
          metadata: {
            manual_run: manualRun,
            error_details: syncError.toString()
          }
        })
        .eq('id', syncLog.id);

      // Update schedule with error
      await supabase
        .from('data_sync_schedules')
        .update({
          last_status: 'failed',
          error_message: syncError.message
        })
        .eq('id', scheduleId);

      throw syncError;
    }

  } catch (error: any) {
    console.error('Error in sync-api-data:', error);
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

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Helper function to calculate next run time based on cron expression
function calculateNextRun(cronExpression: string): string {
  // Simple calculation - for production, use a cron parser library
  // This is a basic implementation for common patterns
  const now = new Date();
  
  // Parse cron: minute hour day month dayOfWeek
  const parts = cronExpression.split(' ');
  const [minute, hour, day, month, dayOfWeek] = parts;

  // Handle simple cases
  if (cronExpression === '0 * * * *') { // Every hour
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  } else if (cronExpression === '0 0 * * *') { // Daily at midnight
    now.setDate(now.getDate() + 1);
    now.setHours(0, 0, 0, 0);
  } else if (cronExpression.startsWith('*/')) { // Every N minutes
    const interval = parseInt(cronExpression.split(' ')[0].replace('*/', ''));
    now.setMinutes(now.getMinutes() + interval);
  } else {
    // Default: add 1 hour
    now.setHours(now.getHours() + 1);
  }

  return now.toISOString();
}
