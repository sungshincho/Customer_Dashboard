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

// Pattern Discovery: 자동 패턴 발견
async function performPatternDiscovery(request: InferenceRequest, apiKey: string) {
  const { data, graph_data, time_series_data, parameters = {} } = request;
  
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
