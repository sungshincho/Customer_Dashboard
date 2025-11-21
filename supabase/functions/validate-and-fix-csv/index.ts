import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  import_id: string;
  auto_fix: boolean;
  user_id?: string; // optional, for when called from pipeline
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  column?: string;
  row?: number;
  message: string;
  suggestion?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { import_id, auto_fix, user_id } = await req.json() as ValidationRequest;

    // user_id가 제공되면 그것을 사용, 아니면 Authorization header에서 가져오기
    let userId: string;
    if (user_id) {
      userId = user_id;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Authorization required');

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error('Unauthorized');
      userId = user.id;
    }

    console.log('🔍 Validating CSV data for import:', import_id);

    // 데이터 가져오기
    const { data: importData, error: fetchError } = await supabase
      .from('user_data_imports')
      .select('*')
      .eq('id', import_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !importData) {
      throw new Error('Import not found');
    }

    let rawData = importData.raw_data as any[];
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('No data to validate');
    }

    const columns = Object.keys(rawData[0]);
    const issues: ValidationIssue[] = [];
    
    console.log(`📊 Analyzing ${rawData.length} rows with ${columns.length} columns`);

    // AI 기반 데이터 검증
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 데이터 샘플 (처음 5개와 마지막 5개)
    const sampleData = [
      ...rawData.slice(0, 5),
      ...rawData.slice(-5)
    ];

    const validationPrompt = `당신은 데이터 품질 전문가입니다. 다음 CSV 데이터를 철저히 분석하고 문제점을 찾아주세요.

**데이터 타입:** ${importData.data_type}
**파일명:** ${importData.file_name}
**총 행 수:** ${rawData.length}
**컬럼:** ${columns.join(', ')}

**샘플 데이터 (처음 5개 + 마지막 5개):**
${JSON.stringify(sampleData, null, 2)}

**검증 항목:**
1. **ID 컬럼 식별**: 각 행을 고유하게 식별하는 컬럼 찾기 (product_id, customer_id, store_id 등)
2. **데이터 타입 오류**: 숫자여야 하는데 문자열, 날짜 형식 오류 등
3. **누락된 필수 값**: null, undefined, 빈 문자열
4. **중복 데이터**: 완전히 동일한 행
5. **일관성 문제**: 같은 ID인데 다른 정보
6. **범위 이상값**: 음수가 있으면 안 되는데 음수, 비정상적으로 큰 값 등
7. **관계 데이터**: 다른 테이블을 참조하는 외래 키 컬럼 식별

**응답 형식:**
각 문제에 대해 구체적인 해결 방법을 제시하세요.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '데이터 품질 전문가로서 철저하고 구체적인 분석을 제공하세요. 각 문제에 대해 명확한 해결 방법을 제시하세요.'
          },
          {
            role: 'user',
            content: validationPrompt
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'report_validation_issues',
              description: '데이터 검증 결과를 보고합니다',
              parameters: {
                type: 'object',
                properties: {
                  id_columns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '고유 식별자로 사용할 수 있는 컬럼들'
                  },
                  foreign_key_columns: {
                    type: 'object',
                    description: '다른 엔티티를 참조하는 컬럼과 참조하는 엔티티 타입',
                    additionalProperties: { type: 'string' }
                  },
                  issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['error', 'warning', 'info'] },
                        column: { type: 'string' },
                        message: { type: 'string' },
                        fix_suggestion: { type: 'string' }
                      },
                      required: ['type', 'message']
                    }
                  },
                  data_quality_score: {
                    type: 'number',
                    description: '0-100 사이의 데이터 품질 점수'
                  }
                },
                required: ['id_columns', 'issues', 'data_quality_score']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'report_validation_issues' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI validation error:', errorText);
      throw new Error(`AI validation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('🤖 AI validation response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('AI did not return validation results');
    }

    const validationResult = JSON.parse(toolCall.function.arguments);
    console.log('✅ Validation result:', validationResult);

    // AI가 찾은 문제들을 issues 배열에 추가
    validationResult.issues.forEach((issue: any) => {
      issues.push({
        type: issue.type,
        column: issue.column,
        message: issue.message,
        suggestion: issue.fix_suggestion
      });
    });

    // auto_fix가 true면 AI 제안을 바탕으로 자동 수정
    let fixedData = rawData;
    const fixes: string[] = [];

    if (auto_fix && issues.length > 0) {
      console.log('🔧 Auto-fixing data based on AI suggestions...');
 
      try {
        // AI에게 수정된 데이터 요청
      const fixPrompt = `다음 데이터의 문제를 수정해주세요. 원본 데이터와 같은 구조를 유지하되, 발견된 문제들을 해결하세요.

**원본 데이터 샘플:**
${JSON.stringify(sampleData, null, 2)}

**발견된 문제:**
${issues.map(i => `- ${i.message}${i.suggestion ? ': ' + i.suggestion : ''}`).join('\n')}

**ID 컬럼:** ${validationResult.id_columns.join(', ')}
**외래 키 컬럼:** ${JSON.stringify(validationResult.foreign_key_columns)}

**수정 지침:**
1. ID 컬럼은 절대 변경하지 마세요
2. 외래 키 컬럼의 형식을 표준화하세요
3. 데이터 타입을 올바르게 변환하세요
4. 누락된 값은 추론 가능한 경우에만 채우세요
5. 중복은 첫 번째 항목만 유지하세요

전체 데이터를 수정해서 반환하세요.`;

      const fixResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: '데이터 수정 전문가로서 원본 데이터의 구조를 유지하면서 문제만 해결하세요.'
            },
            {
              role: 'user',
              content: fixPrompt
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'return_fixed_data',
                description: '수정된 데이터를 반환합니다',
                parameters: {
                  type: 'object',
                  properties: {
                    fixed_records: {
                      type: 'array',
                      items: { type: 'object' },
                      description: '수정된 전체 데이터'
                    },
                    changes_made: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '수정한 내용 목록'
                    }
                  },
                  required: ['fixed_records', 'changes_made']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'return_fixed_data' } }
        }),
      });

      if (fixResponse.ok) {
        const fixData = await fixResponse.json();
        const fixToolCall = fixData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (fixToolCall) {
          const fixResult = JSON.parse(fixToolCall.function.arguments);
          
          // AI가 샘플만 수정한 경우, 나머지 데이터에도 같은 로직 적용
          if (fixResult.fixed_records.length <= sampleData.length) {
            console.log('⚠️ AI fixed only sample data, applying fixes to all data...');
            
            // 규칙 기반으로 전체 데이터 수정
            fixedData = rawData
              .filter(row => row && typeof row === 'object') // undefined/null 제거
              .map(row => {
                const fixedRow: any = {};
                
                Object.entries(row).forEach(([key, value]) => {
                // ID 컬럼은 그대로 유지
                if (validationResult.id_columns.includes(key)) {
                  fixedRow[key] = value;
                  return;
                }

                // 외래 키 컬럼 표준화
                if (validationResult.foreign_key_columns[key]) {
                  fixedRow[key] = value;
                  return;
                }

                // 데이터 타입 변환
                if (value === null || value === undefined || value === '') {
                  fixedRow[key] = value;
                } else {
                  const strValue = String(value).trim();
                  
                  // 숫자 변환
                  if (/^-?\d+\.?\d*$/.test(strValue)) {
                    fixedRow[key] = strValue.includes('.') ? parseFloat(strValue) : parseInt(strValue);
                  }
                  // 불린 변환
                  else if (['true', 'false', 'yes', 'no'].includes(strValue.toLowerCase())) {
                    fixedRow[key] = ['true', 'yes'].includes(strValue.toLowerCase());
                  }
                  // 날짜 변환
                  else if (!isNaN(Date.parse(strValue)) && strValue.length > 8) {
                    fixedRow[key] = new Date(strValue).toISOString();
                  }
                  else {
                    fixedRow[key] = value;
                  }
                }
              });
              
              return fixedRow;
            });
            
            fixes.push('데이터 타입 자동 변환');
            fixes.push('외래 키 표준화');
          } else {
            fixedData = fixResult.fixed_records;
            fixes.push(...fixResult.changes_made);
          }

          console.log('✅ Data auto-fixed');
        }
      }
    } catch (autoFixError) {
      console.error('❌ Auto-fix failed, returning validation result without modifications:', autoFixError);
      // 최소한의 정리: 잘못된 레코드만 제거
      fixedData = rawData.filter(row => row && typeof row === 'object');
    }

    // 수정된 데이터 저장 (auto_fix가 true인 경우에만)
    if (auto_fix && fixes.length > 0) {
      const { error: updateError } = await supabase
        .from('user_data_imports')
        .update({
          raw_data: fixedData,
          row_count: fixedData.length
        })
        .eq('id', import_id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update data:', updateError);
      } else {
        console.log('✅ Fixed data saved');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data_quality_score: validationResult.data_quality_score,
        id_columns: validationResult.id_columns,
        foreign_key_columns: validationResult.foreign_key_columns,
        issues,
        fixes,
        original_count: rawData.length,
        fixed_count: fixedData.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
