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
    const { data, analysisType, nodeRelations } = await req.json();
    console.log("🔵 Starting retail data analysis", { analysisType, dataLength: data?.length });

    // 데이터가 너무 많으면 샘플링 (최대 300개)
    let processedData = data;
    if (data && data.length > 300) {
      const sampleSize = 300;
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

    // 데이터 통계 생성
    const dataStats = {
      totalRecords: data.length,
      sampledRecords: processedData.length,
      dataTypes: analysisType,
      sampleData: processedData.slice(0, 50), // 처음 50개만 상세 데이터로
      columns: processedData.length > 0 ? Object.keys(processedData[0]) : [],
      summary: {
        numericFields: {} as Record<string, { min: number, max: number, avg: number }>,
        categoricalFields: {} as Record<string, string[]>
      }
    };

    // 숫자형 필드 통계
    if (processedData.length > 0) {
      const firstRecord = processedData[0];
      Object.keys(firstRecord).forEach(key => {
        const values = processedData.map((r: any) => r[key]).filter((v: any) => typeof v === 'number');
        if (values.length > 0) {
          dataStats.summary.numericFields[key] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a: number, b: number) => a + b, 0) / values.length
          };
        } else {
          const categoricalValues = processedData.map((r: any) => r[key]).filter((v: any) => v !== null && v !== undefined);
          const uniqueValues = [...new Set(categoricalValues)].slice(0, 20) as string[]; // 최대 20개 유니크 값
          if (uniqueValues.length > 0) {
            dataStats.summary.categoricalFields[key] = uniqueValues;
          }
        }
      });
    }

    const userPrompt = `
분석 유형: ${analysisType}
총 데이터 수: ${data.length}개 (샘플링: ${processedData.length}개)
데이터 통계:
${JSON.stringify(dataStats, null, 2)}

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

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
