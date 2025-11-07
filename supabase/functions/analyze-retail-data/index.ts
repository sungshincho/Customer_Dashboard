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

            const systemPrompt = `You are an advanced retail analytics AI specialized in:

**Integrated Analysis**: Customer-Space-Product-Sales correlations
**WTP Analysis**: Willingness To Pay and price elasticity
**Journey Patterns**: Customer movement and zone performance
**Product Optimization**: Location effectiveness and cross-selling
**Business Insights**: Actionable recommendations to increase revenue

Ontology Nodes: ${JSON.stringify(ontologyNodes, null, 2)}
Relationships: ${JSON.stringify(relationshipTypes, null, 2)}

Focus on high-impact insights that directly drive sales and customer experience.`;

            const userPrompt = `
Analysis Type: ${analysisType}
Total Records: ${data.length} (Analyzing: ${processedData.length})
Sample Data (first 5 records):
${JSON.stringify(dataStats.sampleRecords.slice(0, 5), null, 2)}

**Primary Objectives:**
1. Identify customer-space-product-sales correlations
2. Calculate WTP (Willingness To Pay) and price elasticity
3. Discover high-impact zones and product placements
4. Generate revenue optimization recommendations

**Instructions:**
- Create 5-12 meaningful nodes (Customer, Zone, Product, Transaction types)
- Create 5-15 weighted edges showing relationships
- Provide 3-5 actionable insights with business impact
- Include 2-4 correlations between key factors
- Analyze WTP patterns if transaction data exists
- Identify time-based patterns (hourly, daily, weekly)

Focus on insights that directly impact revenue and customer experience.`;

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
                    content: `You are an advanced retail analytics AI. Analyze customer behavior, store layout, products, and sales to provide:
- Customer journey patterns and segments
- Zone performance and spatial correlations
- Product-location effectiveness
- Sales-traffic conversion
- WTP (Willingness To Pay) insights
- Cross-selling opportunities
- Operational recommendations

Return structured, actionable insights.`
                  },
                  { role: 'user', content: userPrompt }
                ],
                tools: [{
                  type: "function",
                  function: {
                    name: "generate_retail_insights",
                    description: "Generate retail analytics insights with graph structure",
                    parameters: {
                      type: "object",
                      properties: {
                        nodes: {
                          type: "array",
                          description: "Graph nodes representing entities (5-15 nodes)",
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
                          description: "Graph edges representing relationships (5-20 edges)",
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
                          description: "Key business insights (3-5 insights, max 150 chars each)",
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
                          description: "Factor correlations (2-4 correlations)",
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
                          description: "Willingness To Pay analysis",
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
                          description: "Time series patterns (1-3 patterns)",
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
                          description: "Overall summary of analysis (max 200 chars)"
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

    const systemPrompt = `You are an advanced retail analytics AI specialized in:

**Integrated Analysis**: Customer-Space-Product-Sales correlations
**WTP Analysis**: Willingness To Pay and price elasticity
**Journey Patterns**: Customer movement and zone performance
**Product Optimization**: Location effectiveness and cross-selling
**Business Insights**: Actionable recommendations to increase revenue

Ontology Nodes: ${JSON.stringify(ontologyNodes, null, 2)}
Relationships: ${JSON.stringify(relationshipTypes, null, 2)}

Focus on high-impact insights that directly drive sales and customer experience.`;

    // 간단한 데이터 통계만 생성
    const dataStats = {
      totalRecords: data.length,
      sampledRecords: processedData.length,
      dataTypes: analysisType,
      columns: processedData.length > 0 ? Object.keys(processedData[0]).slice(0, 10) : [],
      sampleRecords: processedData.slice(0, 20) // 처음 20개만
    };

    const userPrompt = `
Analysis Type: ${analysisType}
Total Records: ${data.length} (Analyzing: ${processedData.length})
Data Columns: ${dataStats.columns.join(', ')}
Sample Data (first 5 records):
${JSON.stringify(dataStats.sampleRecords.slice(0, 5), null, 2)}

Activated Node Relations: ${JSON.stringify(nodeRelations || 'all', null, 2)}

**Primary Objectives:**
1. Identify customer-space-product-sales correlations
2. Calculate WTP (Willingness To Pay) and price elasticity
3. Discover high-impact zones and product placements
4. Generate revenue optimization recommendations

**Instructions:**
- Create 5-12 meaningful nodes (Customer, Zone, Product, Transaction types)
- Create 5-15 weighted edges showing relationships
- Provide 3-5 actionable insights with business impact
- Include 2-4 correlations between key factors
- Analyze WTP patterns if transaction data exists
- Identify time-based patterns (hourly, daily, weekly)

Focus on insights that directly impact revenue and customer experience.
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
              content: `You are an advanced retail analytics AI. Analyze customer behavior, store layout, products, and sales to provide:
- Customer journey patterns and segments
- Zone performance and spatial correlations
- Product-location effectiveness
- Sales-traffic conversion
- WTP (Willingness To Pay) insights
- Cross-selling opportunities
- Operational recommendations

Return structured, actionable insights.`
            },
            { role: 'user', content: userPrompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_retail_insights",
              description: "Generate retail analytics insights with graph structure",
              parameters: {
                type: "object",
                properties: {
                  nodes: {
                    type: "array",
                    description: "Graph nodes representing entities (5-15 nodes)",
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
                    description: "Graph edges representing relationships (5-20 edges)",
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
                    description: "Key business insights (3-5 insights, max 150 chars each)",
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
                    description: "Factor correlations (2-4 correlations)",
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
                    description: "Willingness To Pay analysis",
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
                    description: "Time series patterns (1-3 patterns)",
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
                    description: "Overall summary of analysis (max 200 chars)"
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
