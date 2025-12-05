import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean AI response and extract valid JSON
function cleanJsonResponse(content: string): string {
  // Remove markdown code blocks
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

// 안전한 JSON 파싱 헬퍼
function safeParseAIResponse(aiContent: string, defaultValue: any): any {
  if (!aiContent || !aiContent.trim()) {
    console.warn('Empty AI response, using default');
    return defaultValue;
  }
  
  try {
    const cleaned = cleanJsonResponse(aiContent);
    if (cleaned.startsWith('{')) {
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Content preview:', aiContent.substring(0, 300));
  }
  
  return defaultValue;
}

interface InferenceRequest {
  inference_type: 'causal' | 'anomaly' | 'prediction' | 'pattern';
  data: any[];
  graph_data?: {
    nodes: any[];
    edges: any[];
  };
  time_series_data?: any[];
  parameters?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: InferenceRequest = await req.json();
    console.log('Advanced AI inference request:', body.inference_type);

    let result;
    switch (body.inference_type) {
      case 'causal':
        result = await performCausalInference(body, lovableApiKey);
        break;
      case 'anomaly':
        result = await performAnomalyDetection(body, lovableApiKey);
        break;
      case 'prediction':
        result = await performPredictiveModeling(body, lovableApiKey);
        break;
      case 'pattern':
        result = await performPatternDiscovery(body, lovableApiKey);
        break;
      default:
        throw new Error('Invalid inference type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Advanced AI inference error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Causal Inference: 인과 관계 추론
async function performCausalInference(request: InferenceRequest, apiKey: string) {
  const { data, graph_data, parameters = {} } = request;
  
  // 데이터 요약 생성
  const dataSummary = summarizeData(data, graph_data);
  
  const prompt = `You are an expert data scientist specializing in causal inference.

Analyze the following data and graph structure to identify potential causal relationships:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${graph_data ? `GRAPH STRUCTURE:
- Nodes: ${graph_data.nodes.length}
- Edges: ${graph_data.edges.length}
- Edge types: ${[...new Set(graph_data.edges.map(e => e.type))].join(', ')}
` : ''}

PARAMETERS:
- Confidence threshold: ${parameters.confidence_threshold || 0.7}
- Max causal chain length: ${parameters.max_chain_length || 3}

Your task:
1. Identify potential causal relationships (not just correlations)
2. Explain the reasoning behind each causal link
3. Rate confidence (0-1) for each relationship
4. Suggest interventions that could test these causal hypotheses
5. Identify confounding variables if present

Return a JSON object with this structure:
{
  "causal_relationships": [
    {
      "cause": "variable/node name",
      "effect": "variable/node name",
      "confidence": 0.85,
      "mechanism": "explanation of how cause leads to effect",
      "evidence": ["supporting evidence 1", "supporting evidence 2"],
      "confounders": ["potential confounding variable"],
      "test_intervention": "suggested way to test this causal link"
    }
  ],
  "causal_chains": [
    {
      "chain": ["A", "B", "C"],
      "description": "A causes B which causes C",
      "strength": 0.75
    }
  ],
  "insights": [
    "Key insight about causal structure"
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const analysis = JSON.parse(cleanedContent);
  
  return {
    type: 'causal_inference',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// Anomaly Detection: 이상 탐지
async function performAnomalyDetection(request: InferenceRequest, apiKey: string) {
  const { data, time_series_data, parameters = {} } = request;
  
  // 통계적 이상치 탐지 (baseline)
  const statisticalAnomalies = detectStatisticalAnomalies(data, parameters);
  
  // AI 기반 이상 탐지
  const dataSummary = summarizeData(data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in anomaly detection and data quality analysis.

Analyze the following data to identify anomalies, outliers, and unusual patterns:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES PATTERNS:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

STATISTICAL ANOMALIES DETECTED:
${JSON.stringify(statisticalAnomalies, null, 2)}

PARAMETERS:
- Sensitivity: ${parameters.sensitivity || 'medium'}
- Anomaly types to detect: ${parameters.anomaly_types?.join(', ') || 'all'}

Your task:
1. Identify all types of anomalies (point, contextual, collective)
2. Classify severity (critical, high, medium, low)
3. Explain why each instance is anomalous
4. Suggest root causes
5. Recommend actions to address anomalies

Return a JSON object:
{
  "anomalies": [
    {
      "type": "point|contextual|collective",
      "severity": "critical|high|medium|low",
      "location": "data point or time range",
      "description": "what makes this anomalous",
      "expected_value": "normal range or pattern",
      "actual_value": "observed value",
      "possible_causes": ["cause 1", "cause 2"],
      "recommended_action": "what to do about it",
      "confidence": 0.90
    }
  ],
  "patterns": [
    {
      "pattern_type": "trend|seasonality|cycle|drift",
      "description": "pattern description",
      "anomaly_impact": "how this affects normal behavior"
    }
  ],
  "summary": {
    "total_anomalies": 5,
    "critical_count": 1,
    "overall_data_health": "good|fair|poor",
    "key_concerns": ["concern 1", "concern 2"]
  }
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const analysis = JSON.parse(cleanedContent);
  
  return {
    type: 'anomaly_detection',
    timestamp: new Date().toISOString(),
    statistical_baseline: statisticalAnomalies,
    ai_analysis: analysis,
  };
}

// Predictive Modeling: 예측 모델링
async function performPredictiveModeling(request: InferenceRequest, apiKey: string) {
  const { data, time_series_data, graph_data, parameters = {} } = request;
  
  // Scenario-specific handling
  const scenarioType = parameters.scenario_type;
  
  if (scenarioType === 'layout') {
    return performLayoutSimulation(request, apiKey);
  } else if (scenarioType === 'demand') {
    return performDemandForecast(request, apiKey);
  } else if (scenarioType === 'inventory') {
    return performInventoryOptimization(request, apiKey);
  } else if (scenarioType === 'pricing') {
    return performPricingOptimization(request, apiKey);
  } else if (scenarioType === 'recommendation') {
    return performRecommendationStrategy(request, apiKey);
  }
  
  const dataSummary = summarizeData(data, graph_data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in predictive modeling and forecasting.

Analyze historical data and graph structure to make predictions:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES DATA:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

${graph_data ? `GRAPH INFLUENCE:
Nodes can influence each other through ${graph_data.edges.length} relationships.
` : ''}

PARAMETERS:
- Forecast horizon: ${parameters.forecast_horizon || '7 days'}
- Target variable: ${parameters.target_variable || 'auto-detect'}
- Include confidence intervals: ${parameters.confidence_intervals || true}

Your task:
1. Identify key predictive features
2. Make forecasts for the target variable
3. Provide confidence intervals
4. Explain prediction drivers
5. Identify risks and uncertainties
6. Consider graph-based influences (if applicable)

Return a JSON object:
{
  "predictions": [
    {
      "timestamp": "2025-01-15",
      "predicted_value": 125.5,
      "confidence_lower": 120.0,
      "confidence_upper": 131.0,
      "confidence_level": 0.95
    }
  ],
  "feature_importance": [
    {
      "feature": "feature name",
      "importance": 0.35,
      "trend": "increasing|decreasing|stable"
    }
  ],
  "drivers": [
    {
      "factor": "what's driving the prediction",
      "impact": "positive|negative|neutral",
      "magnitude": 0.25,
      "explanation": "why this matters"
    }
  ],
  "risks": [
    {
      "risk": "potential issue",
      "probability": 0.3,
      "impact": "high|medium|low",
      "mitigation": "how to address it"
    }
  ],
  "model_quality": {
    "reliability": "high|medium|low",
    "data_sufficiency": "sufficient|marginal|insufficient",
    "caveats": ["caveat 1", "caveat 2"]
  }
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const analysis = JSON.parse(cleanedContent);
  
  return {
    type: 'predictive_modeling',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// ============================================================================
// Layout Simulation v3 - As-Is/To-Be 비교 지원
// ============================================================================
async function performLayoutSimulation(request: InferenceRequest, apiKey: string) {
  console.log('performLayoutSimulation v3 - As-Is/To-Be Comparison');
  
  const { parameters = {} } = request;
  
  // storeContext 추출 (여러 가능한 경로)
  const storeContext = parameters.store_context || parameters.storeContext || {};
  
  console.log('=== Layout Simulation Start ===');
  console.log('StoreContext keys:', Object.keys(storeContext));
  console.log('StoreContext entities count:', storeContext.entities?.length || 0);

  // 가구 엔티티 필터링
  let furnitureEntities: any[] = [];
  
  if (storeContext.entities && storeContext.entities.length > 0) {
    // 엔티티 정규화
    const entities = storeContext.entities.map((e: any) => ({
      id: e.id,
      label: e.label,
      entityType: e.entityType || e.entity_type_name || 'unknown',
      model3dType: e.model_3d_type || e.model3dType,
      position: e.position || e.model_3d_position || { x: 0, y: 0, z: 0 },
      rotation: e.rotation || e.model_3d_rotation || { x: 0, y: 0, z: 0 },
      scale: e.scale || e.model_3d_scale || { x: 1, y: 1, z: 1 },
      properties: e.properties || {},
    }));

    console.log('Mapped entities:', entities.length);

    // 가구 타입 필터링
    furnitureEntities = entities.filter((e: any) => {
      const type = (e.entityType || '').toLowerCase();
      const model3dType = (e.model3dType || '').toLowerCase();
      
      // model_3d_type 기반 필터링
      if (['furniture', 'room', 'structure'].includes(model3dType)) return true;
      
      // entity_type_name 기반 필터링
      const furnitureTypes = ['shelf', 'rack', 'displaytable', 'checkoutcounter', 'fittingroom', 'entrance', 'gondola', 'counter', 'table', 'display'];
      if (furnitureTypes.some(t => type.toLowerCase().includes(t))) return true;
      
      return false;
    });

    console.log('Filtered furniture:', furnitureEntities.length);
  }

  // 가구가 없으면 빈 결과 반환
  if (furnitureEntities.length === 0) {
    console.log('No furniture found - returning empty result');
    return {
      type: 'layout_simulation',
      timestamp: new Date().toISOString(),
      asIsRecipe: { furniture: [], products: [] },
      toBeRecipe: { furniture: [], products: [] },
      layoutChanges: [],
      optimizationSummary: {
        expectedTrafficIncrease: 0,
        expectedRevenueIncrease: 0,
        changesCount: 0,
        confidence: 0,
      },
      aiInsights: ['가구 데이터가 없습니다. 디지털트윈 3D에서 가구를 추가해주세요.'],
      recommendations: [],
      confidenceScore: 0,
    };
  }

  // AI 프롬프트용 가구 목록 생성
  const furnitureList = furnitureEntities.slice(0, 15).map((f: any) => 
    `- [${f.id}] ${f.label} (${f.entityType}): pos(x=${f.position?.x?.toFixed?.(1) || 0}, z=${f.position?.z?.toFixed?.(1) || 0})`
  ).join('\n');

  const storeWidth = storeContext.storeInfo?.width || 17.4;
  const storeDepth = storeContext.storeInfo?.depth || 16.6;

  const prompt = `You are a retail store layout optimization expert.

STORE INFO:
- Name: ${storeContext.storeInfo?.name || 'Store'}
- Dimensions: ${storeWidth}m x ${storeDepth}m
- Total furniture: ${furnitureEntities.length} items

CURRENT FURNITURE LAYOUT (${furnitureEntities.length} items):
${furnitureList}

YOUR TASK:
Analyze the current layout and suggest 3-5 specific furniture position changes to improve:
1. Customer flow and traffic
2. Product visibility
3. Sales conversion

IMPORTANT RULES:
1. Use EXACT entityId from the list above
2. Keep positions within store bounds (x: 0-${storeWidth}, z: 0-${storeDepth})
3. Provide Korean explanations for reasons
4. Only suggest meaningful changes (at least 1 meter movement)

Return ONLY valid JSON (no markdown, no explanation):
{
  "layoutChanges": [
    {
      "entityId": "exact-uuid-from-furniture-list",
      "entityLabel": "가구 이름",
      "entityType": "Shelf",
      "currentPosition": {"x": 2.0, "y": 0, "z": 3.0},
      "suggestedPosition": {"x": 5.0, "y": 0, "z": 3.0},
      "reason": "고객 동선 개선을 위해 입구에서 더 잘 보이는 위치로 이동",
      "impact": "high"
    }
  ],
  "optimizationSummary": {
    "expectedTrafficIncrease": 15,
    "expectedRevenueIncrease": 8,
    "confidence": 75
  },
  "aiInsights": ["인사이트 1", "인사이트 2"],
  "recommendations": ["추천 1", "추천 2"]
}`;

  // AI 호출
  let aiResponse: any = {
    layoutChanges: [],
    optimizationSummary: { expectedTrafficIncrease: 0, expectedRevenueIncrease: 0, confidence: 50 },
    aiInsights: [],
    recommendations: [],
  };
  
  try {
    console.log('Calling AI API...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a retail layout expert. Return ONLY valid JSON, no markdown code blocks, no explanations.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content || '';
      
      console.log('AI response length:', aiContent.length);
      
      if (aiContent.trim()) {
        // JSON 클리닝
        const cleaned = cleanJsonResponse(aiContent);
        
        if (cleaned.startsWith('{')) {
          aiResponse = JSON.parse(cleaned);
          console.log('Parsed layoutChanges count:', aiResponse.layoutChanges?.length || 0);
        }
      }
    } else {
      console.error('AI API error:', response.status, await response.text());
    }
  } catch (e) {
    console.error('AI call error:', e);
  }

// layoutChanges 검증 및 정규화 - 실제 존재하는 entityId만 허용
  const validEntityIds = new Set(furnitureEntities.map((f: any) => f.id));

  const layoutChanges = Array.isArray(aiResponse.layoutChanges) 
    ? aiResponse.layoutChanges.filter((c: any) => {
        if (!c.entityId || !c.suggestedPosition) return false;
        
        // 실제 존재하는 entityId인지 확인
        if (!validEntityIds.has(c.entityId)) {
          console.warn(`Invalid entityId from AI: ${c.entityId} (${c.entityLabel})`);
          return false;
        }
        
        return true;
      })
    : [];

  console.log('Valid layoutChanges after filtering:', layoutChanges.length);

  // entityId -> 변경사항 매핑
  const changesMap = new Map<string, any>();
  layoutChanges.forEach((c: any) => {
    changesMap.set(c.entityId, c);
  });

  // As-Is / To-Be Recipe 생성
  const buildRecipe = (mode: 'current' | 'suggested') => ({
    furniture: furnitureEntities.map((f: any) => {
      const change = changesMap.get(f.id);
      const position = (mode === 'suggested' && change?.suggestedPosition) 
        ? change.suggestedPosition 
        : f.position;
      
      return {
        id: f.id,
        type: 'furniture',
        furniture_type: f.entityType,
        label: f.label,
        position: position,
        rotation: f.rotation || { x: 0, y: 0, z: 0 },
        scale: f.scale || { x: 1, y: 1, z: 1 },
        color: f.properties?.color || '#888888',
        isChanged: mode === 'suggested' && !!change,
      };
    }),
    products: [],
  });
  
  const rawConfidence = aiResponse.optimizationSummary?.confidence || 50;
  const normalizedConfidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  const result = {
    type: 'layout_simulation',
    timestamp: new Date().toISOString(),
    asIsRecipe: buildRecipe('current'),
    toBeRecipe: buildRecipe('suggested'),
    layoutChanges: layoutChanges,
    optimizationSummary: {
      expectedTrafficIncrease: aiResponse.optimizationSummary?.expectedTrafficIncrease || 0,
      expectedRevenueIncrease: aiResponse.optimizationSummary?.expectedRevenueIncrease || 0,
      changesCount: layoutChanges.length,
      confidence: normalizedConfidence,
    },
    aiInsights: Array.isArray(aiResponse.aiInsights) ? aiResponse.aiInsights : [],
    recommendations: Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
    confidenceScore: normalizedConfidence / 100, 
    ontologyInsights: {
      entitiesAnalyzed: furnitureEntities.length,
      optimizationBasis: 'furniture_position_analysis',
    },
  };

  console.log('=== Layout Simulation Complete ===');
  console.log('asIsRecipe furniture count:', result.asIsRecipe.furniture.length);
  console.log('toBeRecipe furniture count:', result.toBeRecipe.furniture.length);
  console.log('layoutChanges count:', result.layoutChanges.length);

  return result;
}

// Business Goal Analysis: 비즈니스 목표 분석 및 시나리오 추천
async function performBusinessGoalAnalysis(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const goalText = parameters.goal_text || '';
  
  const prompt = `You are an expert retail strategy consultant and data analyst.

BUSINESS GOAL: ${goalText}

Your task is to analyze this business goal and recommend 3-5 actionable simulation scenarios.
Each recommendation should specify which type of simulation would be most effective and why.

Consider:
1. Layout optimization - for improving customer flow, product placement, zone efficiency
2. Demand forecasting - for predicting customer demand, seasonal patterns, inventory needs
3. Inventory optimization - for reducing stockouts, optimizing reorder points, minimizing holding costs
4. Pricing optimization - for maximizing revenue, competitive positioning, promotional strategies
5. Recommendation strategies - for cross-selling, upselling, personalization, marketing campaigns

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "type": "layout|pricing|demand-inventory|recommendation",
      "title": "Clear, actionable recommendation title (Korean)",
      "description": "Detailed explanation of the recommended approach (Korean)",
      "priority": "high|medium|low",
      "suggestedActions": [
        "Specific action step 1 (Korean)",
        "Specific action step 2 (Korean)"
      ],
      "expectedImpact": "Expected business impact and metrics (Korean)"
    }
  ]
}

Provide 3-5 recommendations, prioritized by potential impact on the stated goal.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const analysis = JSON.parse(cleanedContent);
  
  return analysis;
}

// Demand Forecast: 수요 예측
async function performDemandForecast(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  // 실제 매장 데이터 요약
  let contextSummary = '';
  if (storeContext) {
    const avgRevenue = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.totalRevenue, 0) / storeContext.recentKpis.length
      : 0;
    const avgVisits = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.totalVisits, 0) / storeContext.recentKpis.length
      : 0;
    
    contextSummary = `
ACTUAL STORE DATA (Last 30 Days):
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Average Daily Revenue: ${Math.round(avgRevenue).toLocaleString()}원
- Average Daily Visits: ${Math.round(avgVisits)}명
- Total Products: ${storeContext.products?.length || 0}개
- Total Inventory Items: ${storeContext.inventory?.length || 0}개
- Product Categories: ${[...new Set(storeContext.products?.map((p: any) => p.category) || [])].join(', ')}
`;
  }
  
  const prompt = `You are an expert in demand forecasting and predictive analytics for retail.
${contextSummary}

FORECAST PARAMETERS:
- Forecast Horizon: ${parameters.forecastHorizonDays || 30} days
- Weather Consideration: ${parameters.includeWeather ? 'Yes' : 'No'}
- Event Consideration: ${parameters.includeEvents ? 'Yes' : 'No'}
- Economic Indicators: ${parameters.includeEconomicIndicators ? 'Yes' : 'No'}
- Weather Scenario: ${parameters.weatherScenario || 'normal'}

Return a comprehensive JSON object:
{
  "predictedKpi": {
    "conversionRate": 0.14,
    "totalRevenue": 45000000,
    "totalVisits": 1200,
    "totalPurchases": 168,
    "averageTransactionValue": 47000,
    "salesPerSqm": 890000,
    "netProfit": 19500000
  },
  "confidenceScore": 85,
  "aiInsights": "Detailed Korean explanation of demand predictions",
  "demandDrivers": [
    {
      "factor": "날씨 조건",
      "impact": "positive",
      "magnitude": 15,
      "explanation": "평균 기온 상승으로 여름 제품 수요 증가 예상"
    }
  ],
  "demandForecast": {
    "forecastData": {
      "dates": ["2025-01-01", "2025-01-02"],
      "predictedDemand": [150, 165],
      "confidence": [0.85, 0.87],
      "peakDays": ["2025-01-15"],
      "lowDays": ["2025-01-10"]
    },
    "summary": {
      "avgDailyDemand": 170,
      "peakDemand": 250,
      "totalForecast": 5100,
      "trend": "increasing"
    }
  },
  "topProducts": [
    {
      "sku": "PROD001",
      "name": "베스트셀러 상품명",
      "predictedDemand": 450,
      "trend": "up",
      "confidence": 0.88
    }
  ],
  "recommendations": [
    "주요 상품의 재고를 20% 증가시키세요"
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are a world-class demand forecasting expert specializing in retail predictive analytics.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const prediction = safeParseAIResponse(
  result.choices?.[0]?.message?.content || '',
  { /* 기본값 */ }
);
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'demand_forecast',
    timestamp: new Date().toISOString(),
    ...prediction,
  };
}

// Inventory Optimization: 재고 최적화
async function performInventoryOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  let contextSummary = '';
  if (storeContext?.inventory) {
    const totalStock = storeContext.inventory.reduce((sum: number, i: any) => sum + i.currentStock, 0);
    const lowStock = storeContext.inventory.filter((i: any) => i.currentStock < i.optimalStock * 0.5).length;
    const overStock = storeContext.inventory.filter((i: any) => i.currentStock > i.optimalStock * 1.5).length;
    
    contextSummary = `
ACTUAL INVENTORY DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Inventory Items: ${storeContext.inventory.length}개
- Total Current Stock: ${totalStock.toLocaleString()}개
- Low Stock Items (< 50% optimal): ${lowStock}개
- Overstock Items (> 150% optimal): ${overStock}개
`;
  }
  
  const prompt = `You are an expert in inventory management and supply chain optimization for retail.
${contextSummary}

INVENTORY PARAMETERS:
- Target Service Level: ${parameters.targetServiceLevel || 95}%
- Lead Time: ${parameters.leadTimeDays || 7} days
- Order Frequency: ${parameters.orderFrequencyDays || 14} days

Return a comprehensive JSON object:
{
  "predictedKpi": {
    "inventoryTurnover": 5.2,
    "stockoutRate": 0.02,
    "totalRevenue": 46000000,
    "netProfit": 20500000
  },
  "confidenceScore": 88,
  "aiInsights": "Detailed Korean explanation",
  "inventoryOptimization": {
    "recommendations": [
      {
        "productSku": "PROD001",
        "productName": "상품명",
        "currentStock": 50,
        "optimalStock": 120,
        "reorderPoint": 80,
        "safetyStock": 30,
        "orderQuantity": 70,
        "urgency": "high"
      }
    ],
    "summary": {
      "totalProducts": 50,
      "overstocked": 8,
      "understocked": 12,
      "optimal": 30,
      "potentialSavings": 2500000,
      "expectedTurnover": 5.8
    }
  },
  "recommendations": ["180개 재고 도달 시 자동 발주 트리거 설정"]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert supply chain consultant specializing in inventory optimization for retail.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const prediction = safeParseAIResponse(
  result.choices?.[0]?.message?.content || '',
  { /* 기본값 */ }
);
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  if (prediction.inventoryOptimization?.summary) {
    const summary = prediction.inventoryOptimization.summary;
    summary.totalProducts = Number(summary.totalProducts || 0);
    summary.overstocked = Number(summary.overstocked || 0);
    summary.understocked = Number(summary.understocked || 0);
    summary.optimal = Number(summary.optimal || 0);
    summary.potentialSavings = Number(summary.potentialSavings || 0);
    summary.expectedTurnover = Number(summary.expectedTurnover || 0);
  }
  
  return {
    type: 'inventory_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
  };
}

// Pricing Optimization: 가격 최적화
async function performPricingOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  let contextSummary = '';
  if (storeContext?.products) {
    const avgPrice = storeContext.products.reduce((sum: number, p: any) => sum + p.sellingPrice, 0) / storeContext.products.length;
    const avgMargin = storeContext.products.reduce((sum: number, p: any) => {
      const margin = ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100;
      return sum + margin;
    }, 0) / storeContext.products.length;
    
    contextSummary = `
ACTUAL PRODUCT PRICING DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Products: ${storeContext.products.length}개
- Average Selling Price: ${Math.round(avgPrice).toLocaleString()}원
- Average Margin: ${avgMargin.toFixed(1)}%
`;
  }
  
  const prompt = `You are an expert in pricing strategy and revenue optimization for retail.
${contextSummary}

PRICING PARAMETERS:
- Price Change: ${parameters.priceChangePercent || 0}%
- Target Margin: ${parameters.targetMarginPercent || 30}%
- Discount Strategy: ${parameters.discountStrategy || 'none'}

Return a comprehensive JSON object:
{
  "predictedKpi": {
    "conversionRate": 0.15,
    "averageTransactionValue": 52000,
    "totalRevenue": 52000000,
    "grossMargin": 0.32,
    "netProfit": 22500000
  },
  "confidenceScore": 86,
  "aiInsights": "Detailed Korean explanation",
  "pricingOptimization": {
    "recommendations": [
      {
        "productSku": "PROD001",
        "productName": "상품명",
        "currentPrice": 45000,
        "optimalPrice": 47500,
        "priceChange": 5.6,
        "expectedDemandChange": -3.2,
        "expectedRevenueChange": 12.5,
        "elasticity": -0.8
      }
    ],
    "summary": {
      "totalProducts": 50,
      "avgPriceChange": 3.5,
      "expectedRevenueIncrease": 5500000,
      "expectedMarginIncrease": 2.3
    }
  },
  "recommendations": ["느린 판매 상품에 10% 할인 테스트"]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [
        { 
          role: 'system', 
          content: 'You are a revenue optimization strategist with expertise in retail pricing.' 
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const prediction = safeParseAIResponse(
  result.choices?.[0]?.message?.content || '',
  { /* 기본값 */ }
);
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  if (prediction.pricingOptimization?.summary) {
    const summary = prediction.pricingOptimization.summary;
    summary.totalProducts = Number(summary.totalProducts || 0);
    summary.avgPriceChange = Number(summary.avgPriceChange || 0);
    summary.expectedRevenueIncrease = Number(summary.expectedRevenueIncrease || 0);
    summary.expectedMarginIncrease = Number(summary.expectedMarginIncrease || 0);
  }
  
  return {
    type: 'pricing_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
  };
}

// Recommendation Strategy: 추천 전략
async function performRecommendationStrategy(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  let contextSummary = '';
  if (storeContext) {
    const avgRevenue = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.totalRevenue, 0) / storeContext.recentKpis.length
      : 0;
    const avgConversion = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.conversionRate, 0) / storeContext.recentKpis.length
      : 0;
    
    contextSummary = `
ACTUAL STORE PERFORMANCE DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Average Daily Revenue: ${Math.round(avgRevenue).toLocaleString()}원
- Average Conversion Rate: ${(avgConversion * 100).toFixed(1)}%
- Total Products: ${storeContext.products?.length || 0}개
`;
  }
  
  const prompt = `You are an expert in retail marketing, customer analytics, and recommendation systems.
${contextSummary}

RECOMMENDATION PARAMETERS:
- Algorithm: ${parameters.algorithm || 'collaborative'}
- Max Recommendations: ${parameters.maxRecommendations || 10}

Return a JSON object:
{
  "predictedKpi": {
    "conversionRate": 0.16,
    "averageTransactionValue": 54000,
    "totalRevenue": 48500000,
    "netProfit": 21800000,
    "customerSatisfaction": 4.6
  },
  "confidenceScore": 84,
  "aiInsights": "Detailed Korean explanation",
  "recommendationStrategy": {
    "strategies": [
      {
        "strategyName": "고가치 고객 교차 판매",
        "strategyType": "cross-sell",
        "targetSegment": "고가치 고객 (상위 20%)",
        "expectedCTR": 8.5,
        "expectedCVR": 12.3,
        "expectedAOVIncrease": 15.2
      }
    ],
    "summary": {
      "totalStrategies": 5,
      "avgCTRIncrease": 6.8,
      "avgCVRIncrease": 9.5,
      "expectedRevenueImpact": 8500000
    }
  },
  "recommendations": ["개인화된 이메일 캠페인 시작"]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const prediction = safeParseAIResponse(
  result.choices?.[0]?.message?.content || '',
  { /* 기본값 */ }
);
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'recommendation_strategy',
    timestamp: new Date().toISOString(),
    ...prediction,
  };
}

