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

            const systemPrompt = `당신은 리테일 데이터를 실행 가능한 비즈니스 인사이트로 변환하는 전문 분석 AI입니다.

**핵심 역량:**
• 매출 증대 기회 발굴 (구체적인 수치와 함께)
• 고객 동선 최적화 (Zone별 개선 포인트)
• 상품 배치 전략 (교차판매 기회)
• 가격 최적화 (WTP 기반)

**분석 원칙:**
1. 간결성: 핵심만 전달 (인사이트당 50-80자)
2. 구체성: 정확한 수치와 비율 제시
3. 실행성: 즉시 적용 가능한 권장사항
4. 임팩트: 매출/전환율 향상에 직접 기여

**중요: 모든 출력은 한글로만 작성. 영어 단어 사용 금지.**`;

            const userPrompt = `
데이터: ${analysisType} | 총 ${data.length}개 레코드 중 ${processedData.length}개 분석
샘플 데이터:
${JSON.stringify(dataStats.sampleRecords.slice(0, 3), null, 2)}

**분석 과제:**
이 데이터에서 매출을 즉시 증대시킬 수 있는 TOP 3 기회를 찾아내세요.

**출력 요구사항:**
1. 그래프 노드 6-10개 (핵심 엔티티만)
2. 관계 엣지 6-12개 (강한 상관관계만)
3. 인사이트 3-4개 (각 50-80자, 구체적 수치 포함)
   - 예: "Zone A 방문객 중 23%만 구매. 상품 재배치로 40% 목표"
4. 상관관계 2-3개 (r > 0.5만)
5. WTP 분석 (데이터 있을 경우, 구체적 가격대 제시)

**금지 사항:**
- 추상적/일반적 표현
- 데이터 없이 추측
- 실행 불가능한 권장사항

**필수: 모든 텍스트 한글로만 작성. 인사이트에 구체적 수치/비율 포함.**`;

            sendProgress(40, 'analyzing', 'AI 분석 진행 중... (30-60초 소요 예상)');

            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                    content: `당신은 고급 리테일 분석 AI입니다. 고객 행동, 매장 레이아웃, 상품, 매출을 분석하여 다음을 제공합니다:
- 고객 동선 패턴 및 세그먼트
- Zone 성과 및 공간 상관관계
- 상품-위치 효과성
- 매출-동선 전환율
- WTP (지불 의향) 인사이트
- 교차 판매 기회
- 운영 최적화 권장사항

**중요: 모든 응답은 반드시 한글로 작성하세요. 영어를 사용하지 마세요.**
구조화되고 실행 가능한 인사이트를 한글로 반환하세요.`
                  },
                  { role: 'user', content: userPrompt }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "generate_retail_insights",
                    description: "리테일 분석 인사이트를 그래프 구조로 생성합니다. 모든 텍스트는 한글로 작성해야 합니다.",
                    parameters: {
                      type: "object",
                      properties: {
                        nodes: {
                          type: "array",
                          description: "엔티티를 나타내는 그래프 노드 (5-15개), label은 반드시 한글",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              type: { type: "string" },
                              label: { type: "string" },
                              properties: { type: "object" },
                              metrics: { type: "object" }
                            },
                            required: ["id", "type", "label"]
                          }
                        },
                        edges: {
                          type: "array",
                          description: "관계를 나타내는 그래프 엣지 (5-20개), label은 반드시 한글",
                          items: {
                            type: "object",
                            properties: {
                              source: { type: "string" },
                              target: { type: "string" },
                              type: { type: "string" },
                              weight: { type: "number" },
                              label: { type: "string" }
                            },
                            required: ["source", "target", "type"]
                          }
                        },
                        insights: {
                          type: "array",
                          description: "핵심 비즈니스 인사이트 3-4개. 각 인사이트는 50-80자로 간결하게, 구체적 수치 포함 필수. 한글만 사용.",
                          items: {
                            type: "object",
                            properties: {
                              category: { type: "string", description: "카테고리: 매출/동선/상품/전환율" },
                              title: { type: "string", description: "핵심 발견 (20자 이내)" },
                              description: { type: "string", description: "구체적 데이터와 수치 (50-80자)" },
                              impact: { type: "string", enum: ["high", "medium", "low"] },
                              actionable: { type: "string", description: "즉시 실행 가능한 1가지 액션 (50자 이내)" }
                            },
                            required: ["category", "title", "description", "impact", "actionable"]
                          }
                        },
                        correlations: {
                          type: "array",
                          description: "강한 상관관계 2-3개 (r > 0.5만). 한글만 사용. actionable 필수.",
                          items: {
                            type: "object",
                            properties: {
                              factor1: { type: "string", description: "첫번째 요소 (한글)" },
                              factor2: { type: "string", description: "두번째 요소 (한글)" },
                              correlation: { type: "number", description: "상관계수 -1~1" },
                              insight: { type: "string", description: "인사이트 (40자 이내)" },
                              actionable: { type: "string", description: "실행 방안 (40자 이내)" }
                            },
                            required: ["factor1", "factor2", "correlation", "insight", "actionable"]
                          }
                        },
                        wtpAnalysis: {
                          type: "object",
                          description: "WTP 및 ATV 분석 (거래/매출 데이터 있을 경우). 한글만 사용.",
                          properties: {
                            avgWTP: { 
                              type: "number",
                              description: "평균 지불 의향 (%p 단위, 소수점 1자리)"
                            },
                            atv: {
                              type: "number", 
                              description: "객단가 Average Transaction Value (원 단위)"
                            },
                            priceElasticityScore: {
                              type: "number",
                              description: "가격 탄력성 점수 0-10 (높을수록 가격 민감)"
                            },
                            priceElasticityInsights: {
                              type: "array",
                              description: "가격 탄력성 핵심 인사이트 2-3개 (각 30자 이내)",
                              items: { type: "string" }
                            },
                            actionable: {
                              type: "string",
                              description: "WTP/ATV 기반 핵심 실행 방안 (50자 이내)"
                            }
                          },
                          required: ["avgWTP", "atv", "priceElasticityScore", "priceElasticityInsights", "actionable"]
                        },
                        timeSeriesPatterns: {
                          type: "array",
                          description: "시계열 패턴 (1-3개), 반드시 한글로 작성",
                          items: {
                            type: "object",
                            properties: {
                              period: { type: "string" },
                              trend: { type: "string" },
                              seasonality: { type: "string" },
                              anomalies: {
                                type: "array",
                                items: { type: "string" }
                              }
                            }
                          }
                        },
                        summary: { 
                          type: "string",
                          description: "분석 전체 요약 (최대 200자), 반드시 한글로 작성"
                        }
                      },
                      required: ["nodes", "edges", "insights", "summary"]
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "generate_retail_insights" } },
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
              // Tool calling을 사용했으므로 tool_calls에서 arguments를 파싱
              const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
              
              if (toolCall && toolCall.function.name === 'generate_retail_insights') {
                console.log("✅ Tool call detected, parsing arguments");
                analysisResult = JSON.parse(toolCall.function.arguments);
                console.log(`✅ Parsed result: ${analysisResult.nodes.length} nodes, ${analysisResult.edges.length} edges`);
              } else {
                // Fallback: content에서 JSON 추출 시도
                const content = aiResponse.choices[0].message.content || "{}";
                console.log("⚠️ No tool call, trying content parsing. Length:", content.length);
                
                let jsonStr = content.trim();
                const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
                
                const firstBrace = jsonStr.indexOf('{');
                const lastBrace = jsonStr.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                  jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                }
                
                analysisResult = JSON.parse(jsonStr);
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
              
            } catch (e) {
              console.error("⚠️ Failed to parse AI response:", e);
              console.error("Response:", JSON.stringify(aiResponse.choices[0], null, 2));
              
              analysisResult = {
                nodes: [],
                edges: [],
                insights: [{ 
                  category: "오류",
                  title: "분석 파싱 오류", 
                  description: "AI 응답을 파싱할 수 없습니다.",
                  impact: "high",
                  actionable: "데이터 양을 줄이거나 다시 시도하세요"
                }],
                correlations: [],
                wtpAnalysis: {
                  avgWTP: "파싱 오류",
                  priceElasticity: "파싱 오류",
                  recommendations: ["분석 재시도 필요"]
                },
                timeSeriesPatterns: [],
                summary: "분석 실패",
                error: e instanceof Error ? e.message : String(e)
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

    const systemPrompt = `당신은 다음 분야를 전문으로 하는 고급 리테일 분석 AI입니다:

**통합 분석**: 고객-공간-상품-매출 간 상관관계
**WTP 분석**: 지불 의향(Willingness To Pay) 및 가격 탄력성
**동선 패턴**: 고객 이동 및 zone 성과
**상품 최적화**: 위치 효과성 및 교차 판매
**비즈니스 인사이트**: 매출 증대를 위한 실행 가능한 권장사항

온톨로지 노드: ${JSON.stringify(ontologyNodes, null, 2)}
관계 유형: ${JSON.stringify(relationshipTypes, null, 2)}

**중요: 모든 노드 라벨, 인사이트, 설명은 반드시 한글로 작성하세요.**
매출과 고객 경험을 직접적으로 향상시키는 고영향 인사이트에 집중하세요.`;

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
총 레코드: ${data.length}개 (분석 중: ${processedData.length}개)
데이터 컬럼: ${dataStats.columns.join(', ')}
샘플 데이터 (처음 5개 레코드):
${JSON.stringify(dataStats.sampleRecords.slice(0, 5), null, 2)}

활성화된 노드 관계: ${JSON.stringify(nodeRelations || 'all', null, 2)}

**주요 목표:**
1. 고객-공간-상품-매출 간 상관관계 파악
2. WTP(지불 의향) 및 가격 탄력성 계산
3. 고영향 zone 및 상품 배치 발견
4. 매출 최적화 권장사항 생성

**지침:**
- 의미 있는 노드 5-12개 생성 (고객, Zone, 상품, 거래 유형)
- 관계를 나타내는 가중치 엣지 5-15개 생성
- 비즈니스 임팩트가 있는 실행 가능한 인사이트 3-5개 제공
- 핵심 요소 간 상관관계 2-4개 포함
- 거래 데이터가 있으면 WTP 패턴 분석
- 시간 기반 패턴(시간대별, 일별, 주별) 식별

**중요: 모든 label, title, description, actionable, insight는 반드시 한글로 작성하세요.**
매출과 고객 경험에 직접 영향을 미치는 인사이트에 집중하세요.
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
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `당신은 고급 리테일 분석 AI입니다. 고객 행동, 매장 레이아웃, 상품, 매출을 분석하여 다음을 제공합니다:
- 고객 동선 패턴 및 세그먼트
- Zone 성과 및 공간 상관관계
- 상품-위치 효과성
- 매출-동선 전환율
- WTP (지불 의향) 인사이트
- 교차 판매 기회
- 운영 최적화 권장사항

**중요: 모든 응답은 반드시 한글로 작성하세요. 영어를 사용하지 마세요.**
구조화되고 실행 가능한 인사이트를 한글로 반환하세요.`
            },
            { role: 'user', content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_retail_insights",
              description: "리테일 분석 인사이트를 그래프 구조로 생성합니다. 모든 텍스트는 한글로 작성해야 합니다.",
              parameters: {
                type: "object",
                properties: {
                nodes: {
                  type: "array",
                  description: "엔티티를 나타내는 그래프 노드 (5-15개), label은 반드시 한글",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string" },
                        label: { type: "string" },
                        properties: { type: "object" },
                        metrics: { type: "object" }
                      },
                      required: ["id", "type", "label"]
                    }
                  },
                edges: {
                  type: "array",
                  description: "관계를 나타내는 그래프 엣지 (5-20개), label은 반드시 한글",
                    items: {
                      type: "object",
                      properties: {
                        source: { type: "string" },
                        target: { type: "string" },
                        type: { type: "string" },
                        weight: { type: "number" },
                        label: { type: "string" }
                      },
                      required: ["source", "target", "type"]
                    }
                  },
                insights: {
                  type: "array",
                  description: "핵심 비즈니스 인사이트 (3-5개, 각 최대 150자), 반드시 한글로 작성",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        title: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                        actionable: { type: "string" }
                      },
                      required: ["category", "title", "description", "impact"]
                    }
                  },
                correlations: {
                  type: "array",
                  description: "요소 간 상관관계 (2-4개), 반드시 한글로 작성",
                    items: {
                      type: "object",
                      properties: {
                        factor1: { type: "string" },
                        factor2: { type: "string" },
                        correlation: { type: "number" },
                        significance: { type: "string" },
                        insight: { type: "string" }
                      },
                      required: ["factor1", "factor2", "correlation"]
                    }
                  },
                wtpAnalysis: {
                  type: "object",
                  description: "지불 의향(WTP) 분석, 모든 텍스트는 한글",
                    properties: {
                      avgWTP: { type: "string" },
                      priceElasticity: { type: "string" },
                      recommendations: {
                        type: "array",
                        items: { type: "string" }
                      }
                    }
                  },
                timeSeriesPatterns: {
                  type: "array",
                  description: "시계열 패턴 (1-3개), 반드시 한글로 작성",
                    items: {
                      type: "object",
                      properties: {
                        period: { type: "string" },
                        trend: { type: "string" },
                        seasonality: { type: "string" },
                        anomalies: {
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    }
                  },
                summary: { 
                  type: "string",
                  description: "분석 전체 요약 (최대 200자), 반드시 한글로 작성"
                }
                },
                required: ["nodes", "edges", "insights", "summary"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "generate_retail_insights" } },
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
        // Tool calling을 사용했으므로 tool_calls에서 arguments를 파싱
        const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
        
        if (toolCall && toolCall.function.name === 'generate_retail_insights') {
          console.log("✅ Tool call detected, parsing arguments");
          analysisResult = JSON.parse(toolCall.function.arguments);
          console.log(`✅ Parsed result: ${analysisResult.nodes.length} nodes, ${analysisResult.edges.length} edges`);
        } else {
          // Fallback: content에서 JSON 추출 시도
          const content = aiResponse.choices[0].message.content || "{}";
          console.log("⚠️ No tool call, trying content parsing");
          const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
          analysisResult = JSON.parse(jsonStr);
        }
        
        // 필수 필드 검증 및 기본값
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
        analysisResult.summary = analysisResult.summary || "분석 완료";
        
      } catch (e) {
        console.error("⚠️ Failed to parse AI response:", e);
        analysisResult = {
          nodes: [],
          edges: [],
          insights: [{ 
            category: "오류",
            title: "분석 파싱 오류", 
            description: "AI 응답을 파싱할 수 없습니다.",
            impact: "high",
            actionable: "데이터 양을 줄이거나 다시 시도하세요"
          }],
          correlations: [],
          wtpAnalysis: {
            avgWTP: "파싱 오류",
            priceElasticity: "파싱 오류",
            recommendations: ["분석 재시도 필요"]
          },
          timeSeriesPatterns: [],
          summary: "분석 실패",
          error: e instanceof Error ? e.message : String(e)
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
