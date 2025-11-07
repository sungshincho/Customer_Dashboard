import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, analysisType, nodeRelations, stream } = await req.json();
    console.log("🔵 Starting retail data analysis", { analysisType, dataLength: data?.length });

    // 스트리밍 모드일 경우
    if (stream) {
      const encoder = new TextEncoder();
      const streamResponse = new ReadableStream({
        async start(controller) {
          const sendProgress = (progress: number, stage: string, message: string) => {
            const data = JSON.stringify({ progress, stage, message, type: 'progress' });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          };

          try {
            sendProgress(10, 'preparing', '데이터 준비 중...');
            
            // 데이터 샘플링
            let processedData = data;
            if (data && data.length > 200) {
              const sampleSize = 200;
              const step = Math.floor(data.length / sampleSize);
              processedData = data.filter((_: any, index: number) => index % step === 0).slice(0, sampleSize);
              console.log(`📊 Sampled ${processedData.length} records from ${data.length} total records`);
            }

            sendProgress(20, 'preparing', `${processedData.length}개 데이터 샘플링 완료`);

            const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
            if (!LOVABLE_API_KEY) {
              throw new Error('LOVABLE_API_KEY is not configured');
            }

            const dataStats = {
              totalRecords: data.length,
              sampledRecords: processedData.length,
              dataTypes: analysisType,
              columns: processedData.length > 0 ? Object.keys(processedData[0]).slice(0, 10) : [],
              sampleRecords: processedData.slice(0, 20)
            };

            sendProgress(30, 'analyzing', 'AI 모델에 데이터 전송 중...');

            const ontologyNodes = [
              { type: 'Customer', description: '고객 엔티티 - 구매 행동, 선호도, 인구통계' },
              { type: 'Product', description: '상품 엔티티 - SKU, 카테고리, 가격, 재고' },
              { type: 'Brand', description: '브랜드 엔티티 - 브랜드 정보, 포트폴리오' },
              { type: 'Store', description: '매장 엔티티 - 위치, 면적, 레이아웃' },
              { type: 'Zone', description: '공간/구역 엔티티 - 매장 내 구역, 진열 위치' },
              { type: 'Path', description: '동선 엔티티 - 고객 이동 경로, 체류 시간' },
              { type: 'Transaction', description: '거래 엔티티 - 구매 내역, 결제 정보' },
              { type: 'Event', description: '이벤트 엔티티 - 프로모션, 시즌, 외부 요인' }
            ];

            const relationshipTypes = [
              { type: 'purchases', from: 'Customer', to: 'Product', weight: 'high' },
              { type: 'visits', from: 'Customer', to: 'Zone', weight: 'medium' },
              { type: 'moves_to', from: 'Zone', to: 'Zone', weight: 'medium' },
              { type: 'contains', from: 'Store', to: 'Zone', weight: 'high' },
              { type: 'located_in', from: 'Product', to: 'Zone', weight: 'medium' },
              { type: 'belongs_to', from: 'Product', to: 'Brand', weight: 'high' },
              { type: 'influenced_by', from: 'Transaction', to: 'Event', weight: 'medium' },
              { type: 'correlated_with', from: 'Product', to: 'Product', weight: 'low' }
            ];

            const systemPrompt = `당신은 오프라인 리테일 데이터 분석 전문가입니다.

**중요: 간결하고 핵심적인 JSON만 반환하세요. 설명 없이 JSON만 출력하세요.**

응답 형식 (필수):
{
  "nodes": [최소 5개, 최대 10개],
  "edges": [최소 5개, 최대 10개],
  "insights": [최소 2개, 최대 3개],
  "correlations": [최소 2개, 최대 3개],
  "wtpAnalysis": { "avgWTP": "금액", "priceElasticity": "수치", "recommendations": ["권장1", "권장2"] },
  "timeSeriesPatterns": [최소 1개, 최대 2개]
}

노드/엣지는 핵심만 선별하세요. 인사이트는 100자 이내로 작성하세요.`;

            const userPrompt = `
데이터 타입: ${analysisType}
총 레코드: ${data.length}개 (분석: ${processedData.length}개)
샘플:
${JSON.stringify(dataStats.sampleRecords.slice(0, 5), null, 2)}

**JSON 형식으로만 응답하세요. 설명 없이 {} 안의 내용만 출력하세요.**`;

            sendProgress(40, 'analyzing', 'AI 분석 진행 중... (30-60초 소요 예상)');

            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-pro',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 8000,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ AI API Error:", response.status, errorText);
              throw new Error(`AI Gateway error: ${response.status}`);
            }

            sendProgress(70, 'processing', 'AI 응답 처리 중...');

            const aiResponse = await response.json();
            console.log("✅ AI Analysis completed");

            let analysisResult;
            try {
              const content = aiResponse.choices[0].message.content;
              console.log("🔍 Raw AI response length:", content.length);
              
              // JSON 추출
              let jsonStr = content.trim();
              
              // 마크다운 코드 블록 제거
              const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
              if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1].trim();
              }
              
              // 첫 { 부터 마지막 } 까지 추출
              const firstBrace = jsonStr.indexOf('{');
              const lastBrace = jsonStr.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
              }
              
              console.log("🔍 Extracted JSON length:", jsonStr.length);
              
              // JSON 파싱 시도
              try {
                analysisResult = JSON.parse(jsonStr);
                console.log("✅ Successfully parsed JSON");
              } catch (parseError) {
                console.log("⚠️ JSON parsing failed, attempting repair...");
                
                // JSON 수정 시도
                let repairedJson = jsonStr;
                
                // 끝나지 않은 배열이나 객체 수정
                const openBraces = (repairedJson.match(/\{/g) || []).length;
                const closeBraces = (repairedJson.match(/\}/g) || []).length;
                const openBrackets = (repairedJson.match(/\[/g) || []).length;
                const closeBrackets = (repairedJson.match(/\]/g) || []).length;
                
                // 닫히지 않은 배열 닫기
                if (openBrackets > closeBrackets) {
                  repairedJson += ']'.repeat(openBrackets - closeBrackets);
                }
                
                // 닫히지 않은 객체 닫기
                if (openBraces > closeBraces) {
                  repairedJson += '}'.repeat(openBraces - closeBraces);
                }
                
                // 마지막 쉼표 제거
                repairedJson = repairedJson.replace(/,(\s*[}\]])/g, '$1');
                
                console.log("🔧 Repaired JSON length:", repairedJson.length);
                analysisResult = JSON.parse(repairedJson);
                console.log("✅ Successfully parsed repaired JSON");
              }
              
              // 필수 필드 검증 및 기본값 설정
              analysisResult.nodes = analysisResult.nodes || [];
              analysisResult.edges = analysisResult.edges || [];
              analysisResult.insights = analysisResult.insights || [];
              analysisResult.correlations = analysisResult.correlations || [];
              analysisResult.wtpAnalysis = analysisResult.wtpAnalysis || {
                avgWTP: "데이터 부족",
                priceElasticity: "분석 불가",
                recommendations: ["더 많은 거래 데이터 수집 필요"]
              };
              analysisResult.timeSeriesPatterns = analysisResult.timeSeriesPatterns || [];
              
              console.log(`✅ Validated result: ${analysisResult.nodes.length} nodes, ${analysisResult.edges.length} edges, ${analysisResult.correlations.length} correlations`);
            } catch (e) {
              console.error("⚠️ Failed to parse AI response as JSON:", e);
              console.error("First 500 chars of content:", aiResponse.choices[0].message.content.substring(0, 500));
              
              analysisResult = {
                nodes: [],
                edges: [],
                insights: [{ 
                  title: "분석 파싱 오류", 
                  description: "AI 응답을 파싱할 수 없습니다. 데이터 양을 줄이거나 다시 시도하세요.",
                  impact: "high",
                  recommendation: "선택한 데이터 수를 줄이거나 데이터를 정제하여 재시도하세요"
                }],
                correlations: [],
                wtpAnalysis: {
                  avgWTP: "파싱 오류",
                  priceElasticity: "파싱 오류",
                  recommendations: ["분석 재시도 필요"]
                },
                timeSeriesPatterns: [],
                error: e instanceof Error ? e.message : String(e),
                rawResponse: aiResponse.choices[0].message.content.substring(0, 1000)
              };
            }

            sendProgress(90, 'finalizing', '결과 정리 중...');

            const finalResult = {
              success: true,
              ontology: {
                nodeTypes: ontologyNodes,
                relationshipTypes: relationshipTypes
              },
              analysis: analysisResult,
              metadata: {
                analysisType,
                totalDataCount: data?.length || 0,
                sampledDataCount: processedData?.length || 0,
                timestamp: new Date().toISOString()
              }
            };

            sendProgress(100, 'complete', '분석 완료!');
            
            const finalData = JSON.stringify({ ...finalResult, type: 'result' });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            controller.close();

          } catch (error: any) {
            const errorData = JSON.stringify({ 
              type: 'error',
              error: error.message || 'Unknown error',
              details: error.stack 
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 데이터 샘플링 (최대 200개로 제한 - Pro 모델 사용)
    let processedData = data;
    if (data && data.length > 200) {
      const sampleSize = 200;
      const step = Math.floor(data.length / sampleSize);
      processedData = data.filter((_: any, index: number) => index % step === 0).slice(0, sampleSize);
      console.log(`📊 Sampled ${processedData.length} records from ${data.length} total records`);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // 데이터 도메인별 분류
    const domainMap = {
      sales: '매출',
      customer: '고객',
      traffic: '동선',
      product: '상품',
      inventory: '재고',
      staff: '직원',
      other: '기타'
    };

    // 온톨로지 노드 타입 정의
    const ontologyNodes = [
      { type: 'Customer', description: '고객 엔티티 - 구매 행동, 선호도, 인구통계' },
      { type: 'Product', description: '상품 엔티티 - SKU, 카테고리, 가격, 재고' },
      { type: 'Brand', description: '브랜드 엔티티 - 브랜드 정보, 포트폴리오' },
      { type: 'Store', description: '매장 엔티티 - 위치, 면적, 레이아웃' },
      { type: 'Zone', description: '공간/구역 엔티티 - 매장 내 구역, 진열 위치' },
      { type: 'Path', description: '동선 엔티티 - 고객 이동 경로, 체류 시간' },
      { type: 'Transaction', description: '거래 엔티티 - 구매 내역, 결제 정보' },
      { type: 'Event', description: '이벤트 엔티티 - 프로모션, 시즌, 외부 요인' }
    ];

    // 관계 타입 정의
    const relationshipTypes = [
      { type: 'purchases', from: 'Customer', to: 'Product', weight: 'high' },
      { type: 'visits', from: 'Customer', to: 'Zone', weight: 'medium' },
      { type: 'moves_to', from: 'Zone', to: 'Zone', weight: 'medium' },
      { type: 'contains', from: 'Store', to: 'Zone', weight: 'high' },
      { type: 'located_in', from: 'Product', to: 'Zone', weight: 'medium' },
      { type: 'belongs_to', from: 'Product', to: 'Brand', weight: 'high' },
      { type: 'influenced_by', from: 'Transaction', to: 'Event', weight: 'medium' },
      { type: 'correlated_with', from: 'Product', to: 'Product', weight: 'low' }
    ];

    const systemPrompt = `당신은 오프라인 리테일 데이터 분석 전문가입니다. LSTM-GNN 하이브리드 모델 개념을 활용하여 데이터를 분석합니다.

온톨로지 노드 타입: ${JSON.stringify(ontologyNodes, null, 2)}
관계 타입: ${JSON.stringify(relationshipTypes, null, 2)}

분석 목표:
1. 매출 상승 방법 도출
2. 전년동기대비 매출 변화 원인 파악
3. 데이터 팩터 간 상관관계 분석
4. WTP (Willingness To Pay) 분석

다음을 수행하세요:
1. 입력 데이터를 표준화하고 온톨로지 노드로 매핑
2. 노드 간 관계 추출 및 가중치 계산
3. 시계열 패턴 분석 (LSTM 개념)
4. 그래프 구조 분석 (GNN 개념)
5. 핵심 인사이트 및 액션 아이템 도출

응답은 JSON 형식으로 제공하세요.`;

    // 간단한 데이터 통계만 생성
    const dataStats = {
      totalRecords: data.length,
      sampledRecords: processedData.length,
      dataTypes: analysisType,
      columns: processedData.length > 0 ? Object.keys(processedData[0]).slice(0, 10) : [],
      sampleRecords: processedData.slice(0, 20) // 처음 20개만
    };

    const userPrompt = `
분석 유형: ${analysisType}
총 데이터 수: ${data.length}개 (샘플링: ${processedData.length}개)
데이터 컬럼: ${dataStats.columns.join(', ')}
샘플 데이터:
${JSON.stringify(dataStats.sampleRecords, null, 2)}

활성화된 노드 관계: ${JSON.stringify(nodeRelations || 'all', null, 2)}

위 데이터를 분석하여 다음을 제공하세요:
1. nodes: 온톨로지 기반 노드 배열 [{ id, type, label, properties, metrics }]
2. edges: 관계 배열 [{ source, target, type, weight, properties }]
3. insights: 핵심 인사이트 배열 [{ title, description, impact, recommendation }]
4. correlations: 팩터 간 상관관계 [{ factor1, factor2, correlation, significance }]
5. wtpAnalysis: WTP 분석 결과 { avgWTP, priceElasticity, recommendations }
6. timeSeriesPatterns: 시계열 패턴 [{ period, trend, seasonality, anomalies }]
`;

    console.log("🤖 Calling Lovable AI for analysis...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50초 타임아웃

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ AI API Error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: "Rate limit exceeded. Please try again later." 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            error: "Payment required. Please add credits to your workspace." 
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log("✅ AI Analysis completed");

      let analysisResult;
      try {
        const content = aiResponse.choices[0].message.content;
        // JSON 추출 (마크다운 코드 블록 제거)
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        analysisResult = JSON.parse(jsonStr);
      } catch (e) {
        console.error("⚠️ Failed to parse AI response as JSON:", e);
        analysisResult = {
          nodes: [],
          edges: [],
          insights: [{ 
            title: "분석 완료", 
            description: aiResponse.choices[0].message.content,
            impact: "medium",
            recommendation: "상세 분석을 위해 데이터를 확인하세요"
          }],
          rawResponse: aiResponse.choices[0].message.content
        };
      }

      return new Response(JSON.stringify({
        success: true,
        ontology: {
          nodeTypes: ontologyNodes,
          relationshipTypes: relationshipTypes
        },
        analysis: analysisResult,
        metadata: {
          analysisType,
          totalDataCount: data?.length || 0,
          sampledDataCount: processedData?.length || 0,
          timestamp: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Request timeout');
        return new Response(JSON.stringify({ 
          error: "Analysis timeout. Please try with less data or wait a moment." 
        }), {
          status: 504,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
