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

    const { connectionId } = await req.json();

    if (!connectionId) {
      throw new Error('connectionId is required');
    }

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError) throw fetchError;
    if (!connection) throw new Error('Connection not found');

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

    console.log('Testing API connection:', {
      url: connection.url,
      method: connection.method || 'GET',
      type: connection.type,
    });

    // Test the connection
    const testResponse = await fetch(connection.url, {
      method: connection.method || 'GET',
      headers,
    });

    const success = testResponse.ok;
    const statusCode = testResponse.status;
    let responseData: any = null;

    try {
      const contentType = testResponse.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseData = await testResponse.json();
      } else {
        responseData = await testResponse.text();
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
    }

    // Update last_sync if successful
    if (success) {
      await supabase
        .from('api_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', connectionId);
    }

    return new Response(
      JSON.stringify({
        success,
        statusCode,
        message: success ? 'Connection test successful' : 'Connection test failed',
        data: responseData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in test-api-connection:', error);
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
