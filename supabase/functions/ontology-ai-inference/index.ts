import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OntologyInferenceRequest {
  inference_type: 'recommendation' | 'anomaly_detection' | 'pattern_analysis';
  store_id: string;
  entity_id?: string;
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

    const body: OntologyInferenceRequest = await req.json();
    console.log('Ontology AI inference request:', body.inference_type, 'for store:', body.store_id);

    // 온톨로지 데이터 로드
    const graphData = await loadOntologyGraph(supabase, body.store_id, user.id);
    
    let result;
    switch (body.inference_type) {
      case 'recommendation':
        result = await performOntologyRecommendation(graphData, body, lovableApiKey, supabase);
        break;
      case 'anomaly_detection':
        result = await performOntologyAnomalyDetection(graphData, body, lovableApiKey);
        break;
      case 'pattern_analysis':
        result = await performPatternAnalysis(graphData, body, lovableApiKey);
        break;
      default:
        throw new Error('Invalid inference type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Ontology AI inference error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// 온톨로지 그래프 데이터 로드
async function loadOntologyGraph(supabase: any, storeId: string, userId: string) {
  // 엔티티 로드
  const { data: entities, error: entitiesError } = await supabase
    .from('graph_entities')
    .select(`
      *,
      entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(*)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId);

  if (entitiesError) throw entitiesError;

  // 관계 로드
  const { data: relations, error: relationsError } = await supabase
    .from('graph_relations')
    .select(`
      *,
      source:graph_entities!graph_relations_source_entity_id_fkey(*),
      target:graph_entities!graph_relations_target_entity_id_fkey(*),
      relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId);

  if (relationsError) throw relationsError;

  return {
    entities: entities || [],
    relations: relations || [],
    stats: {
      totalEntities: entities?.length || 0,
      totalRelations: relations?.length || 0,
      entityTypes: [...new Set(entities?.map((e: any) => e.entity_type?.name) || [])],
      relationTypes: [...new Set(relations?.map((r: any) => r.relation_type?.name) || [])],
    }
  };
}

// 1. 온톨로지 기반 추천 시스템
async function performOntologyRecommendation(
  graphData: any,
  request: OntologyInferenceRequest,
  apiKey: string,
  supabase: any
) {
  const { entity_id, parameters = {} } = request;
  const recommendationType = parameters.recommendation_type || 'product';

  // 특정 엔티티 기반 추천인 경우
  let contextEntity = null;
  if (entity_id) {
    contextEntity = graphData.entities.find((e: any) => e.id === entity_id);
  }

  // 관계 패턴 분석
  const relationPatterns = analyzeRelationPatterns(graphData);
  
  // 협업 필터링 패턴 (구매 관계 기반)
  const purchaseRelations = graphData.relations.filter((r: any) => 
    r.relation_type?.name === 'purchased' || r.relation_type?.name === 'bought'
  );

  const prompt = `You are an expert recommendation system using knowledge graph analysis.

KNOWLEDGE GRAPH STATISTICS:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}
- Relation Types: ${graphData.stats.relationTypes.join(', ')}

${contextEntity ? `CONTEXT ENTITY:
- ID: ${contextEntity.id}
- Label: ${contextEntity.label}
- Type: ${contextEntity.entity_type?.name}
- Properties: ${JSON.stringify(contextEntity.properties, null, 2)}
` : ''}

RELATION PATTERNS:
${JSON.stringify(relationPatterns, null, 2)}

PURCHASE PATTERNS (Sample of 20):
${JSON.stringify(purchaseRelations.slice(0, 20).map((r: any) => ({
  customer: r.source?.label,
  product: r.target?.label,
  properties: r.properties
})), null, 2)}

RECOMMENDATION TYPE: ${recommendationType}

Your task:
1. Analyze the knowledge graph structure and patterns
2. Identify collaborative filtering signals (products bought together)
3. Use graph traversal insights (customers with similar purchase patterns)
4. Consider entity properties (category, price, attributes)
5. Generate top recommendations with confidence scores

Return a JSON object:
{
  "recommendations": [
    {
      "entity_id": "recommended entity id",
      "entity_label": "Product Name or Customer Name",
      "entity_type": "Product|Customer|Category",
      "confidence": 0.92,
      "reasoning": "Why this is recommended (graph-based)",
      "supporting_relations": [
        "relation explanation 1",
        "relation explanation 2"
      ],
      "expected_impact": {
        "conversion_probability": 0.15,
        "estimated_revenue": 45000,
        "cross_sell_potential": "high"
      }
    }
  ],
  "recommendation_strategy": {
    "primary_method": "collaborative_filtering|content_based|hybrid",
    "graph_depth_used": 2,
    "relation_types_analyzed": ["purchased", "located_in"],
    "confidence_threshold": 0.7
  },
  "insights": [
    "Key insight about recommendation patterns",
    "Graph structure observation"
  ]
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
  const analysis = JSON.parse(result.choices[0].message.content);

  // AI 추천을 DB에 저장
  await saveRecommendationsToDatabase(supabase, request.store_id, analysis.recommendations);

  return {
    type: 'ontology_recommendation',
    timestamp: new Date().toISOString(),
    context_entity: contextEntity,
    graph_stats: graphData.stats,
    ...analysis,
  };
}

// 2. 지식 그래프 기반 이상 탐지
async function performOntologyAnomalyDetection(
  graphData: any,
  request: OntologyInferenceRequest,
  apiKey: string
) {
  const { parameters = {} } = request;
  
  // 그래프 구조 이상 탐지
  const structuralAnomalies = detectStructuralAnomalies(graphData);
  
  // 속성 값 이상 탐지
  const valueAnomalies = detectValueAnomalies(graphData);

  const prompt = `You are an expert in graph-based anomaly detection for retail knowledge graphs.

KNOWLEDGE GRAPH OVERVIEW:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}

STRUCTURAL ANOMALIES DETECTED (Statistical):
${JSON.stringify(structuralAnomalies, null, 2)}

VALUE ANOMALIES DETECTED (Statistical):
${JSON.stringify(valueAnomalies, null, 2)}

SAMPLE ENTITIES (20):
${JSON.stringify(graphData.entities.slice(0, 20).map((e: any) => ({
  id: e.id,
  label: e.label,
  type: e.entity_type?.name,
  properties: e.properties
})), null, 2)}

SAMPLE RELATIONS (20):
${JSON.stringify(graphData.relations.slice(0, 20).map((r: any) => ({
  source: r.source?.label,
  target: r.target?.label,
  type: r.relation_type?.name,
  weight: r.weight
})), null, 2)}

Your task:
1. Analyze graph patterns to identify anomalies
2. Detect unusual entity behaviors (isolated nodes, hub nodes)
3. Identify abnormal relation patterns (missing expected relations, unexpected relations)
4. Classify severity and business impact
5. Suggest root causes and remediation

Return a JSON object:
{
  "anomalies": [
    {
      "anomaly_id": "unique_id",
      "type": "structural|behavioral|temporal|value",
      "severity": "critical|high|medium|low",
      "entity_id": "affected entity id",
      "entity_label": "Product A",
      "description": "What is anomalous",
      "normal_pattern": "Expected behavior",
      "observed_pattern": "Actual behavior",
      "possible_causes": [
        "Data quality issue",
        "Business process change"
      ],
      "business_impact": "Potential revenue loss, inventory issue, etc.",
      "recommended_action": "Investigate and fix",
      "confidence": 0.88
    }
  ],
  "anomaly_summary": {
    "total_anomalies": 5,
    "critical_count": 1,
    "high_count": 2,
    "graph_health_score": 0.78,
    "main_concerns": ["Isolated products", "Missing purchase relations"]
  },
  "insights": [
    "Pattern observation",
    "Recommendation for data quality"
  ]
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
  const analysis = JSON.parse(result.choices[0].message.content);

  return {
    type: 'ontology_anomaly_detection',
    timestamp: new Date().toISOString(),
    graph_stats: graphData.stats,
    statistical_baseline: {
      structural: structuralAnomalies,
      value: valueAnomalies,
    },
    ...analysis,
  };
}

// 3. 관계 패턴 분석
async function performPatternAnalysis(
  graphData: any,
  request: OntologyInferenceRequest,
  apiKey: string
) {
  const { parameters = {} } = request;
  const analysisType = parameters.analysis_type || 'all'; // 'all', 'frequency', 'sequential', 'co-occurrence'
  
  // 패턴 추출
  const frequencyPatterns = extractFrequencyPatterns(graphData);
  const coOccurrencePatterns = extractCoOccurrencePatterns(graphData);

  const prompt = `You are an expert in graph pattern mining and retail analytics.

KNOWLEDGE GRAPH OVERVIEW:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}
- Relation Types: ${graphData.stats.relationTypes.join(', ')}

FREQUENCY PATTERNS (Top patterns by occurrence):
${JSON.stringify(frequencyPatterns, null, 2)}

CO-OCCURRENCE PATTERNS (Products/Customers appearing together):
${JSON.stringify(coOccurrencePatterns, null, 2)}

ANALYSIS TYPE: ${analysisType}

Your task:
1. Identify significant patterns in the knowledge graph
2. Detect frequent subgraphs (e.g., Customer -> Purchase -> Product sequences)
3. Find association rules (If X then Y with confidence)
4. Analyze temporal patterns if timestamps available
5. Suggest business opportunities based on patterns

Return a JSON object:
{
  "patterns": [
    {
      "pattern_id": "pattern_1",
      "pattern_type": "frequency|association|sequential|cluster",
      "description": "Pattern description",
      "entities_involved": ["Product A", "Product B", "Customer C"],
      "relation_sequence": ["purchased", "located_in"],
      "support": 0.25,
      "confidence": 0.82,
      "lift": 1.5,
      "business_interpretation": "What this means for business",
      "actionable_insight": "Recommended action"
    }
  ],
  "association_rules": [
    {
      "antecedent": ["Product A"],
      "consequent": ["Product B"],
      "support": 0.15,
      "confidence": 0.75,
      "lift": 2.1,
      "interpretation": "Customers who buy A often buy B"
    }
  ],
  "clusters": [
    {
      "cluster_id": "cluster_1",
      "cluster_type": "Customer segment|Product category",
      "size": 45,
      "characteristics": "Common attributes",
      "representative_entities": ["Entity A", "Entity B"]
    }
  ],
  "insights": [
    "Key pattern finding",
    "Business opportunity"
  ]
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
  const analysis = JSON.parse(result.choices[0].message.content);

  return {
    type: 'pattern_analysis',
    timestamp: new Date().toISOString(),
    analysis_type: analysisType,
    graph_stats: graphData.stats,
    statistical_patterns: {
      frequency: frequencyPatterns,
      coOccurrence: coOccurrencePatterns,
    },
    ...analysis,
  };
}

// === Helper Functions ===

function analyzeRelationPatterns(graphData: any) {
  const relationTypeCounts: Record<string, number> = {};
  const entityPairCounts: Record<string, number> = {};

  graphData.relations.forEach((r: any) => {
    const relType = r.relation_type?.name || 'unknown';
    relationTypeCounts[relType] = (relationTypeCounts[relType] || 0) + 1;

    const sourceType = r.source?.entity_type?.name || 'unknown';
    const targetType = r.target?.entity_type?.name || 'unknown';
    const pairKey = `${sourceType}->${targetType}`;
    entityPairCounts[pairKey] = (entityPairCounts[pairKey] || 0) + 1;
  });

  return {
    relationTypeCounts,
    entityPairCounts,
    mostCommonRelation: Object.entries(relationTypeCounts).sort((a, b) => b[1] - a[1])[0],
  };
}

function detectStructuralAnomalies(graphData: any) {
  const anomalies: any[] = [];
  
  // 고립된 노드 탐지 (연결이 없는 엔티티)
  const connectedEntityIds = new Set();
  graphData.relations.forEach((r: any) => {
    connectedEntityIds.add(r.source_entity_id);
    connectedEntityIds.add(r.target_entity_id);
  });
  
  const isolatedNodes = graphData.entities.filter((e: any) => !connectedEntityIds.has(e.id));
  
  if (isolatedNodes.length > 0) {
    anomalies.push({
      type: 'isolated_nodes',
      count: isolatedNodes.length,
      samples: isolatedNodes.slice(0, 5).map((e: any) => e.label),
    });
  }

  // 허브 노드 탐지 (비정상적으로 많은 연결)
  const nodeDegrees: Record<string, number> = {};
  graphData.relations.forEach((r: any) => {
    nodeDegrees[r.source_entity_id] = (nodeDegrees[r.source_entity_id] || 0) + 1;
    nodeDegrees[r.target_entity_id] = (nodeDegrees[r.target_entity_id] || 0) + 1;
  });

  const degrees = Object.values(nodeDegrees);
  const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
  const stdDev = Math.sqrt(degrees.reduce((a, b) => a + Math.pow(b - avgDegree, 2), 0) / degrees.length);
  
  const hubThreshold = avgDegree + 2 * stdDev;
  const hubNodes = Object.entries(nodeDegrees)
    .filter(([_, degree]) => degree > hubThreshold)
    .map(([entityId, degree]) => {
      const entity = graphData.entities.find((e: any) => e.id === entityId);
      return { entityId, label: entity?.label, degree };
    });

  if (hubNodes.length > 0) {
    anomalies.push({
      type: 'hub_nodes',
      count: hubNodes.length,
      threshold: hubThreshold,
      samples: hubNodes.slice(0, 5),
    });
  }

  return anomalies;
}

function detectValueAnomalies(graphData: any) {
  const anomalies: any[] = [];
  
  // 각 엔티티 타입별로 속성 값 분석
  const entityTypeGroups: Record<string, any[]> = {};
  graphData.entities.forEach((e: any) => {
    const typeName = e.entity_type?.name || 'unknown';
    if (!entityTypeGroups[typeName]) {
      entityTypeGroups[typeName] = [];
    }
    entityTypeGroups[typeName].push(e);
  });

  // 각 그룹의 수치 속성에 대해 이상치 탐지
  Object.entries(entityTypeGroups).forEach(([typeName, entities]) => {
    if (entities.length < 5) return; // 샘플이 너무 적으면 스킵

    // 속성 키 수집
    const propertyKeys = new Set<string>();
    entities.forEach(e => {
      if (e.properties) {
        Object.keys(e.properties).forEach(key => propertyKeys.add(key));
      }
    });

    propertyKeys.forEach(key => {
      const values = entities
        .map(e => e.properties?.[key])
        .filter(v => typeof v === 'number');
      
      if (values.length < 5) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
      
      const outliers = entities.filter(e => {
        const value = e.properties?.[key];
        if (typeof value !== 'number') return false;
        return Math.abs(value - mean) > 2 * stdDev;
      });

      if (outliers.length > 0) {
        anomalies.push({
          type: 'value_outlier',
          entityType: typeName,
          property: key,
          mean,
          stdDev,
          outlierCount: outliers.length,
          samples: outliers.slice(0, 3).map(e => ({
            label: e.label,
            value: e.properties[key],
          })),
        });
      }
    });
  });

  return anomalies;
}

function extractFrequencyPatterns(graphData: any) {
  const patterns: Record<string, number> = {};
  
  // 관계 타입별 빈도
  graphData.relations.forEach((r: any) => {
    const relType = r.relation_type?.name || 'unknown';
    patterns[relType] = (patterns[relType] || 0) + 1;
  });

  // 엔티티 타입별 빈도
  graphData.entities.forEach((e: any) => {
    const entityType = e.entity_type?.name || 'unknown';
    const key = `entity:${entityType}`;
    patterns[key] = (patterns[key] || 0) + 1;
  });

  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));
}

function extractCoOccurrencePatterns(graphData: any) {
  const coOccurrences: Record<string, number> = {};
  
  // 공통 소스를 가진 타겟들 (예: 같은 고객이 구매한 제품들)
  const sourceToTargets: Record<string, Set<string>> = {};
  
  graphData.relations.forEach((r: any) => {
    const sourceId = r.source_entity_id;
    const targetId = r.target_entity_id;
    
    if (!sourceToTargets[sourceId]) {
      sourceToTargets[sourceId] = new Set();
    }
    sourceToTargets[sourceId].add(targetId);
  });

  // 동시 발생 카운트
  Object.values(sourceToTargets).forEach(targetSet => {
    const targets = Array.from(targetSet);
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const entity1 = graphData.entities.find((e: any) => e.id === targets[i]);
        const entity2 = graphData.entities.find((e: any) => e.id === targets[j]);
        
        if (entity1 && entity2) {
          const key = [entity1.label, entity2.label].sort().join(' & ');
          coOccurrences[key] = (coOccurrences[key] || 0) + 1;
        }
      }
    }
  });

  return Object.entries(coOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));
}

async function saveRecommendationsToDatabase(supabase: any, storeId: string, recommendations: any[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const recordsToInsert = recommendations.slice(0, 3).map((rec, index) => ({
    user_id: user.id,
    store_id: storeId,
    recommendation_type: 'insight',
    priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
    title: rec.entity_label || 'AI 추천',
    description: rec.reasoning || '',
    action_category: 'recommendation',
    expected_impact: rec.expected_impact,
    data_source: 'ontology_ai_inference',
    evidence: {
      confidence: rec.confidence,
      supporting_relations: rec.supporting_relations,
      entity_id: rec.entity_id,
      entity_type: rec.entity_type,
    },
    status: 'active',
    is_displayed: true,
    displayed_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('ai_recommendations')
    .insert(recordsToInsert);

  if (error) {
    console.error('Error saving recommendations to database:', error);
  } else {
    console.log(`Saved ${recordsToInsert.length} ontology-based recommendations to database`);
  }
}
