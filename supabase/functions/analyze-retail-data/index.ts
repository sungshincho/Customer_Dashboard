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
    const { data, analysisType, nodeRelations, stream, metadata } = await req.json();
    console.log("🔵 LSTM-GNN 하이브리드 분석 시작", { 
      analysisType, 
      dataLength: data?.length,
      datasets: metadata?.datasets?.length 
    });

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

            // 데이터 통계 생성 (확장형)
            const columns = processedData.length > 0 ? Object.keys(processedData[0]) : [];
            const columnStats: any = {};
            
            // 각 컬럼의 통계 정보 계산
            columns.forEach(col => {
              const values = processedData.map((row: any) => row[col]).filter((v: any) => v != null);
              const numericValues = values.filter((v: any) => typeof v === 'number' || !isNaN(Number(v)));
              
              if (numericValues.length > 0) {
                const nums = numericValues.map((v: any) => Number(v));
                const sorted = [...nums].sort((a, b) => a - b);
                columnStats[col] = {
                  type: 'numeric',
                  count: nums.length,
                  min: Math.min(...nums),
                  max: Math.max(...nums),
                  avg: nums.reduce((a: number, b: number) => a + b, 0) / nums.length,
                  median: sorted[Math.floor(sorted.length / 2)],
                  sum: nums.reduce((a: number, b: number) => a + b, 0),
                  sample: values.slice(0, 5)
                };
              } else {
                const uniqueValues = [...new Set(values)];
                const valueCounts: Record<string, number> = {};
                values.forEach((v: any) => {
                  const key = String(v);
                  valueCounts[key] = (valueCounts[key] || 0) + 1;
                });
                const topValues = Object.entries(valueCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([val, count]) => ({ value: val, count }));
                
                columnStats[col] = {
                  type: 'categorical',
                  count: values.length,
                  unique: uniqueValues.length,
                  top: topValues,
                  sample: values.slice(0, 5)
                };
              }
            });

            const dataStats = {
              totalRecords: data.length,
              sampledRecords: processedData.length,
              dataTypes: analysisType,
              columns: columns,
              columnStats: columnStats,
              sampleRecords: processedData.slice(0, 30)
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

            // 메타데이터 기반 데이터 품질 및 컨텍스트 생성
            const dataContext = metadata?.datasets ? metadata.datasets.map((ds: any) => 
              `[${ds.schema_type}] ${ds.record_count}개 레코드 (품질: ${(ds.quality_score * 100).toFixed(0)}%)`
            ).join('\n') : '';

            const systemPrompt = `당신은 LSTM-GNN 하이브리드 모델을 활용한 리테일 분석 전문가입니다.

**핵심 원칙:**
1. 제공된 실제 데이터만 사용 - 가상 데이터 절대 금지
2. 모든 수치는 실제 데이터 통계에서 계산
3. 노드와 엣지는 실제 데이터의 값과 관계 반영
4. 인사이트는 데이터에서 관찰된 패턴만 기술

**분석 방법론:**
1. LSTM 시계열 분석: 매출/트래픽 패턴, 계절성, 트렌드 예측
2. GNN 그래프 분석: 고객-상품-매장 관계, 공간 네트워크, 동선 패턴
3. 엔터프라이즈 스키마 기반: 정규화된 데이터 구조 활용

**데이터 컨텍스트:**
${dataContext}

**출력 규칙:**
- 간결성: 인사이트당 50-80자
- 정확성: 통계 기반 수치만 사용
- 실행성: 구체적이고 즉시 적용 가능
- 한글: 모든 출력은 한글로만 작성

**금지사항:**
- 예시나 가상의 데이터 사용 금지
- 제공되지 않은 필드 언급 금지
- 추측성 수치 사용 금지`;

            const userPrompt = `
**CRITICAL: 실제 데이터만 분석하세요**

아래는 실제로 임포트된 ${dataStats.totalRecords}개의 데이터입니다. 
이 데이터의 실제 패턴과 수치를 기반으로만 분석해야 합니다.
가상의 데이터나 예시를 만들지 마세요.

**데이터 컨텍스트:**
- 타입: ${analysisType}
- 전체 레코드: ${data.length}개
- 분석 샘플: ${processedData.length}개
- 데이터 품질: ${metadata?.datasets?.map((ds: any) => `${(ds.quality_score * 100).toFixed(0)}%`).join(', ')}

**전체 컬럼 통계 (핵심 정보):**
컬럼 수: ${columns.length}개
${Object.entries(dataStats.columnStats).slice(0, 15).map(([col, stat]: [string, any]) => {
  if (stat.type === 'numeric') {
    return `- ${col}: 숫자 (평균 ${stat.avg?.toFixed(1)}, 범위 ${stat.min}-${stat.max})`;
  } else {
    return `- ${col}: 범주 (${stat.unique}개, 예: ${stat.top.slice(0, 2).map((t: any) => t.value).join(', ')})`;
  }
}).join('\n')}

**실제 샘플 데이터 (최신 30개 레코드):**
${JSON.stringify(dataStats.sampleRecords, null, 2)}

**분석 지침:**
1. 위 샘플 데이터에서 실제로 관찰되는 패턴만 사용하세요
2. 컬럼 통계의 min, max, avg, sum 값을 활용하세요
3. categorical 필드의 top 값들을 기반으로 세그먼트를 만드세요
4. 노드는 실제 데이터의 고유값(예: 매장ID, 상품코드)을 사용하세요
5. 엣지는 실제 데이터에서 발견된 관계만 표현하세요
6. 모든 수치는 위 통계에서 계산 가능한 값이어야 합니다

**분석 목표:**
1. 시계열 패턴 발굴 (LSTM): 매출 트렌드, 계절성, 이상 탐지
2. 관계 네트워크 구축 (GNN): 고객-상품-매장 상호작용
3. 실행 가능한 인사이트: 매출 증대, 전환율 개선, 재고 최적화

**출력 구조:**
- 노드 8-12개: 핵심 엔티티 (고객 세그먼트, 인기 상품, 주요 매장/구역)
- 엣지 10-15개: 강한 관계 (구매, 방문, 상관관계 등)
- 인사이트 3-5개: 구체적 수치 + 실행 방안
- 상관관계 3-4개: 통계적으로 유의미한 관계 (r > 0.5)
- WTP/ATV 분석: 가격 최적화 기회

**계산 방법:**
- ATV = 총 매출액 / 총 거래 건수
- WTP = 실제 판매가 × (1 - 평균 할인율 × 탄력성)
- 상관계수: Pearson correlation

모든 텍스트는 한글로만 작성하세요.`;

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
                  { 
                    role: 'system', 
                    content: systemPrompt
                  },
                  { role: 'user', content: userPrompt }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "lstm_gnn_retail_analysis",
                    description: "LSTM-GNN 하이브리드 모델 기반 리테일 데이터 분석 (시계열 + 그래프 네트워크)",
                    parameters: {
                      type: "object",
                      properties: {
                        nodes: {
                          type: "array",
                          description: "그래프 노드 8-12개 (고객, 상품, 매장, 구역 등 핵심 엔티티)",
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
                          },
                          minItems: 6,
                          maxItems: 10
                        },
                        edges: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              source: { type: "string" },
                              target: { type: "string" },
                              type: { type: "string" },
                              weight: { type: "number" }
                            },
                            required: ["source", "target", "type", "weight"]
                          },
                          minItems: 6,
                          maxItems: 12
                        },
                        insights: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              category: { type: "string" },
                              title: { type: "string" },
                              description: { type: "string" },
                              impact: { type: "string" },
                              actionable: { type: "string" }
                            },
                            required: ["category", "title", "description", "impact", "actionable"]
                          },
                          minItems: 3,
                          maxItems: 5
                        },
                        correlations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              factor1: { type: "string" },
                              factor2: { type: "string" },
                              correlation: { type: "number" },
                              correlationPercent: { type: "string" },
                              insight: { type: "string" },
                              actionable: { type: "string" }
                            },
                            required: ["factor1", "factor2", "correlation", "correlationPercent", "insight", "actionable"]
                          },
                          minItems: 2,
                          maxItems: 4
                        },
                        wtpAnalysis: {
                          type: "object",
                          properties: {
                            avgWTP: { type: "number" },
                            atv: { type: "number" },
                            priceElasticityScore: { type: "number" },
                            priceElasticityInsights: {
                              type: "array",
                              items: { type: "string" }
                            },
                            pricingRecommendation: { type: "string" },
                            purchaseInfluencers: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  factor: { type: "string" },
                                  score: { type: "number" },
                                  insight: { type: "string" }
                                },
                                required: ["factor", "score", "insight"]
                              }
                            },
                            actionable: { type: "string" }
                          },
                          required: ["avgWTP", "atv", "priceElasticityScore", "actionable"]
                        },
                        timeSeriesPatterns: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              period: { type: "string" },
                              trend: { type: "string" },
                              seasonality: { type: "string" }
                            }
                          }
                        },
                        summary: { type: "string" }
                      },
                      required: ["nodes", "edges", "insights", "correlations", "summary"]
                    }
                  }
                }],
                tool_choice: { type: "function", function: { name: "lstm_gnn_retail_analysis" } },
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
              
              if (toolCall && toolCall.function.name === 'lstm_gnn_retail_analysis') {
                console.log("✅ LSTM-GNN 분석 완료");
                analysisResult = JSON.parse(toolCall.function.arguments);
                console.log(`✅ 결과: ${analysisResult.nodes?.length || 0}개 노드, ${analysisResult.edges?.length || 0}개 엣지`);
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
