import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FixOptions {
  removeDuplicates: boolean;
  fillEmptyValues: boolean;
  convertTypes: boolean;
  useAI: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { importId, options } = await req.json() as { 
      importId: string; 
      options: FixOptions 
    };

    console.log('Auto-fixing data for import:', importId, 'with options:', options);

    // 데이터 가져오기
    const { data: importData, error: fetchError } = await supabase
      .from('user_data_imports')
      .select('*')
      .eq('id', importId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !importData) {
      throw new Error('Import not found');
    }

    let rawData = importData.raw_data as any[];
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('No data to fix');
    }

    const originalCount = rawData.length;
    let fixedData = [...rawData];
    const fixes: string[] = [];

    // 1. 중복 제거
    if (options.removeDuplicates) {
      const uniqueMap = new Map();
      fixedData.forEach(row => {
        const key = JSON.stringify(row);
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, row);
        }
      });
      const beforeCount = fixedData.length;
      fixedData = Array.from(uniqueMap.values());
      const removed = beforeCount - fixedData.length;
      if (removed > 0) {
        fixes.push(`중복 행 ${removed}개 제거`);
        console.log(`Removed ${removed} duplicate rows`);
      }
    }

    // 2. 데이터 타입 변환
    if (options.convertTypes) {
      fixedData = fixedData.map(row => {
        const convertedRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            convertedRow[key] = value;
            return;
          }

          const strValue = String(value).trim();

          // 숫자 변환 시도
          if (/^-?\d+\.?\d*$/.test(strValue)) {
            convertedRow[key] = strValue.includes('.') ? parseFloat(strValue) : parseInt(strValue);
          }
          // 불린 변환
          else if (['true', 'false', 'yes', 'no', 'y', 'n'].includes(strValue.toLowerCase())) {
            convertedRow[key] = ['true', 'yes', 'y'].includes(strValue.toLowerCase());
          }
          // 날짜 변환 시도
          else if (!isNaN(Date.parse(strValue)) && strValue.length > 8) {
            convertedRow[key] = new Date(strValue).toISOString();
          }
          // 그대로 유지
          else {
            convertedRow[key] = value;
          }
        });
        return convertedRow;
      });
      fixes.push('데이터 타입 자동 변환 완료');
      console.log('Data types converted');
    }

    // 3. 빈 값 채우기
    if (options.fillEmptyValues) {
      const columns = Object.keys(fixedData[0] || {});
      
      for (const col of columns) {
        const values = fixedData.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
        
        if (values.length === 0) continue;

        // 타입별 기본값
        const sampleValue = values[0];
        let fillValue: any;

        if (typeof sampleValue === 'number') {
          // 숫자: 평균값
          const sum = values.reduce((a, b) => a + b, 0);
          fillValue = Math.round(sum / values.length);
        } else if (typeof sampleValue === 'boolean') {
          // 불린: 가장 많이 나타나는 값
          const trueCount = values.filter(v => v === true).length;
          fillValue = trueCount > values.length / 2;
        } else {
          // 문자열: 가장 많이 나타나는 값 (최빈값)
          const frequency: Record<string, number> = {};
          values.forEach(v => {
            const key = String(v);
            frequency[key] = (frequency[key] || 0) + 1;
          });
          fillValue = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
        }

        // 빈 값 채우기
        let filledCount = 0;
        fixedData = fixedData.map(row => {
          if (row[col] === null || row[col] === undefined || row[col] === '') {
            filledCount++;
            return { ...row, [col]: fillValue };
          }
          return row;
        });

        if (filledCount > 0) {
          fixes.push(`"${col}" 컬럼의 빈 값 ${filledCount}개 채움`);
          console.log(`Filled ${filledCount} empty values in column ${col}`);
        }
      }
    }

    // 4. AI를 사용한 데이터 품질 향상 (선택적)
    if (options.useAI && fixes.length > 0) {
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const sample = fixedData.slice(0, 3);
          const prompt = `다음은 ${importData.data_type} 데이터의 샘플입니다:\n${JSON.stringify(sample, null, 2)}\n\n데이터 품질 개선을 위한 추가 제안사항을 간단히 알려주세요.`;

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: '데이터 품질 전문가로서 간단하고 실용적인 제안을 제공하세요.' },
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const suggestion = aiData.choices?.[0]?.message?.content;
            if (suggestion) {
              fixes.push(`AI 제안: ${suggestion.slice(0, 200)}`);
              console.log('AI suggestion added');
            }
          }
        }
      } catch (aiError) {
        console.error('AI suggestion failed:', aiError);
        // AI 실패는 무시하고 계속 진행
      }
    }

    // 데이터 업데이트
    const { error: updateError } = await supabase
      .from('user_data_imports')
      .update({ 
        raw_data: fixedData,
        row_count: fixedData.length 
      })
      .eq('id', importId)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Data fixed successfully:', fixes);

    return new Response(
      JSON.stringify({
        success: true,
        originalCount,
        fixedCount: fixedData.length,
        fixes,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in auto-fix-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
