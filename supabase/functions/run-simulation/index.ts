import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

/**
 * run-simulation Edge Function
 *
 * AI 시뮬레이션 엔진
 * - 매장 데이터 기반 고객 행동 시뮬레이션
 * - 혼잡도/병목/동선 분석
 * - 진단 이슈 생성
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== 타입 정의 =====
interface SimulationRequest {
  store_id: string;
  options: {
    duration_minutes: number;
    customer_count: number;
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'peak';
    simulation_type: 'realtime' | 'predictive' | 'scenario';
  };
}

interface DiagnosticIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'congestion' | 'flow' | 'conversion' | 'dwell_time' | 'staffing';
  zone_id?: string;
  zone_name?: string;
  title: string;
  description: string;
  current_value: number;
  threshold_value: number;
  impact: string;
  suggested_action: string;
}

interface ZoneAnalysis {
  zone_id: string;
  zone_name: string;
  visitor_count: number;
  avg_dwell_seconds: number;
  congestion_level: number;
  conversion_contribution: number;
  bottleneck_score: number;
}

interface SimulationResult {
  simulation_id: string;
  timestamp: string;
  duration_minutes: number;
  kpis: {
    predicted_visitors: number;
    predicted_conversion_rate: number;
    predicted_revenue: number;
    avg_dwell_time_seconds: number;
    peak_congestion_percent: number;
  };
  zone_analysis: ZoneAnalysis[];
  flow_analysis: {
    primary_paths: {
      from_zone: string;
      to_zone: string;
      traffic_volume: number;
      avg_transition_time: number;
    }[];
    dead_zones: string[];
    congestion_points: string[];
  };
  hourly_analysis: {
    hour: string;
    visitor_count: number;
    congestion_level: number;
    revenue_estimate: number;
  }[];
  diagnostic_issues: DiagnosticIssue[];
  customer_journeys: {
    journey_id: string;
    customer_type: string;
    zones_visited: string[];
    total_time_seconds: number;
    purchased: boolean;
    purchase_amount?: number;
  }[];
  ai_insights: string[];
  confidence_score: number;
}

// ===== 메인 핸들러 =====
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { store_id, options }: SimulationRequest = await req.json();

    console.log(`[Simulation] 시작: store_id=${store_id}, options=`, options);

    // ===== 1. 매장 데이터 로드 =====
    const { data: zones } = await supabaseClient
      .from('zones_dim')
      .select('*')
      .eq('store_id', store_id);

    const { data: furniture } = await supabaseClient
      .from('furniture')
      .select('*')
      .eq('store_id', store_id);

    // 최근 30일 데이터
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: transitions } = await supabaseClient
      .from('zone_transitions')
      .select('*')
      .eq('store_id', store_id)
      .gte('transition_date', dateStr);

    const { data: zoneMetrics } = await supabaseClient
      .from('zone_daily_metrics')
      .select('*')
      .eq('store_id', store_id)
      .gte('metric_date', dateStr);

    const { data: dailyKpis } = await supabaseClient
      .from('daily_kpis_agg')
      .select('*')
      .eq('store_id', store_id)
      .gte('kpi_date', dateStr);

    console.log(`[Simulation] 데이터 로드: zones=${zones?.length || 0}, transitions=${transitions?.length || 0}`);

    // ===== 2. 분석 컨텍스트 구성 =====
    const analysisContext = buildAnalysisContext({
      zones: zones || [],
      furniture: furniture || [],
      transitions: transitions || [],
      zoneMetrics: zoneMetrics || [],
      dailyKpis: dailyKpis || [],
      options,
    });

    // ===== 3. AI 추론 또는 규칙 기반 시뮬레이션 =====
    let simulationResult: SimulationResult;

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (ANTHROPIC_API_KEY) {
      // Claude AI 호출
      const aiResponse = await callClaudeForSimulation(analysisContext, ANTHROPIC_API_KEY);
      simulationResult = parseAndValidateResult(aiResponse, zones || [], options);
    } else {
      // 규칙 기반 시뮬레이션 (API 키 없을 때)
      simulationResult = generateRuleBasedSimulation(analysisContext, zones || [], options);
    }

    // ===== 4. 진단 이슈 보완 =====
    simulationResult.diagnostic_issues = generateDiagnosticIssues(
      simulationResult.zone_analysis,
      simulationResult.flow_analysis,
      simulationResult.kpis
    );

    // ===== 5. 결과 저장 (선택적) =====
    try {
      await supabaseClient
        .from('simulation_history')
        .insert({
          id: simulationResult.simulation_id,
          store_id,
          simulation_type: options.simulation_type,
          input_params: options,
          result_data: simulationResult,
          created_at: new Date().toISOString(),
        });
    } catch (saveError) {
      console.warn('[Simulation] 결과 저장 실패 (테이블 없음?):', saveError);
    }

    console.log(`[Simulation] 완료: ${simulationResult.diagnostic_issues.length}개 이슈 발견`);

    return new Response(JSON.stringify(simulationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Simulation] 오류:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ===== 분석 컨텍스트 구성 =====
function buildAnalysisContext(data: any) {
  const { zones, furniture, transitions, zoneMetrics, dailyKpis, options } = data;

  // 존별 평균 지표 계산
  const zoneStats = zones.map((zone: any) => {
    const metrics = zoneMetrics.filter((m: any) => m.zone_id === zone.id);
    const avgVisitors = metrics.length > 0
      ? metrics.reduce((sum: number, m: any) => sum + (m.total_visitors || 0), 0) / metrics.length
      : Math.floor(Math.random() * 50 + 20); // 데이터 없으면 랜덤
    const avgDwell = metrics.length > 0
      ? metrics.reduce((sum: number, m: any) => sum + (m.avg_dwell_seconds || 0), 0) / metrics.length
      : Math.floor(Math.random() * 60 + 30);

    return {
      zone_id: zone.id,
      zone_name: zone.zone_name || zone.zone_code,
      zone_code: zone.zone_code,
      zone_type: zone.zone_type,
      avg_daily_visitors: Math.round(avgVisitors),
      avg_dwell_seconds: Math.round(avgDwell),
      furniture_count: furniture.filter((f: any) => f.zone_id === zone.id).length,
    };
  });

  // 존 간 이동 확률 계산
  const transitionProbs: any[] = [];
  const transitionMap = new Map<string, any>();

  transitions.forEach((t: any) => {
    const key = `${t.from_zone_id}->${t.to_zone_id}`;
    const existing = transitionMap.get(key) || { count: 0, duration: 0, days: 0 };
    existing.count += t.transition_count || 1;
    existing.duration += (t.avg_duration_seconds || 60) * (t.transition_count || 1);
    existing.days += 1;
    existing.from_zone_id = t.from_zone_id;
    existing.to_zone_id = t.to_zone_id;
    transitionMap.set(key, existing);
  });

  const zoneOutbound = new Map<string, number>();
  transitionMap.forEach((v) => {
    const current = zoneOutbound.get(v.from_zone_id) || 0;
    zoneOutbound.set(v.from_zone_id, current + v.count);
  });

  transitionMap.forEach((v) => {
    const fromZone = zones.find((z: any) => z.id === v.from_zone_id);
    const toZone = zones.find((z: any) => z.id === v.to_zone_id);
    const outbound = zoneOutbound.get(v.from_zone_id) || v.count;

    transitionProbs.push({
      from_zone: fromZone?.zone_name || v.from_zone_id,
      to_zone: toZone?.zone_name || v.to_zone_id,
      probability: Math.round((v.count / outbound) * 100) / 100,
      avg_count_per_day: Math.round(v.count / Math.max(v.days, 1)),
      avg_duration_seconds: Math.round(v.duration / Math.max(v.count, 1)),
    });
  });

  // KPI 평균
  const avgKpis = {
    avg_daily_visitors: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.total_visitors || 0), 0) / dailyKpis.length)
      : options.customer_count || 100,
    avg_conversion_rate: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.conversion_rate || 0), 0) / dailyKpis.length * 100) / 100
      : 0.05,
    avg_daily_revenue: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.total_revenue || 0), 0) / dailyKpis.length)
      : 500000,
  };

  return {
    store_summary: {
      zone_count: zones.length,
      furniture_count: furniture.length,
      data_days: dailyKpis.length || 30,
    },
    zone_stats: zoneStats,
    transition_probabilities: transitionProbs.sort((a: any, b: any) => b.avg_count_per_day - a.avg_count_per_day),
    historical_kpis: avgKpis,
    simulation_options: options,
  };
}

// ===== Claude AI 호출 =====
async function callClaudeForSimulation(context: any, apiKey: string): Promise<string> {
  const prompt = `
당신은 리테일 매장 시뮬레이션 전문가입니다. 주어진 매장 데이터를 분석하여 고객 행동을 시뮬레이션하고 잠재적 문제점을 진단해주세요.

## 매장 데이터

### 존 통계 (최근 30일 평균)
${JSON.stringify(context.zone_stats, null, 2)}

### 존 간 이동 확률
${JSON.stringify(context.transition_probabilities.slice(0, 15), null, 2)}

### 역사적 KPI
${JSON.stringify(context.historical_kpis, null, 2)}

### 시뮬레이션 옵션
- 시뮬레이션 시간: ${context.simulation_options.duration_minutes}분
- 예상 고객 수: ${context.simulation_options.customer_count}명
- 시간대: ${context.simulation_options.time_of_day}

## 분석 요청

1. **KPI 예측**: 주어진 조건에서의 방문자 수, 전환율, 매출, 평균 체류시간, 피크 혼잡도를 예측해주세요.

2. **존별 분석**: 각 존의 예상 방문자 수, 체류시간, 혼잡도, 병목 점수(0-100)를 분석해주세요.

3. **동선 분석**: 주요 이동 경로, 방문이 적은 존(dead zones), 혼잡 지점을 식별해주세요.

4. **AI 인사이트**: 데이터에서 발견한 주요 패턴과 개선 기회를 3-5개 제시해주세요.

## 응답 형식 (JSON만 응답)

\`\`\`json
{
  "kpis": {
    "predicted_visitors": number,
    "predicted_conversion_rate": number (0-1),
    "predicted_revenue": number,
    "avg_dwell_time_seconds": number,
    "peak_congestion_percent": number (0-100)
  },
  "zone_analysis": [
    {
      "zone_id": "존 이름",
      "visitor_count": number,
      "avg_dwell_seconds": number,
      "congestion_level": number (0-100),
      "conversion_contribution": number (0-100),
      "bottleneck_score": number (0-100)
    }
  ],
  "flow_analysis": {
    "primary_paths": [
      { "from_zone": "존1", "to_zone": "존2", "traffic_volume": number, "avg_transition_time": number }
    ],
    "dead_zones": ["존 이름"],
    "congestion_points": ["존 이름"]
  },
  "ai_insights": ["인사이트1", "인사이트2", ...],
  "confidence_score": number (0-100)
}
\`\`\`
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Claude API 오류: ${result.error.message}`);
  }

  return result.content[0].text;
}

// ===== 규칙 기반 시뮬레이션 (API 키 없을 때) =====
function generateRuleBasedSimulation(context: any, zones: any[], options: any): SimulationResult {
  const { zone_stats, historical_kpis, transition_probabilities } = context;

  // 시간대별 트래픽 배율
  const timeMultiplier: Record<string, number> = {
    morning: 0.6,
    afternoon: 1.0,
    evening: 0.8,
    peak: 1.4,
  };
  const multiplier = timeMultiplier[options.time_of_day] || 1.0;

  // KPI 예측
  const predictedVisitors = Math.round(options.customer_count * multiplier);
  const baseConversion = historical_kpis.avg_conversion_rate || 0.05;
  const predictedConversion = baseConversion * (0.9 + Math.random() * 0.2);
  const avgTicket = (historical_kpis.avg_daily_revenue || 500000) / (historical_kpis.avg_daily_visitors || 100);

  // 존별 분석 생성
  const zoneAnalysis: ZoneAnalysis[] = zone_stats.map((zs: any, idx: number) => {
    const visitorRatio = 0.3 + Math.random() * 0.7; // 30-100% 방문
    const visitors = Math.round(predictedVisitors * visitorRatio / zone_stats.length);

    // 혼잡도 계산 (방문자 수 기반)
    let congestion = Math.min(100, visitors * 2);
    if (zs.zone_type === 'entrance') congestion = Math.min(100, congestion * 1.3);
    if (zs.zone_type === 'checkout') congestion = Math.min(100, congestion * 1.5);

    // 병목 점수
    const bottleneck = congestion > 60 ? congestion - 20 + Math.random() * 20 : congestion * 0.5;

    return {
      zone_id: zs.zone_id,
      zone_name: zs.zone_name || `Zone ${idx + 1}`,
      visitor_count: visitors,
      avg_dwell_seconds: zs.avg_dwell_seconds || 60,
      congestion_level: Math.round(congestion),
      conversion_contribution: Math.round(10 + Math.random() * 20),
      bottleneck_score: Math.round(bottleneck),
    };
  });

  // 동선 분석
  const primaryPaths = transition_probabilities.slice(0, 5).map((tp: any) => ({
    from_zone: tp.from_zone,
    to_zone: tp.to_zone,
    traffic_volume: tp.avg_count_per_day * multiplier,
    avg_transition_time: tp.avg_duration_seconds,
  }));

  const deadZones = zoneAnalysis
    .filter((za: ZoneAnalysis) => za.visitor_count < predictedVisitors * 0.1)
    .map((za: ZoneAnalysis) => za.zone_name);

  const congestionPoints = zoneAnalysis
    .filter((za: ZoneAnalysis) => za.congestion_level > 70)
    .map((za: ZoneAnalysis) => za.zone_name);

  return {
    simulation_id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration_minutes: options.duration_minutes,
    kpis: {
      predicted_visitors: predictedVisitors,
      predicted_conversion_rate: Math.round(predictedConversion * 1000) / 1000,
      predicted_revenue: Math.round(predictedVisitors * predictedConversion * avgTicket),
      avg_dwell_time_seconds: Math.round(zone_stats.reduce((s: number, z: any) => s + (z.avg_dwell_seconds || 60), 0) / Math.max(zone_stats.length, 1)),
      peak_congestion_percent: Math.max(...zoneAnalysis.map((za: ZoneAnalysis) => za.congestion_level)),
    },
    zone_analysis: zoneAnalysis,
    flow_analysis: {
      primary_paths: primaryPaths,
      dead_zones: deadZones,
      congestion_points: congestionPoints,
    },
    hourly_analysis: [],
    diagnostic_issues: [],
    customer_journeys: [],
    ai_insights: [
      `${options.time_of_day === 'peak' ? '피크 시간대' : '일반 시간대'} 기준 ${predictedVisitors}명 방문 예상`,
      `예상 전환율 ${(predictedConversion * 100).toFixed(1)}%로 평균 대비 ${predictedConversion > baseConversion ? '높음' : '낮음'}`,
      congestionPoints.length > 0 ? `${congestionPoints.join(', ')} 구역에서 혼잡 예상` : '전반적으로 혼잡도 양호',
      deadZones.length > 0 ? `${deadZones.join(', ')} 구역 방문율 저조 예상` : '모든 구역 방문율 양호',
    ],
    confidence_score: historical_kpis.avg_daily_visitors > 0 ? 75 : 50,
  };
}

// ===== 결과 파싱 및 검증 =====
function parseAndValidateResult(aiResponse: string, zones: any[], options: any): SimulationResult {
  let jsonStr = aiResponse;
  const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr);

  // 존 ID 매핑
  const zoneAnalysis = (parsed.zone_analysis || []).map((za: any) => {
    const zone = zones.find((z: any) => z.zone_name === za.zone_id || z.zone_name === za.zone_name);
    return {
      ...za,
      zone_id: zone?.id || za.zone_id,
      zone_name: zone?.zone_name || za.zone_name || za.zone_id,
    };
  });

  return {
    simulation_id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration_minutes: options.duration_minutes,
    kpis: parsed.kpis || {},
    zone_analysis: zoneAnalysis,
    flow_analysis: parsed.flow_analysis || { primary_paths: [], dead_zones: [], congestion_points: [] },
    hourly_analysis: parsed.hourly_analysis || [],
    diagnostic_issues: [],
    customer_journeys: [],
    ai_insights: parsed.ai_insights || [],
    confidence_score: parsed.confidence_score || 70,
  };
}

// ===== 진단 이슈 생성 =====
function generateDiagnosticIssues(
  zoneAnalysis: ZoneAnalysis[],
  flowAnalysis: any,
  kpis: any
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  let issueId = 0;

  // 존별 혼잡도 체크
  zoneAnalysis.forEach((zone) => {
    if (zone.congestion_level > 80) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'critical',
        category: 'congestion',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 혼잡도 위험`,
        description: `${zone.zone_name}의 혼잡도가 ${zone.congestion_level}%로 임계값(80%)을 초과했습니다.`,
        current_value: zone.congestion_level,
        threshold_value: 80,
        impact: '고객 이탈 증가, 구매 전환율 저하 예상',
        suggested_action: '가구 재배치 또는 동선 분산을 통한 혼잡도 완화',
      });
    } else if (zone.congestion_level > 60) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'congestion',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 혼잡도 주의`,
        description: `${zone.zone_name}의 혼잡도가 ${zone.congestion_level}%로 주의가 필요합니다.`,
        current_value: zone.congestion_level,
        threshold_value: 60,
        impact: '피크 시간대 고객 불편 예상',
        suggested_action: '피크 시간대 직원 배치 강화 또는 동선 유도',
      });
    }

    // 병목 점수 체크
    if (zone.bottleneck_score > 70) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: zone.bottleneck_score > 85 ? 'critical' : 'warning',
        category: 'flow',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 병목 구간`,
        description: `${zone.zone_name}이 병목 구간으로 식별되었습니다. 높은 트래픽 대비 낮은 전환율을 보입니다.`,
        current_value: zone.bottleneck_score,
        threshold_value: 70,
        impact: '동선 효율성 저하, 전체 전환율에 부정적 영향',
        suggested_action: '레이아웃 재구성 또는 핵심 제품 재배치',
      });
    }

    // 체류시간 체크
    if (zone.avg_dwell_seconds < 30 && zone.visitor_count > 30) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'dwell_time',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 체류시간 부족`,
        description: `${zone.zone_name}의 평균 체류시간이 ${zone.avg_dwell_seconds}초로 짧습니다.`,
        current_value: zone.avg_dwell_seconds,
        threshold_value: 60,
        impact: '제품 노출 효과 저하, 충동 구매 기회 손실',
        suggested_action: '시선을 끄는 디스플레이 배치 또는 체험 요소 추가',
      });
    }
  });

  // Dead zones 체크
  if (flowAnalysis.dead_zones && flowAnalysis.dead_zones.length > 0) {
    flowAnalysis.dead_zones.forEach((zoneName: string) => {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'flow',
        zone_name: zoneName,
        title: `${zoneName} 방문율 저조`,
        description: `${zoneName}의 방문율이 저조합니다. 동선에서 소외되어 있을 수 있습니다.`,
        current_value: 0,
        threshold_value: 30,
        impact: '해당 존 제품 매출 기회 손실',
        suggested_action: '동선 유도 사이니지 설치 또는 인기 제품 배치',
      });
    });
  }

  // 전환율 체크
  if (kpis.predicted_conversion_rate && kpis.predicted_conversion_rate < 0.03) {
    issues.push({
      id: `issue-${++issueId}`,
      severity: 'critical',
      category: 'conversion',
      title: '전환율 심각 저하',
      description: `예상 전환율이 ${(kpis.predicted_conversion_rate * 100).toFixed(1)}%로 매우 낮습니다.`,
      current_value: kpis.predicted_conversion_rate * 100,
      threshold_value: 5,
      impact: '매출 목표 달성 어려움',
      suggested_action: '전체적인 레이아웃 및 제품 배치 최적화 필요',
    });
  }

  // severity 순으로 정렬
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}