// Pattern Discovery: 자동 패턴 발견
async function performPatternDiscovery(request: InferenceRequest, apiKey: string) {
  const { data, graph_data, time_series_data, parameters = {} } = request;
  
  // Special handling for business goal analysis
  if (parameters.analysis_type === 'business_goal_analysis') {
    return performBusinessGoalAnalysis(request, apiKey);
  }
  
  const dataSummary = summarizeData(data, graph_data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in data mining and pattern recognition.

Discover meaningful patterns, trends, and structures in the data:

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES PATTERNS:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

${graph_data ? `GRAPH STRUCTURE:
${graph_data.nodes.length} nodes with ${graph_data.edges.length} connections
` : ''}

Return a JSON object:
{
  "patterns": [],
  "segments": [],
  "trends": [],
  "insights": [],
  "summary": {
    "total_patterns_found": 0,
    "most_significant": "",
    "next_steps": []
  }
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const cleanedContent = cleanJsonResponse(result.choices[0].message.content);
  const analysis = JSON.parse(cleanedContent);
  
  return {
    type: 'pattern_discovery',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// Helper functions
function summarizeData(data: any[], graph_data?: any) {
  if (!data || data.length === 0) {
    return { record_count: 0, fields: [] };
  }

  const sample = data.slice(0, 100);
  const fields = Object.keys(sample[0] || {});
  
  const summary: any = {
    record_count: data.length,
    sample_size: sample.length,
    fields: fields.map(field => {
      const values = sample.map(r => r[field]).filter(v => v != null);
      const numeric = values.every(v => typeof v === 'number');
      
      if (numeric) {
        return {
          name: field,
          type: 'numeric',
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      } else {
        const unique = [...new Set(values)];
        return {
          name: field,
          type: 'categorical',
          unique_count: unique.length,
          top_values: unique.slice(0, 5),
        };
      }
    }),
  };

  if (graph_data) {
    summary.graph_info = {
      node_count: graph_data.nodes?.length || 0,
      edge_count: graph_data.edges?.length || 0,
      node_types: [...new Set((graph_data.nodes || []).map((n: any) => n.type))],
      edge_types: [...new Set((graph_data.edges || []).map((e: any) => e.type))],
    };
  }

  return summary;
}

function summarizeTimeSeries(timeSeries: any[]) {
  if (!timeSeries || timeSeries.length === 0) {
    return { length: 0 };
  }

  const values = timeSeries.map((t: any) => t.value).filter((v: any) => typeof v === 'number');
  
  return {
    length: timeSeries.length,
    start: timeSeries[0]?.timestamp,
    end: timeSeries[timeSeries.length - 1]?.timestamp,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
    trend: calculateTrend(values),
  };
}

function calculateTrend(values: number[]) {
  if (values.length < 2) return 'insufficient_data';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (Math.abs(change) < 0.05) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

function detectStatisticalAnomalies(data: any[], parameters: any) {
  if (!data || data.length === 0) return { anomalies: [] };
  
  const anomalies: any[] = [];
  const threshold = parameters.z_score_threshold || 3;
  
  const sample = data[0];
  const numericFields = Object.keys(sample).filter(key => typeof sample[key] === 'number');
  
  for (const field of numericFields) {
    const values = data.map(r => r[field]).filter(v => typeof v === 'number');
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    values.forEach((value, idx) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          field,
          index: idx,
          value,
          z_score: zScore,
          expected_range: [mean - threshold * stdDev, mean + threshold * stdDev],
        });
      }
    });
  }
  
  return { anomalies, method: 'z_score', threshold };
}
