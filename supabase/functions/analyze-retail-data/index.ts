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

            const systemPrompt = `당신은 오프라인 리테일 데이터 분석 전문가입니다. LSTM-GNN 하이브리드 모델 개념을 활용하여 데이터를 분석합니다.

온톨로지 노드 타입: ${JSON.stringify(ontologyNodes, null, 2)}
관계 타입: ${JSON.stringify(relationshipTypes, null, 2)}

분석 목표:
1. 매출 상승 방법 도출
2. 전년동기대비 매출 변화 원인 파악
3. 데이터 팩터 간 상관관계 분석
4. WTP (Willingness To Pay) 분석

**중요: 반드시 아래 예시와 동일한 JSON 구조로만 응답하세요. 모든 필드는 필수입니다:**

예시 응답:
{
  "nodes": [
    {
      "id": "customer-segment-vip",
      "type": "Customer",
      "label": "VIP 고객군",
      "properties": { "segment": "VIP", "count": 120 },
      "metrics": { "avgPurchase": 85000, "visitFrequency": "주 2회" }
    },
    {
      "id": "product-premium-coffee",
      "type": "Product",
      "label": "프리미엄 커피",
      "properties": { "category": "음료", "price": 6500 },
      "metrics": { "salesVolume": 450, "margin": 0.62 }
    },
    {
      "id": "zone-entrance",
      "type": "Zone",
      "label": "매장 입구",
      "properties": { "area": "입구 5m 반경" },
      "metrics": { "traffic": 1200, "dwellTime": "45초" }
    }
  ],
  "edges": [
    {
      "source": "customer-segment-vip",
      "target": "product-premium-coffee",
      "type": "purchases",
      "weight": 0.85,
      "properties": { "frequency": "높음", "avgQuantity": 2.3 }
    },
    {
      "source": "customer-segment-vip",
      "target": "zone-entrance",
      "type": "visits",
      "weight": 0.72,
      "properties": { "conversionRate": 0.68 }
    },
    {
      "source": "zone-entrance",
      "target": "zone-main-display",
      "type": "moves_to",
      "weight": 0.65,
      "properties": { "transitionRate": "65%" }
    }
  ],
  "insights": [
    {
      "title": "VIP 고객의 프리미엄 제품 선호도 증가",
      "description": "최근 3개월간 VIP 고객의 프리미엄 제품 구매가 전년 대비 32% 증가했습니다. 특히 오전 시간대(10-12시)의 구매율이 높습니다.",
      "impact": "high",
      "recommendation": "오전 시간대 VIP 고객 대상 프리미엄 신제품 프로모션 진행 및 전용 공간 확대를 권장합니다."
    },
    {
      "title": "입구 동선과 매출의 강한 상관관계",
      "description": "입구에서 메인 디스플레이로의 자연스러운 동선이 확보된 날의 평균 매출이 15% 높습니다.",
      "impact": "medium",
      "recommendation": "입구 진열대 높이를 낮추고 메인 디스플레이로의 시선 유도 사이니지를 설치하세요."
    }
  ],
  "correlations": [
    {
      "factor1": "입구 체류시간",
      "factor2": "1일 매출",
      "correlation": 0.73,
      "significance": "입구에서 45초 이상 머무는 고객의 구매 전환율이 2.3배 높음"
    },
    {
      "factor1": "프리미엄 제품 진열 위치",
      "factor2": "VIP 고객 방문 빈도",
      "correlation": 0.68,
      "significance": "눈높이 진열 시 VIP 고객 재방문율 28% 증가"
    },
    {
      "factor1": "날씨(맑음)",
      "factor2": "신규 고객 유입",
      "correlation": 0.54,
      "significance": "맑은 날 신규 고객 유입이 평균 23% 증가"
    }
  ],
  "wtpAnalysis": {
    "avgWTP": "24,500원",
    "priceElasticity": "-1.35 (탄력적)",
    "recommendations": [
      "현재 평균 판매가 21,000원 대비 3,500원 상향 여지 존재",
      "프리미엄 라인 가격을 27,000원까지 인상 가능 (VIP 세그먼트)",
      "번들 상품 구성 시 단품 합계 대비 15% 할인으로 판매량 극대화"
    ]
  },
  "timeSeriesPatterns": [
    {
      "period": "주간 패턴",
      "trend": "상승",
      "seasonality": "주말(금-일) 매출이 평일 대비 평균 42% 높음. 특히 토요일 오후 2-5시가 피크",
      "anomalies": ["10월 2주차 평일 매출 급증(지역 축제 영향)", "8월 마지막 주 주말 매출 30% 감소(경쟁사 오픈)"]
    },
    {
      "period": "시간대 패턴",
      "trend": "유지",
      "seasonality": "오전(10-12시) VIP 고객 집중, 오후(2-5시) 일반 고객 증가, 저녁(6-8시) 직장인 유입",
      "anomalies": ["비 오는 날 저녁 시간대 매출 18% 증가(배달 수요 전환)"]
    }
  ]
}

위 예시처럼 구체적인 수치와 실행 가능한 인사이트를 포함하여 응답하세요.`;

            const userPrompt = `
분석 유형: ${analysisType}
총 데이터 수: ${data.length}개 (샘플링: ${processedData.length}개)
데이터 컬럼: ${dataStats.columns.join(', ')}
샘플 데이터:
${JSON.stringify(dataStats.sampleRecords, null, 2)}

활성화된 노드 관계: ${JSON.stringify(nodeRelations || 'all', null, 2)}

**필수 요구사항:**
아래의 완전한 JSON 형식으로만 응답하세요. 설명 없이 JSON만 반환하세요.

{
  "nodes": [
    { "id": "고유ID", "type": "Customer|Product|Brand|Store|Zone|Path|Transaction|Event", "label": "노드명", "properties": {}, "metrics": {} }
  ],
  "edges": [
    { "source": "시작노드ID", "target": "목표노드ID", "type": "purchases|visits|moves_to|contains|located_in|belongs_to|influenced_by|correlated_with", "weight": 0.0~1.0, "properties": {} }
  ],
  "insights": [
    { "title": "인사이트 제목", "description": "상세 설명", "impact": "high|medium|low", "recommendation": "실행 가능한 권장사항" }
  ],
  "correlations": [
    { "factor1": "팩터1명", "factor2": "팩터2명", "correlation": 0.0~1.0, "significance": "설명" }
  ],
  "wtpAnalysis": {
    "avgWTP": "평균 지불 의향 금액",
    "priceElasticity": "가격 탄력성 수치",
    "recommendations": ["권장사항1", "권장사항2", "권장사항3"]
  },
  "timeSeriesPatterns": [
    { "period": "기간", "trend": "상승|하락|유지", "seasonality": "계절성 설명", "anomalies": ["이상치 설명"] }
  ]
}

위 데이터를 분석하여 각 필드를 모두 채워주세요. 데이터가 부족하면 합리적인 추론을 사용하세요.`;

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
                temperature: 0.7,
                max_tokens: 6000,
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
              
              // JSON 추출 시도
              let jsonStr = content;
              const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
              if (jsonMatch) {
                jsonStr = jsonMatch[1];
              } else {
                const objectMatch = content.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                  jsonStr = objectMatch[0];
                }
              }
              
              console.log("🔍 Extracted JSON length:", jsonStr.length);
              
              // JSON 수정 시도 (불완전한 JSON 처리)
              let fixedJson = jsonStr.trim();
              
              // 끝나지 않은 문자열 수정
              if (!fixedJson.endsWith('}')) {
                console.log("⚠️ JSON appears truncated, attempting to fix...");
                
                // 마지막 완전한 객체/배열까지만 사용
                const lastCompleteObject = fixedJson.lastIndexOf('}');
                const lastCompleteArray = fixedJson.lastIndexOf(']');
                const cutPoint = Math.max(lastCompleteObject, lastCompleteArray);
                
                if (cutPoint > 0) {
                  fixedJson = fixedJson.substring(0, cutPoint + 1);
                  
                  // 닫히지 않은 중괄호 수정
                  const openBraces = (fixedJson.match(/\{/g) || []).length;
                  const closeBraces = (fixedJson.match(/\}/g) || []).length;
                  if (openBraces > closeBraces) {
                    fixedJson += '}'.repeat(openBraces - closeBraces);
                  }
                }
              }
              
              analysisResult = JSON.parse(fixedJson);
              console.log("✅ Successfully parsed JSON");
              
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
                  description: "AI 응답을 파싱할 수 없습니다. 응답이 너무 길거나 형식이 잘못되었습니다.",
                  impact: "high",
                  recommendation: "데이터 양을 줄이거나 분석 범위를 좁혀서 다시 시도하세요"
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
