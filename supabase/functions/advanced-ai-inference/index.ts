import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  const analysis = JSON.parse(result.choices[0].message.content);
  
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
  const analysis = JSON.parse(result.choices[0].message.content);
  
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
  const analysis = JSON.parse(result.choices[0].message.content);
  
  return {
    type: 'predictive_modeling',
    timestamp: new Date().toISOString(),
    analysis,
  };
}

// Layout Simulation: 레이아웃 시뮬레이션
async function performLayoutSimulation(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const { changedZones = [], movedFurniture = [], storeContext = {} } = parameters;
  
  const prompt = `You are an expert retail space planner and customer behavior analyst.

LAYOUT CHANGE REQUEST:
Store: ${storeContext.storeName || 'Unknown'}
Goal: ${storeContext.goalText || 'Optimize layout for better performance'}

ZONE CHANGES (${changedZones.length}):
${JSON.stringify(changedZones, null, 2)}

FURNITURE MOVES (${movedFurniture.length}):
${JSON.stringify(movedFurniture, null, 2)}

Your task is to analyze the layout changes and predict:
1. Customer flow patterns after the change
2. Expected impact on KPIs (CVR, dwell time, sales per sqm)
3. Optimal customer paths through the store
4. High-dwell zones and their characteristics
5. Potential bottlenecks or dead zones

Return a comprehensive JSON object:
{
  "predictedKpi": {
    "conversionRate": 0.145,
    "averageTransactionValue": 48500,
    "salesPerSqm": 920000,
    "opex": 12000000,
    "netProfit": 21000000,
    "inventoryTurnover": 4.8,
    "customerSatisfaction": 4.5
  },
  "confidenceScore": 0.85,
  "aiInsights": "Detailed analysis of why these predictions make sense...",
  "flowPrediction": {
    "paths": [
      {
        "points": [
          {"x": 0, "z": 0, "intensity": 1},
          {"x": 2, "z": 1, "intensity": 0.8}
        ],
        "weight": 0.8
      }
    ],
    "heatmap": [
      {"x": 2, "z": 1, "intensity": 0.9}
    ],
    "dwellZones": [
      {"x": 4, "z": 2, "radius": 1.5, "time": 3.2}
    ],
    "kpiChanges": {
      "conversionRate": 2.5,
      "dwellTime": 1.2,
      "flowEfficiency": 85
    }
  },
  "recommendations": [
    "Consider adding signage at zone X",
    "Optimize lighting in high-traffic areas"
  ],
  "warnings": [
    "Potential congestion near entrance",
    "Low visibility for sale zone"
  ]
}

Focus on realistic, actionable insights based on retail psychology and spatial planning principles.`;

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
    console.error('Layout simulation AI error:', error);
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = JSON.parse(result.choices[0].message.content);
  
  console.log('Layout simulation completed:', prediction);
  
  return {
    type: 'layout_simulation',
    timestamp: new Date().toISOString(),
    ...prediction,
    metadata: {
      modelVersion: 'gemini-2.5-pro',
      processingTime: Date.now(),
      flowPrediction: prediction.flowPrediction,
    },
  };
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
  const analysis = JSON.parse(result.choices[0].message.content);
  
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

Your task is to predict future demand and provide actionable insights.

Return a JSON object:
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
  "aiInsights": "Detailed Korean explanation of demand predictions, key drivers, seasonal patterns, and recommended actions for inventory and staffing",
  "demandDrivers": [
    {
      "factor": "Weather conditions",
      "impact": "positive",
      "magnitude": 15,
      "explanation": "Korean explanation"
    }
  ],
  "recommendations": [
    "Increase inventory of high-demand items by 20%",
    "Schedule additional staff during peak hours"
  ]
}

IMPORTANT: confidenceScore should be between 0-100 (percentage).
Provide realistic predictions based on retail analytics best practices.`;

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
  const prediction = JSON.parse(result.choices[0].message.content);
  
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
  
  // 실제 재고 데이터 요약
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
- Average Weekly Demand: ${Math.round(storeContext.inventory.reduce((sum: number, i: any) => sum + i.weeklyDemand, 0) / storeContext.inventory.length)}개
`;
  }
  
  const prompt = `You are an expert in inventory management and supply chain optimization for retail.
${contextSummary}

INVENTORY PARAMETERS:
- Target Service Level: ${parameters.targetServiceLevel || 95}%
- Lead Time: ${parameters.leadTimeDays || 7} days
- Order Frequency: ${parameters.orderFrequencyDays || 14} days
- Safety Stock Multiplier: ${parameters.safetyStockMultiplier || 1.5}
- Order Policy: ${parameters.orderPolicy || 'periodic'}

Your task is to optimize inventory levels and provide actionable recommendations.

Return a JSON object:
{
  "predictedKpi": {
    "inventoryTurnover": 5.2,
    "stockoutRate": 0.02,
    "totalRevenue": 46000000,
    "netProfit": 20500000
  },
  "confidenceScore": 88,
  "aiInsights": "Detailed Korean explanation of inventory optimization strategy, cost-benefit analysis, risk mitigation, and implementation plan",
  "optimizationResults": {
    "optimalOrderQuantity": 450,
    "reorderPoint": 180,
    "safetyStock": 85,
    "expectedStockouts": 3,
    "annualSavings": 3500000
  },
  "recommendations": [
    "Implement automated reorder triggers at 180 units",
    "Review slow-moving items quarterly",
    "Consider vendor-managed inventory for top SKUs"
  ]
}

IMPORTANT: confidenceScore should be between 0-100 (percentage).
Provide realistic optimization based on inventory management best practices.`;

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
  const prediction = JSON.parse(result.choices[0].message.content);
  
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
  
  // 실제 상품 가격 데이터 요약
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
- Price Range: ${Math.round(Math.min(...storeContext.products.map((p: any) => p.sellingPrice))).toLocaleString()}원 ~ ${Math.round(Math.max(...storeContext.products.map((p: any) => p.sellingPrice))).toLocaleString()}원
- Categories: ${[...new Set(storeContext.products.map((p: any) => p.category))].join(', ')}
`;
  }
  
  const prompt = `You are an expert in pricing strategy and revenue optimization for retail.
${contextSummary}

PRICING PARAMETERS:
- Price Change: ${parameters.priceChangePercent || 0}%
- Target Margin: ${parameters.targetMarginPercent || 30}%
- Discount Strategy: ${parameters.discountStrategy || 'none'}
- Duration: ${parameters.durationDays || 30} days
- Inventory Consideration: ${parameters.considerInventory ? 'Yes' : 'No'}

Your task is to optimize pricing strategy and predict revenue impact.

Return a JSON object:
{
  "predictedKpi": {
    "conversionRate": 0.15,
    "averageTransactionValue": 52000,
    "totalRevenue": 52000000,
    "grossMargin": 0.32,
    "netProfit": 22500000
  },
  "confidenceScore": 86,
  "aiInsights": "Detailed Korean explanation of pricing strategy, competitive positioning, demand elasticity, margin impact, and recommended pricing tactics",
  "pricingAnalysis": {
    "optimalPrice": 48500,
    "revenueImpact": 15,
    "volumeImpact": -8,
    "marginImpact": 12,
    "competitivePosition": "premium"
  },
  "recommendations": [
    "Test 10% discount on slow-moving items",
    "Implement dynamic pricing during peak hours",
    "Bundle complementary products at 15% discount"
  ]
}

IMPORTANT: confidenceScore should be between 0-100 (percentage).
Provide realistic pricing optimization based on retail economics and consumer behavior.`;

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
  const prediction = JSON.parse(result.choices[0].message.content);
  
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
  
  // 실제 매장 및 상품 데이터 요약
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
- Product Categories: ${[...new Set(storeContext.products?.map((p: any) => p.category) || [])].join(', ')}
- Ontology Entities: ${storeContext.entities?.length || 0}개 (매장 내 물리적 요소들)
`;
  }
  
  const prompt = `You are an expert in retail marketing, customer analytics, and recommendation systems.
${contextSummary}

RECOMMENDATION PARAMETERS:
- Algorithm: ${parameters.algorithm || 'collaborative'}
- Max Recommendations: ${parameters.maxRecommendations || 10}
- Trend Weight: ${parameters.trendWeight || 0.5}
- Diversity Weight: ${parameters.diversityWeight || 0.3}
- Boost New Products: ${parameters.boostNewProducts ? 'Yes' : 'No'}
- Boost High Margin: ${parameters.boostHighMargin ? 'Yes' : 'No'}

Your task is to design an optimal recommendation strategy and predict its impact.

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
  "aiInsights": "Detailed Korean explanation of recommendation strategy, personalization approach, expected customer behavior changes, revenue opportunities, and implementation roadmap",
  "strategyDetails": {
    "primaryTactic": "collaborative_filtering",
    "targetSegments": ["high-value", "frequent", "new"],
    "channels": ["in-store", "mobile", "email"],
    "expectedUplift": 22,
    "recommendationAccuracy": 0.78
  },
  "recommendations": [
    "Launch personalized email campaigns with product recommendations",
    "Implement in-store digital signage with trending items",
    "Create loyalty program with smart rewards",
    "A/B test recommendation algorithms monthly"
  ]
}

IMPORTANT: confidenceScore should be between 0-100 (percentage).
Provide realistic strategy based on modern retail marketing and data science best practices.`;

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
  const prediction = JSON.parse(result.choices[0].message.content);
  
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

PARAMETERS:
- Pattern types: ${parameters.pattern_types?.join(', ') || 'all'}
- Minimum support: ${parameters.min_support || 0.1}
- Complexity preference: ${parameters.complexity || 'balanced'}

Your task:
1. Discover frequent patterns and associations
2. Identify sequential patterns (if time series)
3. Find clustering and groupings
4. Detect trends and seasonality
5. Uncover hidden relationships
6. Suggest actionable insights

Return a JSON object:
{
  "patterns": [
    {
      "type": "association|sequential|cluster|trend|cycle",
      "name": "pattern name",
      "description": "what this pattern represents",
      "support": 0.45,
      "confidence": 0.82,
      "instances": ["example 1", "example 2"],
      "business_meaning": "what this means in practice"
    }
  ],
  "segments": [
    {
      "segment_name": "group name",
      "size": 150,
      "characteristics": ["characteristic 1", "characteristic 2"],
      "distinguishing_features": ["feature 1", "feature 2"]
    }
  ],
  "trends": [
    {
      "trend_type": "growth|decline|cyclical|stable",
      "variable": "what's trending",
      "strength": 0.75,
      "timeline": "when this trend occurs",
      "drivers": ["driver 1", "driver 2"]
    }
  ],
  "insights": [
    {
      "insight": "key finding",
      "importance": "high|medium|low",
      "evidence": ["supporting fact 1", "supporting fact 2"],
      "recommendation": "what to do with this insight"
    }
  ],
  "summary": {
    "total_patterns_found": 12,
    "most_significant": "pattern name",
    "next_steps": ["action 1", "action 2"]
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
  const analysis = JSON.parse(result.choices[0].message.content);
  
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
  
  // Get numeric fields
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
