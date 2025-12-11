import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

// Continuous Learning 모듈 import
import {
  calculatePastPerformance,
  buildLearningContext,
  validateROIPrediction,
  saveFeedbackRecord,
  type LearningContext,
  type PastPerformanceResult,
} from './learning.ts';

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


// ============================================================================
// 🆕 Phase 1: Enhanced AI Inference - 데이터 기반 추론 강화
// ============================================================================

interface EnhancedSalesData {
  last30Days: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
    avgTransactionValue: number;
    visitorCount?: number;
    conversionRate?: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendPercentage: number;
  avgDailyRevenue: number;
  totalRevenue: number;
  peakDays: string[];
  peakHours: number[];
  bestDay: { date: string; revenue: number } | null;
  worstDay: { date: string; revenue: number } | null;
  weekdayAvg: number;
  weekendAvg: number;
  growthRate: number;
}

interface EnhancedVisitorData {
  last30Days: Array<{
    date: string;
    visitorCount: number;
    avgDwellTime: number;
  }>;
  avgDaily: number;
  totalVisitors: number;
  hourlyPattern: Record<number, number>;
  dayOfWeekPattern: Record<string, number>;
  zoneHeatmap: Record<string, {
    visitCount: number;
    visitRate: number;
    avgDwellTime: number;
    conversionRate: number;
    revenueContribution: number;
  }>;
  avgDwellTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  customerFlows: Array<{
    path: string[];
    count: number;
    percentage: number;
    avgDwellTime: number;
    conversionRate: number;
  }>;
}

interface EnhancedConversionData {
  overall: number;
  byZone: Record<string, number>;
  byProductCategory: Record<string, number>;
  byTimeOfDay: Record<string, number>;
  byDayOfWeek: Record<string, number>;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

interface RecommendationPerformance {
  totalApplied: number;
  successCount: number;
  failCount: number;
  successRate: number;
  avgRevenueChange: number;
  avgTrafficChange: number;
  avgConversionChange: number;
  byType: Record<string, {
    count: number;
    successRate: number;
    avgImpact: number;
  }>;
}

interface EnhancedStoreContext {
  storeInfo?: {
    id: string;
    name: string;
    width: number;
    depth: number;
    businessType?: string;
  };
  entities: any[];
  relations: any[];
  visits?: any[];
  transactions?: any[];
  dailySales?: any[];
  salesData?: EnhancedSalesData;
  visitorData?: EnhancedVisitorData;
  conversionData?: EnhancedConversionData;
  recommendationPerformance?: RecommendationPerformance;
  dataQuality?: {
    salesDataDays: number;
    visitorDataDays: number;
    hasZoneData: boolean;
    hasFlowData: boolean;
    hasPastRecommendations: boolean;
    overallScore: number;
  };
}

interface ConfidenceFactors {
  dataAvailability: number;      // 0-25
  dataRecency: number;           // 0-15
  dataCoverage: number;          // 0-15
  pastPerformance: number;       // 0-20
  patternConsistency: number;    // 0-15
  ontologyDepth: number;         // 0-10
}

// --- 트렌드 라벨 헬퍼 ---
function getTrendLabel(trend: string): string {
  const labels: Record<string, string> = {
    'increasing': '상승',
    'decreasing': '하락',
    'stable': '안정',
    'volatile': '변동성 높음',
  };
  return labels[trend] || trend;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'layout': '레이아웃',
    'pricing': '가격',
    'inventory': '재고',
    'marketing': '마케팅',
  };
  return labels[type] || type;
}

// --- 인사이트 분석 헬퍼 함수들 ---
function analyzeFlowInsights(visitors: EnhancedVisitorData): string {
  const insights: string[] = [];

  const zoneEntries = Object.entries(visitors.zoneHeatmap || {});
  const lowConversionZones = zoneEntries
    .filter(([_, data]) => data.visitRate > 30 && data.conversionRate < 0.1)
    .map(([zone]) => zone);
  
  if (lowConversionZones.length > 0) {
    insights.push(`- ⚠️ ${lowConversionZones.join(', ')} 구역: 방문율 높지만 전환율 낮음 → 상품 배치/진열 개선 필요`);
  }

  const shortDwellZones = zoneEntries
    .filter(([_, data]) => data.visitRate > 20 && data.avgDwellTime < 3)
    .map(([zone]) => zone);
  
  if (shortDwellZones.length > 0) {
    insights.push(`- ⚠️ ${shortDwellZones.join(', ')} 구역: 체류시간 짧음 → 고객 관심 유도 요소 추가 필요`);
  }

  const mainFlow = visitors.customerFlows?.[0];
  if (mainFlow && mainFlow.conversionRate < 0.15) {
    insights.push(`- 주요 동선(${mainFlow.path.join('→')})의 전환율이 ${(mainFlow.conversionRate * 100).toFixed(0)}%로 낮음 → 동선 중간에 프로모션 배치 권장`);
  }

  const lowVisitZones = zoneEntries
    .filter(([_, data]) => data.visitRate < 10)
    .map(([zone]) => zone);
  
  if (lowVisitZones.length > 0) {
    insights.push(`- 🔴 방문 사각지대: ${lowVisitZones.join(', ')} → 안내 표지판 또는 주력 상품 배치로 유도 필요`);
  }

  return insights.length > 0 ? insights.join('\n') : '- 현재 동선 패턴은 양호합니다.';
}

function analyzeConversionInsights(conv: EnhancedConversionData): string {
  const insights: string[] = [];

  if (conv.overall < 0.1) {
    insights.push('- ⚠️ 전체 전환율이 10% 미만으로 낮음 → 구매 유도 전략 강화 필요');
  } else if (conv.overall > 0.2) {
    insights.push('- ✅ 전체 전환율이 20% 이상으로 우수함');
  }

  const convRates = Object.values(conv.byZone || {});
  if (convRates.length > 1) {
    const maxConv = Math.max(...convRates);
    const minConv = Math.min(...convRates);
    if (maxConv / minConv > 2) {
      insights.push('- 구역별 전환율 편차가 큼 → 저전환 구역 레이아웃 개선 우선');
    }
  }

  const timeEntries = Object.entries(conv.byTimeOfDay || {});
  if (timeEntries.length > 0) {
    const peakTimeConv = timeEntries.sort((a, b) => b[1] - a[1])[0];
    const lowTimeConv = timeEntries.sort((a, b) => a[1] - b[1])[0];
    
    if (peakTimeConv && lowTimeConv && peakTimeConv[1] / lowTimeConv[1] > 1.5) {
      insights.push(`- ${peakTimeConv[0]}의 전환율이 가장 높음 → 이 시간대 프로모션 집중 권장`);
    }
  }

  if (conv.trend === 'declining') {
    insights.push('- ⚠️ 전환율이 하락 추세 → 긴급한 개선 조치 필요');
  }

  return insights.length > 0 ? insights.join('\n') : '- 전환율 패턴이 정상 범위입니다.';
}

function analyzePerformanceInsights(perf: RecommendationPerformance): string {
  const insights: string[] = [];

  if (perf.successRate >= 0.7) {
    insights.push('- ✅ 과거 추천의 70% 이상이 성공적 → AI 추천 신뢰도 높음');
  } else if (perf.successRate < 0.5) {
    insights.push('- ⚠️ 과거 추천 성공률이 50% 미만 → 보수적인 변경 권장');
  }

  const typeEntries = Object.entries(perf.byType || {});
  if (typeEntries.length > 0) {
    const bestType = typeEntries.sort((a, b) => b[1].successRate - a[1].successRate)[0];
    if (bestType[1].successRate > 0.7) {
      insights.push(`- ${getTypeLabel(bestType[0])} 추천이 가장 효과적 (성공률 ${(bestType[1].successRate * 100).toFixed(0)}%)`);
    }
  }

  if (perf.avgRevenueChange > 10) {
    insights.push(`- 과거 추천 적용 시 평균 ${perf.avgRevenueChange.toFixed(0)}% 매출 증가 → 적극적 추천 적용 권장`);
  }

  return insights.length > 0 ? insights.join('\n') : '- 과거 성과 데이터를 기반으로 신중하게 추천합니다.';
}

// --- 강화된 데이터 기반 프롬프트 빌더 ---
function buildEnhancedDataPrompt(context: EnhancedStoreContext): string {
  const sections: string[] = [];

  // === 매출 데이터 섹션 ===
  if (context.salesData) {
    const sales = context.salesData;
    const trendEmoji = sales.trend === 'increasing' ? '📈' : 
                       sales.trend === 'decreasing' ? '📉' : 
                       sales.trend === 'volatile' ? '⚡' : '➡️';
    
    sections.push(`
=== 📊 실제 매출 데이터 (최근 ${sales.last30Days?.length || 0}일) ===
- 일평균 매출: ${sales.avgDailyRevenue?.toLocaleString() || 0}원
- 총 매출: ${sales.totalRevenue?.toLocaleString() || 0}원
- 매출 트렌드: ${trendEmoji} ${getTrendLabel(sales.trend)} (${sales.trendPercentage > 0 ? '+' : ''}${sales.trendPercentage?.toFixed(1) || 0}%)
- 주중 평균: ${sales.weekdayAvg?.toLocaleString() || 0}원 / 주말 평균: ${sales.weekendAvg?.toLocaleString() || 0}원
- 피크 요일: ${sales.peakDays?.join(', ') || 'N/A'}
${sales.bestDay ? `- 최고 매출일: ${sales.bestDay.date} (${sales.bestDay.revenue?.toLocaleString()}원)` : ''}
${sales.worstDay ? `- 최저 매출일: ${sales.worstDay.date} (${sales.worstDay.revenue?.toLocaleString()}원)` : ''}

📌 인사이트:
${sales.trend === 'increasing' ? '- 매출이 상승 추세입니다. 현재 전략을 유지/강화하세요.' : ''}
${sales.trend === 'decreasing' ? '- 매출이 하락 추세입니다. 레이아웃/상품 배치 개선이 필요합니다.' : ''}
${sales.weekendAvg > sales.weekdayAvg * 1.2 ? '- 주말 매출이 주중보다 20% 이상 높습니다.' : ''}
${sales.trend === 'volatile' ? '- 매출 변동성이 큽니다. 안정적인 고객 유입 전략이 필요합니다.' : ''}
`);
  }

  // === 방문자 데이터 섹션 ===
  if (context.visitorData) {
    const visitors = context.visitorData;
    
    const zoneHeatmapText = Object.entries(visitors.zoneHeatmap || {})
      .sort((a, b) => b[1].visitRate - a[1].visitRate)
      .slice(0, 6)
      .map(([zone, data]) => 
        `  - ${zone}: 방문율 ${data.visitRate?.toFixed(0) || 0}%, 체류 ${data.avgDwellTime?.toFixed(1) || 0}분, 전환율 ${((data.conversionRate || 0) * 100).toFixed(1)}%`
      ).join('\n');

    const flowsText = (visitors.customerFlows || [])
      .slice(0, 3)
      .map((flow, i) => 
        `  ${i + 1}. ${flow.path?.join(' → ') || 'N/A'} (${flow.percentage?.toFixed(0) || 0}%, 전환율 ${((flow.conversionRate || 0) * 100).toFixed(1)}%)`
      ).join('\n');

    sections.push(`
=== 👥 고객 방문 패턴 (최근 ${visitors.last30Days?.length || 0}일) ===
- 일평균 방문자: ${visitors.avgDaily || 0}명
- 총 방문자: ${visitors.totalVisitors?.toLocaleString() || 0}명
- 평균 체류시간: ${visitors.avgDwellTime?.toFixed(1) || 0}분
- 피크 시간대: ${(visitors.peakHours || []).map(p => `${p.hour}시(${p.count}명)`).join(', ') || 'N/A'}

📍 구역별 성과:
${zoneHeatmapText || '구역 데이터 없음'}

🚶 주요 고객 동선:
${flowsText || '동선 데이터 없음'}

📌 동선 인사이트:
${analyzeFlowInsights(visitors)}
`);
  }

  // === 전환율 데이터 섹션 ===
  if (context.conversionData) {
    const conv = context.conversionData;
    const convTrendEmoji = conv.trend === 'improving' ? '📈' : 
                          conv.trend === 'declining' ? '📉' : '➡️';

    sections.push(`
=== 🛒 전환율 분석 ===
- 전체 전환율: ${((conv.overall || 0) * 100).toFixed(1)}%
- 전환율 트렌드: ${convTrendEmoji} ${conv.trend === 'improving' ? '개선 중' : conv.trend === 'declining' ? '하락 중' : '안정'}

📌 전환율 인사이트:
${analyzeConversionInsights(conv)}
`);
  }

  // === 과거 추천 성과 섹션 ===
  if (context.recommendationPerformance && context.recommendationPerformance.totalApplied > 0) {
    const perf = context.recommendationPerformance;
    
    sections.push(`
=== 🔄 과거 추천 적용 성과 (${perf.totalApplied}건) ===
- 성공률: ${((perf.successRate || 0) * 100).toFixed(0)}%
- 평균 매출 변화: ${(perf.avgRevenueChange || 0) > 0 ? '+' : ''}${(perf.avgRevenueChange || 0).toFixed(1)}%

📌 성과 기반 조언:
${analyzePerformanceInsights(perf)}
`);
  }

  return sections.join('\n');
}

// --- 통계 기반 신뢰도 계산 시스템 ---
// pastPerformanceData: learning.ts에서 가져온 과거 성과 데이터 (선택적)
function calculateStatisticalConfidence(
  context: EnhancedStoreContext,
  pastPerformanceData?: PastPerformanceResult
): {
  score: number;
  factors: ConfidenceFactors;
  explanation: string;
} {
  const factors: ConfidenceFactors = {
    dataAvailability: 0,
    dataRecency: 0,
    dataCoverage: 0,
    pastPerformance: 0,
    patternConsistency: 0,
    ontologyDepth: 0,
  };

  const explanations: string[] = [];

  // 1. 데이터 충분성 (최대 25점)
  const salesDays = context.salesData?.last30Days?.length || context.dailySales?.length || 0;
  const visitorDays = context.visitorData?.last30Days?.length || context.visits?.length || 0;

  if (salesDays >= 30 && visitorDays >= 30) {
    factors.dataAvailability = 25;
    explanations.push('30일 이상의 충분한 매출/방문 데이터');
  } else if (salesDays >= 14 && visitorDays >= 14) {
    factors.dataAvailability = 18;
    explanations.push('2주 이상의 데이터');
  } else if (salesDays >= 7 || visitorDays >= 7) {
    factors.dataAvailability = 12;
  } else if (salesDays > 0 || visitorDays > 0) {
    factors.dataAvailability = 6;
  }

  // 2. 데이터 최신성 (최대 15점)
  const latestDate = context.salesData?.last30Days?.[context.salesData.last30Days.length - 1]?.date ||
                     context.dailySales?.[context.dailySales.length - 1]?.date;
  if (latestDate) {
    const daysSince = Math.floor((Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 1) factors.dataRecency = 15;
    else if (daysSince <= 3) factors.dataRecency = 12;
    else if (daysSince <= 7) factors.dataRecency = 8;
    else factors.dataRecency = 4;
  }

  // 3. 데이터 커버리지 (최대 15점)
  if (context.visitorData && Object.keys(context.visitorData.zoneHeatmap || {}).length > 0) factors.dataCoverage += 5;
  if (context.visitorData && (context.visitorData.customerFlows || []).length > 0) factors.dataCoverage += 5;
  if (context.conversionData && context.conversionData.overall > 0) factors.dataCoverage += 5;

  // 4. 과거 추천 성과 (최대 20점) - Continuous Learning 데이터 활용
  if (pastPerformanceData && pastPerformanceData.sampleSize > 0) {
    // learning.ts에서 계산된 점수 사용
    factors.pastPerformance = pastPerformanceData.score;
    if (pastPerformanceData.sampleSize >= 5) {
      explanations.push(pastPerformanceData.explanation);
    }
  } else {
    // 폴백: 기존 recommendationPerformance 사용
    const perf = context.recommendationPerformance;
    if (perf && perf.totalApplied > 0) {
      if (perf.successRate >= 0.7 && perf.totalApplied >= 5) {
        factors.pastPerformance = 20;
        explanations.push(`과거 ${perf.totalApplied}건 중 ${(perf.successRate * 100).toFixed(0)}% 성공`);
      } else if (perf.successRate >= 0.5) {
        factors.pastPerformance = 15;
      } else {
        factors.pastPerformance = 10;
      }
    } else {
      // 데이터 없음: 기본값 5점
      factors.pastPerformance = 5;
    }
  }

  // 5. 패턴 일관성 (최대 15점)
  const salesTrend = context.salesData?.trend;
  if (salesTrend && salesTrend !== 'volatile') {
    factors.patternConsistency = 15;
  } else if (salesTrend === 'volatile') {
    factors.patternConsistency = 5;
    explanations.push('변동성 높음');
  }

  // 6. 온톨로지 깊이 (최대 10점)
  const entityCount = context.entities?.length || 0;
  const relationCount = context.relations?.length || 0;
  if (entityCount > 20 && relationCount > 30) factors.ontologyDepth = 10;
  else if (entityCount > 10 && relationCount > 15) factors.ontologyDepth = 7;
  else if (entityCount > 0) factors.ontologyDepth = 4;

  // 최종 점수 계산 (신뢰도 조정값 반영)
  const totalScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const confidenceAdjustment = pastPerformanceData?.confidenceAdjustment || 0;
  const normalizedScore = 60 + (totalScore / 100) * 35 + confidenceAdjustment;
  const finalScore = Math.min(Math.max(normalizedScore, 60), 95);

  return {
    score: Math.round(finalScore),
    factors,
    explanation: explanations.join(' | ') || '기본 추정 기반',
  };
}

// --- 강화된 레이아웃 프롬프트 빌더 ---
function buildEnhancedLayoutPrompt(
  context: EnhancedStoreContext,
  furnitureList: string,
  ontologyAnalysis: any,
  comprehensiveAnalysis: any,
  storeWidth: number,
  storeDepth: number,
  outOfBoundsWarning: string
): string {
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  const enhancedDataSection = buildEnhancedDataPrompt(context);
  const confidenceResult = calculateStatisticalConfidence(context);

  return `You are a retail store layout optimization expert with access to REAL business data.

${enhancedDataSection}

=== 🔬 온톨로지 그래프 분석 ===
${ontologyAnalysis?.summaryForAI || '온톨로지 분석 없음'}

${comprehensiveAnalysis?.comprehensiveSummary || ''}
${outOfBoundsWarning}

=== 📐 매장 경계 (중심 기준 좌표계) ===
- 매장 크기: ${storeWidth}m x ${storeDepth}m
- X축 범위: -${halfWidth.toFixed(1)} ~ +${halfWidth.toFixed(1)}
- Z축 범위: -${halfDepth.toFixed(1)} ~ +${halfDepth.toFixed(1)}
- 안전 영역: X ±${(halfWidth - 1).toFixed(1)}, Z ±${(halfDepth - 1).toFixed(1)}

=== 🪑 현재 가구 배치 ===
${furnitureList}

=== 📊 분석 신뢰도: ${confidenceResult.score}% ===
신뢰도 근거: ${confidenceResult.explanation}

=== 💡 최적화 목표 ===
위의 실제 데이터를 기반으로 3-5개의 구체적인 가구 이동을 제안하세요.

CRITICAL RULES:
1. 모든 위치는 반드시 안전 영역 내여야 함
2. 실제 데이터가 지적하는 문제점을 우선 해결
3. 과거 성공 사례와 유사한 방향으로 추천

Return ONLY valid JSON (no markdown):
{
  "layoutChanges": [
    {
      "entityId": "exact-uuid",
      "entityLabel": "가구 이름",
      "entityType": "Shelf",
      "currentPosition": {"x": 0, "y": 0, "z": 0},
      "suggestedPosition": {"x": 0, "y": 0, "z": 0},
      "reason": "📊 [데이터 근거] 구체적인 이유",
      "dataEvidence": "근거 데이터",
      "impact": "high|medium|low"
    }
  ],
  "optimizationSummary": {
    "expectedTrafficIncrease": 15,
    "expectedRevenueIncrease": 8,
    "expectedConversionIncrease": 3,
    "confidence": ${confidenceResult.score}
  },
  "dataBasedInsights": ["인사이트1", "인사이트2"],
  "aiInsights": ["종합 인사이트"],
  "recommendations": ["추천"]
}`;
}


// ============================================================================
// 🆕 방문/거래/매출 데이터 분석 함수들 (NEW)
// ============================================================================

interface VisitData {
  id: string;
  customer_id?: string;
  visit_date: string;
  duration_minutes?: number;
  zones_visited?: string[];
}

interface TransactionData {
  id: string;
  customer_id?: string;
  total_amount: number;
  items?: any[];
  transaction_date: string;
}

interface DailySalesData {
  id: string;
  date: string;
  total_revenue: number;
  transaction_count?: number;
  avg_transaction_value?: number;
}

// 방문 패턴 분석
function analyzeVisitPatterns(visits: VisitData[]) {
  if (!visits || visits.length === 0) {
    return {
      totalVisits: 0,
      avgDuration: 0,
      zonePopularity: {},
      customerFlows: [],
      peakHours: [],
      unvisitedZones: [],
      summaryText: '방문 데이터 없음'
    };
  }

  // 평균 체류 시간
  const durations = visits.filter(v => v.duration_minutes).map(v => v.duration_minutes!);
  const avgDuration = durations.length > 0 
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // 구역별 인기도
  const zoneCounts: Record<string, number> = {};
  const flowPatterns: Record<string, number> = {};
  
  visits.forEach(visit => {
    if (visit.zones_visited && Array.isArray(visit.zones_visited)) {
      visit.zones_visited.forEach(zone => {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      });
      
      // 동선 패턴 (순서대로 연결)
      const flowKey = visit.zones_visited.join(' → ');
      flowPatterns[flowKey] = (flowPatterns[flowKey] || 0) + 1;
    }
  });

  // 구역별 방문율 계산
  const zonePopularity: Record<string, number> = {};
  Object.entries(zoneCounts).forEach(([zone, count]) => {
    zonePopularity[zone] = Math.round((count / visits.length) * 100);
  });

  // 주요 동선 패턴 (상위 5개)
  const customerFlows = Object.entries(flowPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flow, count]) => ({
      flow,
      count,
      percentage: Math.round((count / visits.length) * 100)
    }));

  // 방문 시간대 분석
  const hourCounts: Record<number, number> = {};
  visits.forEach(visit => {
    const hour = new Date(visit.visit_date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));

  // 방문 없는 구역 감지 (일반적인 매장 구역과 비교)
  const commonZones = ['입구', '의류 섹션', '액세서리 섹션', '화장품 섹션', '신발 섹션', '계산대'];
  const visitedZones = Object.keys(zoneCounts);
  const unvisitedZones = commonZones.filter(z => !visitedZones.some(vz => vz.includes(z) || z.includes(vz)));

  // 요약 텍스트 생성
  const summaryText = `### 고객 방문 분석 (${visits.length}회)
- 평균 체류: ${avgDuration}분
- 구역별 인기도: ${Object.entries(zonePopularity).map(([z, p]) => `${z}(${p}%)`).join(', ')}
- 주요 동선: ${customerFlows[0]?.flow || '데이터 없음'} (${customerFlows[0]?.percentage || 0}%)
${unvisitedZones.length > 0 ? `- ⚠️ 방문 없는 구역: ${unvisitedZones.join(', ')} → 레이아웃 개선 필요` : ''}`;

  return {
    totalVisits: visits.length,
    avgDuration,
    zonePopularity,
    customerFlows,
    peakHours,
    unvisitedZones,
    summaryText
  };
}

// 거래 패턴 분석
function analyzeTransactionPatterns(transactions: TransactionData[]) {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      avgTransactionValue: 0,
      repeatCustomerRate: 0,
      topSellingProducts: [],
      summaryText: '거래 데이터 없음'
    };
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const avgTransactionValue = Math.round(totalRevenue / transactions.length);

  // 반복 고객 비율
  const customerIds = transactions.filter(t => t.customer_id).map(t => t.customer_id!);
  const uniqueCustomers = new Set(customerIds).size;
  const repeatCustomerRate = customerIds.length > 0 
    ? Math.round(((customerIds.length - uniqueCustomers) / customerIds.length) * 100)
    : 0;

  // 베스트셀러 상품
  const productCounts: Record<string, { count: number; revenue: number }> = {};
  transactions.forEach(t => {
    if (t.items && Array.isArray(t.items)) {
      t.items.forEach((item: any) => {
        const name = item.name || item.product_name || 'Unknown';
        if (!productCounts[name]) {
          productCounts[name] = { count: 0, revenue: 0 };
        }
        productCounts[name].count += item.quantity || 1;
        productCounts[name].revenue += item.price || 0;
      });
    }
  });

  const topSellingProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const summaryText = `### 거래 분석 (${transactions.length}건)
- 총 매출: ${totalRevenue.toLocaleString()}원
- 평균 거래액: ${avgTransactionValue.toLocaleString()}원
- 반복 고객율: ${repeatCustomerRate}%
${topSellingProducts.length > 0 ? `- 베스트셀러: ${topSellingProducts.slice(0, 3).map(p => p.name).join(', ')}` : ''}`;

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    avgTransactionValue,
    repeatCustomerRate,
    topSellingProducts,
    summaryText
  };
}

// 일별 매출 트렌드 분석
function analyzeDailySalesTrends(dailySales: DailySalesData[]) {
  if (!dailySales || dailySales.length === 0) {
    return {
      avgDailyRevenue: 0,
      trend: 'unknown',
      trendPercentage: 0,
      bestDay: null,
      worstDay: null,
      summaryText: '매출 트렌드 데이터 없음'
    };
  }

  // 날짜순 정렬
  const sorted = [...dailySales].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const revenues = sorted.map(d => d.total_revenue || 0);
  const avgDailyRevenue = Math.round(revenues.reduce((a, b) => a + b, 0) / revenues.length);

  // 트렌드 계산 (전반부 vs 후반부)
  const mid = Math.floor(revenues.length / 2);
  const firstHalf = revenues.slice(0, mid);
  const secondHalf = revenues.slice(mid);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trendPercentage = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;
  const trend = trendPercentage > 5 ? 'increasing' : trendPercentage < -5 ? 'decreasing' : 'stable';

  // 최고/최저 매출일
  const bestDay = sorted.reduce((best, curr) => 
    (curr.total_revenue || 0) > (best.total_revenue || 0) ? curr : best
  );
  const worstDay = sorted.reduce((worst, curr) => 
    (curr.total_revenue || 0) < (worst.total_revenue || 0) ? curr : worst
  );

  const trendEmoji = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
  const summaryText = `### 매출 트렌드 (${dailySales.length}일)
- 일평균 매출: ${avgDailyRevenue.toLocaleString()}원
- 트렌드: ${trendEmoji} ${trend === 'increasing' ? '상승' : trend === 'decreasing' ? '하락' : '유지'} (${trendPercentage > 0 ? '+' : ''}${trendPercentage}%)
- 최고 매출일: ${bestDay.date} (${bestDay.total_revenue?.toLocaleString()}원)
- 최저 매출일: ${worstDay.date} (${worstDay.total_revenue?.toLocaleString()}원)`;

  return {
    avgDailyRevenue,
    trend,
    trendPercentage,
    bestDay,
    worstDay,
    summaryText
  };
}

// 근접성 관계 분석 (NEAR_TO)
function analyzeProximityRelations(relations: any[], entities: any[]) {
  const nearToRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('near') || typeName === 'NEAR_TO';
  });

  if (nearToRelations.length === 0) {
    return {
      totalProximityRelations: 0,
      closeProximityPairs: [],
      farProximityPairs: [],
      isolatedFurniture: [],
      summaryText: '근접성 관계 데이터 없음'
    };
  }

  const entityMap = new Map(entities.map(e => [e.id, e.label || e.id]));
  
  // 거리 정보 추출
  const proximityPairs = nearToRelations.map(r => ({
    source: entityMap.get(r.source_entity_id) || r.source_entity_id,
    target: entityMap.get(r.target_entity_id) || r.target_entity_id,
    distance: r.properties?.distance || 0
  })).filter(p => p.distance > 0);

  // 가까운 쌍 (<4m)
  const closeProximityPairs = proximityPairs
    .filter(p => p.distance < 4)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  // 멀리 떨어진 쌍 (>10m)
  const farProximityPairs = proximityPairs
    .filter(p => p.distance > 10)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3);

  // 고립된 가구 찾기 (관계가 적은 가구)
  const relationCounts: Record<string, number> = {};
  nearToRelations.forEach(r => {
    const source = entityMap.get(r.source_entity_id) || r.source_entity_id;
    const target = entityMap.get(r.target_entity_id) || r.target_entity_id;
    relationCounts[source] = (relationCounts[source] || 0) + 1;
    relationCounts[target] = (relationCounts[target] || 0) + 1;
  });

  const avgRelations = Object.values(relationCounts).reduce((a, b) => a + b, 0) / Object.keys(relationCounts).length;
  const isolatedFurniture = Object.entries(relationCounts)
    .filter(([_, count]) => count < avgRelations * 0.5)
    .map(([name]) => name);

  const summaryText = `### 가구 근접성 분석 (${nearToRelations.length}개 관계)
${closeProximityPairs.length > 0 ? `- 가까운 쌍: ${closeProximityPairs.map(p => `${p.source}↔${p.target}(${p.distance.toFixed(1)}m)`).join(', ')}` : ''}
${farProximityPairs.length > 0 ? `- 멀리 떨어진 쌍: ${farProximityPairs.map(p => `${p.source}↔${p.target}(${p.distance.toFixed(1)}m)`).join(', ')}` : ''}
${isolatedFurniture.length > 0 ? `- ⚠️ 고립된 가구: ${isolatedFurniture.join(', ')} → 접근성 개선 필요` : ''}`;

  return {
    totalProximityRelations: nearToRelations.length,
    closeProximityPairs,
    farProximityPairs,
    isolatedFurniture,
    summaryText
  };
}

// 진열 관계 분석 (DISPLAYED_ON_FURNITURE)
function analyzeDisplayRelations(relations: any[], entities: any[]) {
  const displayRelations = relations.filter(r => {
    const typeName = r.relation_type_name || r.ontology_relation_types?.name || '';
    return typeName.toLowerCase().includes('display') || typeName === 'DISPLAYED_ON_FURNITURE';
  });

  if (displayRelations.length === 0) {
    return {
      totalDisplayRelations: 0,
      furnitureProductMap: {},
      underutilizedFurniture: [],
      summaryText: '진열 관계 데이터 없음'
    };
  }

  const entityMap = new Map(entities.map(e => [e.id, { label: e.label, type: e.entityType || e.model_3d_type }]));

  // 가구별 상품 맵핑
  const furnitureProductMap: Record<string, { products: string[]; hasTester: number }> = {};
  
  displayRelations.forEach(r => {
    const furniture = entityMap.get(r.target_entity_id)?.label || r.target_entity_id;
    const product = entityMap.get(r.source_entity_id)?.label || r.source_entity_id;
    const hasTester = r.properties?.has_tester ? 1 : 0;

    if (!furnitureProductMap[furniture]) {
      furnitureProductMap[furniture] = { products: [], hasTester: 0 };
    }
    furnitureProductMap[furniture].products.push(product);
    furnitureProductMap[furniture].hasTester += hasTester;
  });

  // 상품이 적은 가구 찾기
  const avgProducts = Object.values(furnitureProductMap)
    .reduce((sum, f) => sum + f.products.length, 0) / Object.keys(furnitureProductMap).length;
  
  const underutilizedFurniture = Object.entries(furnitureProductMap)
    .filter(([_, data]) => data.products.length < avgProducts * 0.5)
    .map(([name]) => name);

  const summaryText = `### 가구별 진열 현황 (${displayRelations.length}개 관계)
${Object.entries(furnitureProductMap).map(([furniture, data]) => 
  `- ${furniture}: ${data.products.length}개 상품${data.hasTester > 0 ? ` (테스터 ${data.hasTester}개)` : ''}`
).join('\n')}
${underutilizedFurniture.length > 0 ? `\n⚠️ 활용도 낮은 가구: ${underutilizedFurniture.join(', ')} → 상품 추가 배치 권장` : ''}`;

  return {
    totalDisplayRelations: displayRelations.length,
    furnitureProductMap,
    underutilizedFurniture,
    summaryText
  };
}

// 통합 데이터 분석 빌더
function buildComprehensiveAnalysis(storeContext: any) {
  const visits = storeContext.visits || [];
  const transactions = storeContext.transactions || [];
  const dailySales = storeContext.dailySales || [];
  const relations = storeContext.relations || [];
  const entities = storeContext.entities || [];

  const visitAnalysis = analyzeVisitPatterns(visits);
  const transactionAnalysis = analyzeTransactionPatterns(transactions);
  const salesTrendAnalysis = analyzeDailySalesTrends(dailySales);
  const proximityAnalysis = analyzeProximityRelations(relations, entities);
  const displayAnalysis = analyzeDisplayRelations(relations, entities);

  // 종합 요약 텍스트
  const comprehensiveSummary = `
## 📊 통합 데이터 분석

### 데이터 현황
- 엔티티: ${entities.length}개, 관계: ${relations.length}개
- 방문 기록: ${visits.length}건, 거래: ${transactions.length}건, 일별 매출: ${dailySales.length}일

${visitAnalysis.summaryText}

${transactionAnalysis.summaryText}

${salesTrendAnalysis.summaryText}

${proximityAnalysis.summaryText}

${displayAnalysis.summaryText}

### 🎯 AI 분석 우선순위
1. ${visitAnalysis.unvisitedZones.length > 0 ? `방문 없는 구역(${visitAnalysis.unvisitedZones.join(', ')}) 개선` : '고객 동선 최적화'}
2. ${proximityAnalysis.isolatedFurniture.length > 0 ? `고립된 가구(${proximityAnalysis.isolatedFurniture.join(', ')}) 재배치` : '가구 배치 최적화'}
3. ${displayAnalysis.underutilizedFurniture.length > 0 ? `활용도 낮은 가구(${displayAnalysis.underutilizedFurniture.join(', ')}) 상품 추가` : '진열 효율성 개선'}
4. ${salesTrendAnalysis.trend === 'decreasing' ? '매출 하락 원인 분석 및 개선' : '현재 트렌드 유지/강화'}
`;

  return {
    visitAnalysis,
    transactionAnalysis,
    salesTrendAnalysis,
    proximityAnalysis,
    displayAnalysis,
    comprehensiveSummary
  };
}

// ============================================================================
// 온톨로지 그래프 분석 함수들
// ============================================================================

interface GraphEntity {
  id: string;
  label: string;
  entityType: string;
  position?: { x: number; y: number; z?: number };
  properties?: Record<string, any>;
}

interface GraphRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationTypeId: string;
  properties?: Record<string, any>;
  weight?: number;
}

// 거리 계산
function calculateDistance(pos1: { x: number; z: number }, pos2: { x: number; z: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.z - pos1.z, 2));
}

// 클러스터 찾기
function findClusters(entities: GraphEntity[], clusterRadius = 3) {
  const clusters: Array<{ center: { x: number; z: number }; entities: string[]; density: number }> = [];
  const assigned = new Set<string>();
  
  for (const entity of entities) {
    if (assigned.has(entity.id) || !entity.position) continue;
    const clusterEntities = [entity];
    assigned.add(entity.id);
    
    for (const other of entities) {
      if (assigned.has(other.id) || !other.position) continue;
      const dist = calculateDistance(
        { x: entity.position.x, z: entity.position.z || entity.position.y || 0 },
        { x: other.position.x, z: other.position.z || other.position.y || 0 }
      );
      if (dist <= clusterRadius) {
        clusterEntities.push(other);
        assigned.add(other.id);
      }
    }
    
    if (clusterEntities.length >= 2) {
      const centerX = clusterEntities.reduce((sum, e) => sum + (e.position?.x || 0), 0) / clusterEntities.length;
      const centerZ = clusterEntities.reduce((sum, e) => sum + (e.position?.z || e.position?.y || 0), 0) / clusterEntities.length;
      clusters.push({
        center: { x: Math.round(centerX * 10) / 10, z: Math.round(centerZ * 10) / 10 },
        entities: clusterEntities.map(e => e.label),
        density: Math.round((clusterEntities.length / (Math.PI * clusterRadius * clusterRadius)) * 100) / 100
      });
    }
  }
  return clusters;
}

// 데드존 찾기
function findDeadZones(entities: GraphEntity[], storeWidth: number, storeDepth: number, gridSize = 2) {
  const deadZones: Array<{ area: { x: number; z: number }; reason: string }> = [];
  
  for (let x = gridSize; x < storeWidth - gridSize; x += gridSize) {
    for (let z = gridSize; z < storeDepth - gridSize; z += gridSize) {
      const nearbyEntities = entities.filter(e => {
        if (!e.position) return false;
        return calculateDistance({ x, z }, { x: e.position.x, z: e.position.z || e.position.y || 0 }) < gridSize * 1.5;
      });
      
      if (nearbyEntities.length === 0) {
        const overlaps = deadZones.some(dz => calculateDistance({ x, z }, dz.area) < gridSize);
        if (!overlaps) deadZones.push({ area: { x, z }, reason: '가구나 진열대가 없는 빈 공간' });
      }
    }
  }
  return deadZones.slice(0, 5);
}

// 레이아웃 규칙
const RETAIL_LAYOUT_RULES = [
  {
    id: 'checkout_near_exit', name: '계산대는 출구 근처에 위치',
    check: (entities: GraphEntity[]) => {
      const checkout = entities.find(e => e.entityType.toLowerCase().includes('checkout') || e.label.includes('계산대'));
      const entrance = entities.find(e => e.entityType.toLowerCase().includes('entrance') || e.label.includes('입구'));
      if (checkout && entrance && checkout.position && entrance.position) {
        const dist = calculateDistance(
          { x: checkout.position.x, z: checkout.position.z || checkout.position.y || 0 },
          { x: entrance.position.x, z: entrance.position.z || entrance.position.y || 0 }
        );
        return { passed: dist < 5, entities: dist >= 5 ? [checkout.label, entrance.label] : [] };
      }
      return { passed: true, entities: [] };
    },
    severity: 'medium' as const, suggestion: '계산대를 출구/입구 근처로 이동하세요'
  },
  {
    id: 'no_blocking_entrance', name: '입구 앞 2m 이내 가구 금지',
    check: (entities: GraphEntity[]) => {
      const entrance = entities.find(e => e.entityType.toLowerCase().includes('entrance') || e.label.includes('입구'));
      if (entrance && entrance.position) {
        const blocking = entities.filter(e => {
          if (e.id === entrance.id || !e.position) return false;
          return calculateDistance(
            { x: entrance.position!.x, z: entrance.position!.z || entrance.position!.y || 0 },
            { x: e.position.x, z: e.position.z || e.position.y || 0 }
          ) < 2;
        });
        return { passed: blocking.length === 0, entities: blocking.map(e => e.label) };
      }
      return { passed: true, entities: [] };
    },
    severity: 'high' as const, suggestion: '입구 앞 2m 이내의 가구를 다른 위치로 이동하세요'
  },
  {
    id: 'fitting_room_privacy', name: '피팅룸은 매장 안쪽에 위치',
    check: (entities: GraphEntity[], storeDepth = 16) => {
      const fittingRooms = entities.filter(e => e.entityType.toLowerCase().includes('fitting') || e.label.includes('탈의실'));
      const tooClose = fittingRooms.filter(f => f.position && (f.position.z || f.position.y || 0) < storeDepth * 0.3);
      return { passed: tooClose.length === 0, entities: tooClose.map(f => f.label) };
    },
    severity: 'medium' as const, suggestion: '피팅룸을 매장 안쪽으로 이동하세요'
  },
  {
    id: 'aisle_width', name: '통로 최소 폭 1.2m 확보',
    check: (entities: GraphEntity[]) => {
      const narrowAisles: string[] = [];
      const furniture = entities.filter(e => ['shelf', 'rack', 'displaytable', 'counter'].some(t => e.entityType.toLowerCase().includes(t)));
      for (let i = 0; i < furniture.length; i++) {
        for (let j = i + 1; j < furniture.length; j++) {
          if (furniture[i].position && furniture[j].position) {
            const dist = calculateDistance(
              { x: furniture[i].position!.x, z: furniture[i].position!.z || furniture[i].position!.y || 0 },
              { x: furniture[j].position!.x, z: furniture[j].position!.z || furniture[j].position!.y || 0 }
            );
            if (dist > 0.5 && dist < 1.2) narrowAisles.push(`${furniture[i].label} ↔ ${furniture[j].label}`);
          }
        }
      }
      return { passed: narrowAisles.length === 0, entities: narrowAisles.slice(0, 3) };
    },
    severity: 'high' as const, suggestion: '가구 사이 간격을 최소 1.2m 이상 확보하세요'
  }
];

const OPPORTUNITY_RULES = [
  {
    id: 'power_wall', name: '파워월 활용',
    check: (entities: GraphEntity[], storeWidth = 17) => {
      const rightWall = entities.filter(e => e.position && e.position.x > storeWidth * 0.8);
      const hasDisplay = rightWall.some(e => e.entityType.toLowerCase().includes('display'));
      return { applicable: !hasDisplay && rightWall.length < 3, impact: 'high' as const, action: '입구 오른쪽 벽면(파워월)에 신상품을 배치하세요' };
    }
  },
  {
    id: 'destination_zone', name: '목적지 구역 설정',
    check: (entities: GraphEntity[], storeWidth: number, storeDepth = 16) => {
      const backArea = entities.filter(e => e.position && (e.position.z || e.position.y || 0) > storeDepth * 0.7);
      const hasAttraction = backArea.some(e => e.label.includes('베스트') || e.label.includes('세일'));
      return { applicable: !hasAttraction, impact: 'high' as const, action: '매장 뒤쪽에 인기 상품을 배치하세요' };
    }
  }
];

// 레이아웃 규칙 분석
function analyzeLayoutRules(entities: GraphEntity[], storeWidth: number, storeDepth: number) {
  const violations: Array<{ rule: string; severity: string; entities: string[]; suggestion: string }> = [];
  const opportunities: Array<{ opportunity: string; impact: string; action: string }> = [];
  
  for (const rule of RETAIL_LAYOUT_RULES) {
    const result = rule.check(entities, storeDepth);
    if (!result.passed) violations.push({ rule: rule.name, severity: rule.severity, entities: result.entities, suggestion: rule.suggestion });
  }
  
  for (const opp of OPPORTUNITY_RULES) {
    const result = opp.check(entities, storeWidth, storeDepth);
    if (result.applicable) opportunities.push({ opportunity: opp.name, impact: result.impact, action: result.action });
  }
  
  const violationPenalty = violations.reduce((sum, v) => sum + (v.severity === 'high' ? 15 : v.severity === 'medium' ? 10 : 5), 0);
  const score = Math.max(0, Math.min(100, 100 - violationPenalty));
  
  return { score, violations, opportunities, clusters: findClusters(entities), deadZones: findDeadZones(entities, storeWidth, storeDepth) };
}

// 수요 분석
function analyzeDemandPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const purchaseRelations = relations.filter(r => r.properties?.purchase_id || r.properties?.total_price);
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const productSales = new Map<string, { count: number; revenue: number }>();
  for (const rel of purchaseRelations) {
    const existing = productSales.get(rel.targetEntityId) || { count: 0, revenue: 0 };
    existing.count += rel.properties?.quantity || 1;
    existing.revenue += rel.properties?.total_price || 0;
    productSales.set(rel.targetEntityId, existing);
  }
  
  const topSellingProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ product: idToLabel.get(id) || id, salesCount: data.count, revenue: data.revenue }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  
  return { topSellingProducts, productClusters: [], purchasePatterns: [], customerSegments: [] };
}

// 재고 분석
function analyzeInventoryPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const inventoryEntities = entities.filter(e => e.properties?.currentStock !== undefined);
  const restockPriorities = inventoryEntities
    .filter(e => (e.properties?.currentStock || 0) < (e.properties?.optimalStock || 10) * 0.5)
    .map(e => ({ product: e.label, urgency: (e.properties?.currentStock || 0) < (e.properties?.optimalStock || 10) * 0.25 ? 'critical' : 'high', reason: `현재 재고 ${e.properties?.currentStock || 0}개` }));
  
  const furnitureEntities = entities.filter(e => ['shelf', 'rack', 'storage'].some(t => e.entityType.toLowerCase().includes(t)));
  const storageUtilization = furnitureEntities.length > 0 ? Math.round((relations.filter(r => r.properties?.quantity).length / furnitureEntities.length) * 100) : 0;
  
  return { storageUtilization, restockPriorities, productLocationMap: [], storageOptimizations: [] };
}

// 가격 분석
function analyzePricingPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const productEntities = entities.filter(e => e.properties?.sellingPrice || e.properties?.price);
  
  const marginAnalysis = productEntities
    .filter(p => p.properties?.sellingPrice && p.properties?.costPrice)
    .map(p => ({ product: p.label, margin: Math.round(((p.properties!.sellingPrice - p.properties!.costPrice) / p.properties!.sellingPrice) * 100), category: p.properties?.category || 'Unknown' }))
    .sort((a, b) => b.margin - a.margin);
  
  const pricingOpportunities = marginAnalysis.filter(m => m.margin < 20).slice(0, 5)
    .map(m => ({ product: m.product, suggestion: `마진 ${m.margin}% - 가격 인상 검토`, expectedImpact: 10 }));
  
  return { priceRanges: [], marginAnalysis: marginAnalysis.slice(0, 20), pricingOpportunities, competingProducts: [] };
}

// 마케팅 분석
function analyzeMarketingPatterns(entities: GraphEntity[], relations: GraphRelation[]) {
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const purchaseRelations = relations.filter(r => r.properties?.purchase_id);
  const customerPurchases = new Map<string, string[]>();
  for (const rel of purchaseRelations) {
    if (!customerPurchases.has(rel.sourceEntityId)) customerPurchases.set(rel.sourceEntityId, []);
    customerPurchases.get(rel.sourceEntityId)!.push(rel.targetEntityId);
  }
  
  const pairFrequency = new Map<string, number>();
  const productFrequency = new Map<string, number>();
  for (const [_, products] of customerPurchases) {
    for (const product of products) productFrequency.set(product, (productFrequency.get(product) || 0) + 1);
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const pair = [products[i], products[j]].sort().join('|');
        pairFrequency.set(pair, (pairFrequency.get(pair) || 0) + 1);
      }
    }
  }
  
  const crossSellPairs = Array.from(pairFrequency.entries())
    .map(([pair, freq]) => {
      const [p1, p2] = pair.split('|');
      return { product1: idToLabel.get(p1) || p1, product2: idToLabel.get(p2) || p2, confidence: Math.round((freq / (productFrequency.get(p1) || 1)) * 100) / 100, support: Math.round((freq / (customerPurchases.size || 1)) * 100) / 100 };
    })
    .filter(p => p.confidence > 0.1).sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  
  return { crossSellPairs, customerJourneys: [], campaignTargets: [] };
}

// 통합 온톨로지 분석
function performOntologyAnalysis(entities: GraphEntity[], relations: GraphRelation[], scenarioType: string, storeWidth = 17, storeDepth = 16) {
  console.log(`=== Ontology Analysis: ${scenarioType} ===`);
  
  const entityByType: Record<string, number> = {};
  entities.forEach(e => { entityByType[e.entityType || 'unknown'] = (entityByType[e.entityType || 'unknown'] || 0) + 1; });
  
  const idToLabel = new Map<string, string>();
  entities.forEach(e => idToLabel.set(e.id, e.label));
  
  const patternCounts = new Map<string, { count: number; examples: string[] }>();
  const connectionCounts = new Map<string, number>();
  const connectedIds = new Set<string>();
  
  for (const relation of relations) {
    connectedIds.add(relation.sourceEntityId);
    connectedIds.add(relation.targetEntityId);
    connectionCounts.set(relation.sourceEntityId, (connectionCounts.get(relation.sourceEntityId) || 0) + 1);
    
    const source = entities.find(e => e.id === relation.sourceEntityId);
    const target = entities.find(e => e.id === relation.targetEntityId);
    if (source && target) {
      const pattern = `${source.entityType} → ${target.entityType}`;
      if (!patternCounts.has(pattern)) patternCounts.set(pattern, { count: 0, examples: [] });
      patternCounts.get(pattern)!.count++;
      if (patternCounts.get(pattern)!.examples.length < 3) patternCounts.get(pattern)!.examples.push(`${source.label} → ${target.label}`);
    }
  }
  
  const patterns = Array.from(patternCounts.entries()).map(([pattern, data]) => ({ pattern, frequency: data.count, examples: data.examples })).sort((a, b) => b.frequency - a.frequency);
  const hubEntities = Array.from(connectionCounts.entries()).map(([id, count]) => ({ entityId: id, label: idToLabel.get(id) || id, connectionCount: count })).sort((a, b) => b.connectionCount - a.connectionCount).slice(0, 5);
  const isolatedEntities = entities.filter(e => !connectedIds.has(e.id)).map(e => e.label);
  
  // 가구 필터링
  const furnitureEntities = entities.filter(e => {
    const type = (e.entityType || '').toLowerCase();
    const model3dType = (e.properties?.model_3d_type || '').toLowerCase();
    if (['furniture', 'room', 'structure'].includes(model3dType)) return true;
    return ['shelf', 'rack', 'displaytable', 'checkoutcounter', 'fittingroom', 'entrance', 'counter', 'table', 'display'].some(t => type.includes(t));
  });
  
  let layoutInsights = null, demandInsights = null, inventoryInsights = null, pricingInsights = null, marketingInsights = null;
  
  if (scenarioType === 'layout' || scenarioType === 'all') layoutInsights = analyzeLayoutRules(furnitureEntities, storeWidth, storeDepth);
  if (scenarioType === 'demand' || scenarioType === 'all') demandInsights = analyzeDemandPatterns(entities, relations);
  if (scenarioType === 'inventory' || scenarioType === 'all') inventoryInsights = analyzeInventoryPatterns(entities, relations);
  if (scenarioType === 'pricing' || scenarioType === 'all') pricingInsights = analyzePricingPatterns(entities, relations);
  if (scenarioType === 'recommendation' || scenarioType === 'all') marketingInsights = analyzeMarketingPatterns(entities, relations);
  
  // AI 프롬프트용 요약 생성
  const summaryLines: string[] = [`## 온톨로지 분석 (${scenarioType})`, `- 엔티티: ${entities.length}개, 관계: ${relations.length}개`, `- 타입별: ${Object.entries(entityByType).slice(0, 5).map(([k, v]) => `${k}(${v})`).join(', ')}`];
  
  if (patterns.length > 0) { summaryLines.push(`\n### 관계 패턴`); patterns.slice(0, 3).forEach(p => summaryLines.push(`- ${p.pattern}: ${p.frequency}회`)); }
  if (layoutInsights) {
    summaryLines.push(`\n### 레이아웃 점수: ${layoutInsights.score}/100`);
    if (layoutInsights.violations.length > 0) { summaryLines.push(`위반사항:`); layoutInsights.violations.forEach(v => summaryLines.push(`- [${v.severity}] ${v.rule}: ${v.suggestion}`)); }
    if (layoutInsights.opportunities.length > 0) { summaryLines.push(`기회:`); layoutInsights.opportunities.forEach(o => summaryLines.push(`- [${o.impact}] ${o.opportunity}: ${o.action}`)); }
  }
  if (demandInsights?.topSellingProducts?.length) summaryLines.push(`\n### 상위 판매: ${demandInsights.topSellingProducts.slice(0, 3).map(p => p.product).join(', ')}`);
  if (inventoryInsights) summaryLines.push(`\n### 저장공간 활용: ${inventoryInsights.storageUtilization}%`);
  if (pricingInsights?.pricingOpportunities?.length) summaryLines.push(`\n### 가격 기회: ${pricingInsights.pricingOpportunities.length}개`);
  if (marketingInsights?.crossSellPairs?.length) summaryLines.push(`\n### 크로스셀: ${marketingInsights.crossSellPairs.slice(0, 2).map(p => `${p.product1}+${p.product2}`).join(', ')}`);
  
  return {
    entityAnalysis: { totalCount: entities.length, byType: entityByType },
    relationAnalysis: { totalCount: relations.length, patterns, hubEntities, isolatedEntities },
    layoutInsights, demandInsights, inventoryInsights, pricingInsights, marketingInsights,
    summaryForAI: summaryLines.join('\n')
  };
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

Return a JSON object with causal_relationships, causal_chains, and insights.`;

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
  
  const statisticalAnomalies = detectStatisticalAnomalies(data, parameters);
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

Return a JSON object with anomalies, patterns, and summary.`;

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

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES DATA:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

Return a JSON object with predictions, feature_importance, drivers, risks, and model_quality.`;

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
// performLayoutSimulation v5 - AI 제품 배치 최적화 버전
// 가구뿐만 아니라 제품도 AI가 최적의 위치/가구로 재배치 제안
// ============================================================================

// Layout Simulation: 레이아웃 최적화 시뮬레이션 (v5 - Product Optimization)
async function performLayoutSimulation(request: InferenceRequest, apiKey: string) {
  console.log('performLayoutSimulation v5 - AI Product Placement Optimization');
  console.log('=== Layout Simulation Start ===');

  const { parameters = {} } = request;
  const storeContext = parameters.store_context || {};
  
  console.log('StoreContext keys:', JSON.stringify(Object.keys(storeContext), null, 2));
  console.log('StoreContext entities count:', storeContext.entities?.length || 0);
  
  // Entity 매핑
  const mappedEntities = (storeContext.entities || []).map((e: any) => ({
    ...e,
    entityType: e.entityType || e.entity_type_name || 'unknown',
    position: e.position || e.model_3d_position,
    rotation: e.rotation || e.model_3d_rotation,
    scale: e.scale || e.model_3d_scale,
  }));
  console.log('Mapped entities:', mappedEntities.length);
  
  // 🆕 개선된 필터링 로직
  
  // 1. 가구 필터링
  const furnitureEntities = mappedEntities.filter((e: any) => {
    const model3dType = (e.model_3d_type || '').toLowerCase();
    const entityType = (e.entityType || '').toLowerCase();
    
    return model3dType === 'furniture' ||
           model3dType.includes('furniture') ||
           ['shelf', 'rack', 'displaytable', 'display', 'counter', 'checkout', 'fixture', 'table', 'hanger'].some(t => 
             entityType.toLowerCase().includes(t)
           );
  });
  console.log('Filtered furniture:', furnitureEntities.length);
  
  // 2. 제품 필터링 (개선)
  const productEntities = mappedEntities.filter((e: any) => {
    const type = (e.entityType || e.entity_type_name || '').toLowerCase();
    const model3dType = (e.model_3d_type || '').toLowerCase();
    
    return type === 'product' || 
           type.includes('product') ||
           model3dType === 'product' ||
           model3dType.includes('product');
  });
  console.log('Filtered products:', productEntities.length);
  
  // 3. Space 필터링 (개선)
  const spaceEntities = mappedEntities.filter((e: any) => {
    const type = (e.model_3d_type || '').toLowerCase();
    const entityType = (e.entityType || '').toLowerCase();
    const label = (e.label || '').toLowerCase();
    
    return type === 'space' || 
           type.includes('space') ||
           entityType === 'space' ||
           label.includes('3d모델') ||
           label.includes('매장 모델');
  });
  console.log('Found space entities:', spaceEntities.length);
  
  let spaceEntity = spaceEntities.length > 0 ? spaceEntities[0] : null;
  if (!spaceEntity) {
    const potentialSpace = mappedEntities.find((e: any) => 
      (e.model_3d_url || e.model3dUrl) && 
      !['furniture', 'product'].includes((e.model_3d_type || '').toLowerCase())
    );
    if (potentialSpace) {
      spaceEntity = potentialSpace;
      console.log('Found potential space entity:', spaceEntity.label);
    }
  }

  // 가구가 없을 경우 빈 결과 반환
  if (furnitureEntities.length === 0) {
    console.log('No furniture entities found - returning empty layout');
    return {
      type: 'layout_simulation',
      timestamp: new Date().toISOString(),
      asIsRecipe: { space: null, furniture: [], products: [] },
      toBeRecipe: { space: null, furniture: [], products: [] },
      layoutChanges: [],
      productPlacements: [],
      optimizationSummary: {
        changesCount: 0,
        productChangesCount: 0,
        expectedTrafficIncrease: 0,
        expectedRevenueIncrease: 0,
        confidence: 0,
      },
      aiInsights: ['가구 데이터가 없습니다. 디지털트윈 3D에서 가구를 추가해주세요.'],
      recommendations: [],
      confidenceScore: 0,
    };
  }

  // 🆕 현재 가구-제품 관계 분석
  const currentFurnitureProductMap = buildCurrentFurnitureProductMap(
    storeContext.relations || [],
    furnitureEntities,
    productEntities
  );
  
  // 관계 요약 텍스트 생성
  const furnitureProductSummary = buildFurnitureProductSummary(
    furnitureEntities,
    productEntities,
    currentFurnitureProductMap
  );

  // Enhanced Store Context 구성 (Phase 1)
  const enhancedContext: EnhancedStoreContext = {
    storeInfo: storeContext.storeInfo,
    entities: storeContext.entities || [],
    relations: storeContext.relations || [],
    visits: storeContext.visits,
    transactions: storeContext.transactions,
    dailySales: storeContext.dailySales,
    salesData: storeContext.salesData,
    visitorData: storeContext.visitorData,
    conversionData: storeContext.conversionData,
    recommendationPerformance: storeContext.recommendationPerformance,
    dataQuality: storeContext.dataQuality,
  };

  // 🆕 Continuous Learning: 과거 성과 및 학습 컨텍스트 조회
  const storeId = storeContext.storeInfo?.id;
  let pastPerformanceData: PastPerformanceResult | undefined;
  let learningContext: LearningContext | undefined;

  if (storeId && supabase) {
    try {
      // 과거 성과 데이터 조회
      pastPerformanceData = await calculatePastPerformance(supabase, storeId, 'layout');
      console.log('[Learning] Past performance:', pastPerformanceData);

      // 학습 컨텍스트 조회 (성공/실패 패턴)
      learningContext = await buildLearningContext(supabase, storeId, 'layout');
      console.log('[Learning] Context summary:', learningContext.contextSummary);
    } catch (learningErr) {
      console.warn('[Learning] Failed to fetch learning data:', learningErr);
    }
  }

  // 통계 기반 신뢰도 계산 (Phase 1 + Continuous Learning)
  const confidenceResult = calculateStatisticalConfidence(enhancedContext, pastPerformanceData);
  console.log('Statistical Confidence:', confidenceResult.score, confidenceResult.explanation);
  
  // 온톨로지 그래프 분석
  const storeWidth = storeContext.storeInfo?.width || 17.4;
  const storeDepth = storeContext.storeInfo?.depth || 16.6;
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  
  const relations: GraphRelation[] = (storeContext.relations || []).map((r: any) => ({
    id: r.id,
    sourceEntityId: r.source_entity_id || r.sourceEntityId,
    targetEntityId: r.target_entity_id || r.targetEntityId,
    relationTypeId: r.relation_type_id,
    properties: r.properties || {}
  }));
  
  const allGraphEntities: GraphEntity[] = (storeContext.entities || []).map((e: any) => ({
    id: e.id,
    label: e.label,
    entityType: e.entityType || e.entity_type_name || 'unknown',
    position: e.position || e.model_3d_position,
    properties: { ...e.properties, model_3d_type: e.model_3d_type }
  }));
  
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'layout', storeWidth, storeDepth);
  console.log(`Layout Score: ${ontologyAnalysis.layoutInsights?.score}`);
  
  // 통합 데이터 분석
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext);

  // 가구 목록 텍스트
  const furnitureList = furnitureEntities.slice(0, 15).map((f: any) => {
    const x = f.position?.x || 0;
    const z = f.position?.z || f.position?.y || 0;
    const connectedProducts = currentFurnitureProductMap.get(f.id) || [];
    return `- [${f.id}] ${f.label} (${f.entityType}): pos(x=${x.toFixed(1)}, z=${z.toFixed(1)}) - 연결된 제품: ${connectedProducts.length}개`;
  }).join('\n');

  // 🆕 제품 목록 텍스트 (AI에게 제공)
  const productList = productEntities.slice(0, 20).map((p: any) => {
    const x = p.position?.x || 0;
    const z = p.position?.z || p.position?.y || 0;
    const parentFurniture = findParentFurniture(p.id, currentFurnitureProductMap, furnitureEntities);
    return `- [${p.id}] ${p.label}: pos(x=${x.toFixed(1)}, z=${z.toFixed(1)}) - 현재 가구: ${parentFurniture?.label || '없음'}`;
  }).join('\n');

  // 🆕 AI 프롬프트 - 가구 + 제품 최적화 (Continuous Learning 포함)
  const prompt = buildEnhancedLayoutPromptWithProducts(
    enhancedContext,
    furnitureList,
    productList,
    furnitureProductSummary,
    ontologyAnalysis,
    comprehensiveAnalysis,
    storeWidth,
    storeDepth,
    confidenceResult,
    learningContext
  );

  // AI 호출
  let aiResponse: any = {
    layoutChanges: [],
    productPlacements: [],
    optimizationSummary: { expectedTrafficIncrease: 0, expectedRevenueIncrease: 0, confidence: 50 },
    aiInsights: [],
    recommendations: [],
    dataBasedInsights: [],
  };
  
  try {
    console.log('Calling AI API for furniture + product optimization...');
    
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
            content: `You are a data-driven retail layout AND product placement expert. 
You optimize both furniture positions AND product placements on furniture.
Return ONLY valid JSON, no markdown code blocks, no explanations.
Base ALL recommendations on the provided real data.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content || '';
      
      console.log('AI response length:', aiContent.length);
      
      if (aiContent.trim()) {
        const cleaned = cleanJsonResponse(aiContent);
        
        if (cleaned.startsWith('{')) {
          aiResponse = JSON.parse(cleaned);
          console.log('Parsed layoutChanges count:', aiResponse.layoutChanges?.length || 0);
          console.log('Parsed productPlacements count:', aiResponse.productPlacements?.length || 0);
        }
      }
    } else {
      console.error('AI API error:', response.status, await response.text());
    }
  } catch (e) {
    console.error('AI call error:', e);
  }

  // layoutChanges 검증 및 정규화
  const validFurnitureIds = new Set(furnitureEntities.map((f: any) => f.id));
  const validProductIds = new Set(productEntities.map((p: any) => p.id));

  const layoutChanges = Array.isArray(aiResponse.layoutChanges) 
    ? aiResponse.layoutChanges
        .filter((c: any) => {
          if (!c.entityId || !c.suggestedPosition) return false;
          if (!validFurnitureIds.has(c.entityId)) {
            console.warn(`Invalid furniture entityId from AI: ${c.entityId}`);
            return false;
          }
          return true;
        })
        .map((c: any) => {
          const pos = c.suggestedPosition;
          const safeHalfWidth = halfWidth - 1;
          const safeHalfDepth = halfDepth - 1;
          return {
            ...c,
            suggestedPosition: {
              x: Math.max(-safeHalfWidth, Math.min(safeHalfWidth, pos.x || 0)),
              y: pos.y || 0,
              z: Math.max(-safeHalfDepth, Math.min(safeHalfDepth, pos.z || 0)),
            },
          };
        })
    : [];

  // 🆕 productPlacements 검증 및 정규화
  const productPlacements = Array.isArray(aiResponse.productPlacements)
    ? aiResponse.productPlacements
        .filter((p: any) => {
          if (!p.productId) return false;
          if (!validProductIds.has(p.productId)) {
            console.warn(`Invalid product ID from AI: ${p.productId}`);
            return false;
          }
          // suggestedFurnitureId가 있으면 유효한지 확인
          if (p.suggestedFurnitureId && !validFurnitureIds.has(p.suggestedFurnitureId)) {
            console.warn(`Invalid suggested furniture ID: ${p.suggestedFurnitureId}`);
            return false;
          }
          return true;
        })
        .map((p: any) => {
          // 제품 위치도 안전 영역 내로 클램핑
          if (p.suggestedPosition) {
            const safeHalfWidth = halfWidth - 0.5;
            const safeHalfDepth = halfDepth - 0.5;
            p.suggestedPosition = {
              x: Math.max(-safeHalfWidth, Math.min(safeHalfWidth, p.suggestedPosition.x || 0)),
              y: p.suggestedPosition.y || 0,
              z: Math.max(-safeHalfDepth, Math.min(safeHalfDepth, p.suggestedPosition.z || 0)),
            };
          }
          return p;
        })
    : [];

  console.log('Valid layoutChanges after filtering:', layoutChanges.length);
  console.log('Valid productPlacements after filtering:', productPlacements.length);

  // 변경 맵 생성
  const furnitureChangesMap = new Map<string, any>();
  layoutChanges.forEach((c: any) => {
    furnitureChangesMap.set(c.entityId, c);
  });

  const productChangesMap = new Map<string, any>();
  productPlacements.forEach((p: any) => {
    productChangesMap.set(p.productId, p);
  });

  // 🆕 레시피 빌더 (가구 + 제품 모두 변경 적용)
  const buildRecipe = (mode: 'current' | 'suggested') => ({
    space: spaceEntity ? {
      id: spaceEntity.id,
      type: 'space',
      label: spaceEntity.label,
      position: spaceEntity.position || { x: 0, y: 0, z: 0 },
      rotation: spaceEntity.rotation || { x: 0, y: 0, z: 0 },
      scale: spaceEntity.scale || { x: 1, y: 1, z: 1 },
      model_url: spaceEntity.model3dUrl || spaceEntity.model_3d_url || null,
      dimensions: spaceEntity.dimensions || spaceEntity.model_3d_dimensions || null,
    } : null,
    
    furniture: furnitureEntities.map((f: any) => {
      const change = furnitureChangesMap.get(f.id);
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
        model_url: f.model3dUrl || f.model_3d_url || null,
        dimensions: f.dimensions || f.model_3d_dimensions || null,
        color: f.properties?.color || '#888888',
        isChanged: mode === 'suggested' && !!change,
      };
    }),
    
    // 🆕 제품도 AI 추천 위치 적용
    products: productEntities.map((p: any) => {
      const change = productChangesMap.get(p.id);
      const position = (mode === 'suggested' && change?.suggestedPosition)
        ? change.suggestedPosition
        : (p.position || { x: 0, y: 0, z: 0 });
      
      // 현재 부모 가구
      const currentParent = findParentFurniture(p.id, currentFurnitureProductMap, furnitureEntities);
      // 추천 부모 가구
      const suggestedParent = change?.suggestedFurnitureId 
        ? furnitureEntities.find((f: any) => f.id === change.suggestedFurnitureId)
        : null;
      
      return {
        id: p.id,
        type: 'product',
        product_id: p.id,
        sku: p.label,
        label: p.label,
        position: position,
        rotation: p.rotation || { x: 0, y: 0, z: 0 },
        scale: p.scale || { x: 1, y: 1, z: 1 },
        model_url: p.model3dUrl || p.model_3d_url || null,
        dimensions: p.dimensions || p.model_3d_dimensions || null,
        isChanged: mode === 'suggested' && !!change,
        // 🆕 가구 연결 정보
        currentFurnitureId: currentParent?.id || null,
        currentFurnitureLabel: currentParent?.label || null,
        suggestedFurnitureId: (mode === 'suggested' && suggestedParent) ? suggestedParent.id : currentParent?.id,
        suggestedFurnitureLabel: (mode === 'suggested' && suggestedParent) ? suggestedParent.label : currentParent?.label,
        furnitureChanged: mode === 'suggested' && change?.suggestedFurnitureId && change.suggestedFurnitureId !== currentParent?.id,
      };
    }),
  });
  
  const rawConfidence = aiResponse.optimizationSummary?.confidence || confidenceResult.score;
  const normalizedConfidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
  
  const result = {
    type: 'layout_simulation',
    timestamp: new Date().toISOString(),
    asIsRecipe: buildRecipe('current'),
    toBeRecipe: buildRecipe('suggested'),
    
    // 가구 변경
    layoutChanges: layoutChanges,
    
    // 🆕 제품 배치 변경
    productPlacements: productPlacements,
    
    optimizationSummary: {
      expectedTrafficIncrease: aiResponse.optimizationSummary?.expectedTrafficIncrease || 0,
      expectedRevenueIncrease: aiResponse.optimizationSummary?.expectedRevenueIncrease || 0,
      expectedConversionIncrease: aiResponse.optimizationSummary?.expectedConversionIncrease || 0,
      changesCount: layoutChanges.length,
      productChangesCount: productPlacements.length,  // 🆕
      confidence: normalizedConfidence,
      confidenceFactors: confidenceResult.factors,
      confidenceExplanation: confidenceResult.explanation,
    },
    
    dataBasedInsights: aiResponse.dataBasedInsights || [],
    aiInsights: Array.isArray(aiResponse.aiInsights) ? aiResponse.aiInsights : [],
    recommendations: Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
    confidenceScore: normalizedConfidence / 100,
    dataQuality: enhancedContext.dataQuality,
    ontologyAnalysis: {
      score: ontologyAnalysis.layoutInsights?.score || 0,
      violations: ontologyAnalysis.layoutInsights?.violations || [],
      opportunities: ontologyAnalysis.layoutInsights?.opportunities || [],
      clusters: ontologyAnalysis.layoutInsights?.clusters || [],
      deadZones: ontologyAnalysis.layoutInsights?.deadZones || [],
      entityCount: allGraphEntities.length,
      relationCount: relations.length,
      patterns: ontologyAnalysis.relationAnalysis.patterns.slice(0, 5),
    },
  };

  console.log('=== Layout Simulation Complete ===');
  console.log('asIsRecipe furniture count:', result.asIsRecipe.furniture.length);
  console.log('asIsRecipe products count:', result.asIsRecipe.products.length);
  console.log('toBeRecipe furniture count:', result.toBeRecipe.furniture.length);
  console.log('toBeRecipe products count:', result.toBeRecipe.products.length);
  console.log('layoutChanges count:', result.layoutChanges.length);
  console.log('productPlacements count:', result.productPlacements.length);
  console.log('confidence:', result.optimizationSummary.confidence);

  return result;
}


// ============================================================================
// 헬퍼 함수들
// ============================================================================

// 현재 가구-제품 관계 맵 생성
function buildCurrentFurnitureProductMap(
  relations: any[], 
  furnitureEntities: any[], 
  productEntities: any[]
): Map<string, any[]> {
  const furnitureProductMap = new Map<string, any[]>();
  
  // 모든 가구에 대해 빈 배열 초기화
  furnitureEntities.forEach((f: any) => {
    furnitureProductMap.set(f.id, []);
  });
  
  // DISPLAYED_ON_FURNITURE 관계 찾기
  const displayRelations = relations.filter((r: any) => {
    const typeName = (r.relation_type_name || r.ontology_relation_types?.name || '').toLowerCase();
    return typeName.includes('display') || typeName === 'displayed_on_furniture';
  });
  
  // 관계 기반 매핑
  displayRelations.forEach((rel: any) => {
    const productId = rel.source_entity_id || rel.sourceEntityId;
    const furnitureId = rel.target_entity_id || rel.targetEntityId;
    
    const product = productEntities.find((p: any) => p.id === productId);
    if (product && furnitureProductMap.has(furnitureId)) {
      furnitureProductMap.get(furnitureId)!.push(product);
    }
  });
  
  // 관계가 없는 경우: 위치 기반 근접성으로 매핑 (fallback)
  productEntities.forEach((product: any) => {
    let alreadyMapped = false;
    furnitureProductMap.forEach((products) => {
      if (products.some((p: any) => p.id === product.id)) {
        alreadyMapped = true;
      }
    });
    
    if (!alreadyMapped && product.position) {
      let closestFurniture: any = null;
      let minDistance = Infinity;
      
      furnitureEntities.forEach((furniture: any) => {
        if (furniture.position) {
          const dx = (product.position.x || 0) - (furniture.position.x || 0);
          const dz = (product.position.z || product.position.y || 0) - (furniture.position.z || furniture.position.y || 0);
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          if (distance < 3 && distance < minDistance) {
            minDistance = distance;
            closestFurniture = furniture;
          }
        }
      });
      
      if (closestFurniture) {
        furnitureProductMap.get(closestFurniture.id)!.push(product);
      }
    }
  });
  
  return furnitureProductMap;
}

// 부모 가구 찾기
function findParentFurniture(
  productId: string, 
  furnitureProductMap: Map<string, any[]>,
  furnitureEntities: any[]
): any | null {
  for (const [furnitureId, products] of furnitureProductMap.entries()) {
    if (products.some((p: any) => p.id === productId)) {
      return furnitureEntities.find((f: any) => f.id === furnitureId);
    }
  }
  return null;
}

// 가구-제품 관계 요약 텍스트 생성
function buildFurnitureProductSummary(
  furnitureEntities: any[],
  productEntities: any[],
  furnitureProductMap: Map<string, any[]>
): string {
  const lines: string[] = ['=== 🪑↔️📦 현재 가구-제품 연결 현황 ==='];
  
  furnitureEntities.forEach((f: any) => {
    const products = furnitureProductMap.get(f.id) || [];
    if (products.length > 0) {
      lines.push(`\n${f.label} (${f.entityType}):`);
      products.forEach((p: any) => {
        lines.push(`  - ${p.label}`);
      });
    } else {
      lines.push(`\n${f.label}: 연결된 제품 없음 ⚠️`);
    }
  });
  
  // 연결되지 않은 제품
  const unconnectedProducts = productEntities.filter((p: any) => {
    for (const products of furnitureProductMap.values()) {
      if (products.some((prod: any) => prod.id === p.id)) {
        return false;
      }
    }
    return true;
  });
  
  if (unconnectedProducts.length > 0) {
    lines.push(`\n⚠️ 가구에 연결되지 않은 제품 (${unconnectedProducts.length}개):`);
    unconnectedProducts.slice(0, 5).forEach((p: any) => {
      lines.push(`  - ${p.label} at (${p.position?.x?.toFixed(1) || 0}, ${p.position?.z?.toFixed(1) || 0})`);
    });
  }
  
  return lines.join('\n');
}


// 🆕 가구 + 제품 최적화를 위한 강화된 프롬프트
function buildEnhancedLayoutPromptWithProducts(
  context: EnhancedStoreContext,
  furnitureList: string,
  productList: string,
  furnitureProductSummary: string,
  ontologyAnalysis: any,
  comprehensiveAnalysis: any,
  storeWidth: number,
  storeDepth: number,
  confidenceResult: any,
  learningContext?: LearningContext
): string {
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;
  const enhancedDataSection = buildEnhancedDataPrompt(context);

  // Continuous Learning 학습 데이터 추가
  const learningSection = learningContext?.promptAddition || '';

  return `You are a retail store layout AND product placement optimization expert with access to REAL business data.

${enhancedDataSection}

${learningSection}

=== 🔬 온톨로지 그래프 분석 ===
${ontologyAnalysis?.summaryForAI || '온톨로지 분석 없음'}

${comprehensiveAnalysis?.comprehensiveSummary || ''}

${furnitureProductSummary}

=== 📐 매장 경계 (중심 기준 좌표계) ===
- 매장 크기: ${storeWidth}m x ${storeDepth}m
- X축 범위: -${halfWidth.toFixed(1)} ~ +${halfWidth.toFixed(1)}
- Z축 범위: -${halfDepth.toFixed(1)} ~ +${halfDepth.toFixed(1)}
- 가구 안전 영역: X ±${(halfWidth - 1).toFixed(1)}, Z ±${(halfDepth - 1).toFixed(1)}
- 제품 안전 영역: X ±${(halfWidth - 0.5).toFixed(1)}, Z ±${(halfDepth - 0.5).toFixed(1)}

=== 🪑 현재 가구 배치 ===
${furnitureList}

=== 📦 현재 제품 배치 ===
${productList}

=== 📊 분석 신뢰도: ${confidenceResult.score}% ===
신뢰도 근거: ${confidenceResult.explanation}

=== 💡 최적화 목표 ===
1. **가구 배치 최적화**: 3-5개의 가구 이동 제안
2. **제품 배치 최적화**: 제품을 더 적합한 가구로 재배치하거나 위치 조정 제안
   - 인기 상품은 매장 뒤쪽 (목적지 구역)
   - 신상품/프로모션 상품은 입구 근처 (파워월)
   - 연관 상품은 인접 배치 (크로스셀)
   - 고마진 상품은 눈높이/접근성 좋은 위치

CRITICAL RULES:
1. 모든 위치는 반드시 안전 영역 내여야 함
2. 제품 위치는 해당 가구 위/근처여야 함 (가구 위치 + 오프셋)
3. 실제 데이터가 지적하는 문제점을 우선 해결

Return ONLY valid JSON (no markdown):
{
  "layoutChanges": [
    {
      "entityId": "furniture-uuid",
      "entityLabel": "가구 이름",
      "entityType": "Shelf",
      "currentPosition": {"x": 0, "y": 0, "z": 0},
      "suggestedPosition": {"x": 0, "y": 0, "z": 0},
      "reason": "📊 [데이터 근거] 이동 이유",
      "impact": "high|medium|low"
    }
  ],
  "productPlacements": [
    {
      "productId": "product-uuid",
      "productLabel": "제품 이름",
      "currentFurnitureId": "current-furniture-uuid",
      "currentFurnitureLabel": "현재 가구 이름",
      "suggestedFurnitureId": "new-furniture-uuid",
      "suggestedFurnitureLabel": "추천 가구 이름",
      "suggestedPosition": {"x": 0, "y": 1.2, "z": 0},
      "reason": "📊 [배치 이유] 예: 인기상품을 매장 뒤쪽으로 이동하여 고객 동선 유도",
      "impact": "high|medium|low"
    }
  ],
  "optimizationSummary": {
    "expectedTrafficIncrease": 15,
    "expectedRevenueIncrease": 8,
    "expectedConversionIncrease": 3,
    "confidence": ${confidenceResult.score}
  },
  "dataBasedInsights": ["인사이트1", "인사이트2"],
  "aiInsights": ["종합 인사이트"],
  "recommendations": ["추천"]
}`
;
}

// Business Goal Analysis
async function performBusinessGoalAnalysis(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const goalText = parameters.goal_text || '';
  
  const prompt = `You are an expert retail strategy consultant.

BUSINESS GOAL: ${goalText}

Analyze this business goal and recommend 3-5 actionable simulation scenarios.
Return a JSON object with recommendations array.`;

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

// Demand Forecast
async function performDemandForecast(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;
  
  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'demand');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext) {
    const avgRevenue = storeContext.recentKpis?.length > 0
      ? storeContext.recentKpis.reduce((sum: number, k: any) => sum + k.totalRevenue, 0) / storeContext.recentKpis.length
      : 0;
    
    contextSummary = `
ACTUAL STORE DATA (Last 30 Days):
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Average Daily Revenue: ${Math.round(avgRevenue).toLocaleString()}원

${comprehensiveAnalysis.visitAnalysis.summaryText}
${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.salesTrendAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in demand forecasting for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a comprehensive JSON object with predictedKpi, confidenceScore, aiInsights, demandDrivers, demandForecast, topProducts, and recommendations.`;

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
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'demand_forecast',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      demandInsights: ontologyAnalysis.demandInsights,
      patterns: ontologyAnalysis.relationAnalysis.patterns.slice(0, 5),
    },
  };
}

// Inventory Optimization
async function performInventoryOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'inventory');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext?.inventory) {
    const totalStock = storeContext.inventory.reduce((sum: number, i: any) => sum + i.currentStock, 0);
    
    contextSummary = `
ACTUAL INVENTORY DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Inventory Items: ${storeContext.inventory.length}개
- Total Current Stock: ${totalStock.toLocaleString()}개

${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.displayAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in inventory management for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, inventoryOptimization, and recommendations.`;

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
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'inventory_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      inventoryInsights: ontologyAnalysis.inventoryInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Pricing Optimization
async function performPricingOptimization(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'pricing');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext?.products) {
    const avgPrice = storeContext.products.reduce((sum: number, p: any) => sum + p.sellingPrice, 0) / storeContext.products.length;
    
    contextSummary = `
ACTUAL PRODUCT PRICING DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Products: ${storeContext.products.length}개
- Average Selling Price: ${Math.round(avgPrice).toLocaleString()}원

${comprehensiveAnalysis.transactionAnalysis.summaryText}
${comprehensiveAnalysis.salesTrendAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in pricing strategy for retail.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, pricingOptimization, and recommendations.`;

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
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'pricing_optimization',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      pricingInsights: ontologyAnalysis.pricingInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Recommendation Strategy
async function performRecommendationStrategy(request: InferenceRequest, apiKey: string) {
  const { parameters = {} } = request;
  const storeContext = parameters.store_context;

  const allGraphEntities: GraphEntity[] = (storeContext?.entities || []).map((e: any) => ({
    id: e.id, label: e.label, entityType: e.entityType || 'unknown', properties: e.properties || {}
  }));
  const relations: GraphRelation[] = (storeContext?.relations || []).map((r: any) => ({
    id: r.id, sourceEntityId: r.source_entity_id || r.sourceEntityId, targetEntityId: r.target_entity_id || r.targetEntityId, relationTypeId: r.relation_type_id, properties: r.properties || {}
  }));
  const ontologyAnalysis = performOntologyAnalysis(allGraphEntities, relations, 'recommendation');
  const comprehensiveAnalysis = buildComprehensiveAnalysis(storeContext || {});
  
  let contextSummary = '';
  if (storeContext) {
    contextSummary = `
ACTUAL STORE PERFORMANCE DATA:
- Store: ${storeContext.storeInfo?.name || 'N/A'}
- Total Products: ${storeContext.products?.length || 0}개

${comprehensiveAnalysis.visitAnalysis.summaryText}
${comprehensiveAnalysis.displayAnalysis.summaryText}
${comprehensiveAnalysis.proximityAnalysis.summaryText}
`;
  }
  
  const prompt = `You are an expert in retail marketing and recommendation systems.
${contextSummary}

=== 온톨로지 분석 ===
${ontologyAnalysis.summaryForAI}

Return a JSON object with predictedKpi, confidenceScore, aiInsights, recommendationStrategy, and recommendations.`;

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
  const prediction = safeParseAIResponse(result.choices?.[0]?.message?.content || '', {});
  
  if (prediction.confidenceScore !== undefined) {
    prediction.confidenceScore = Number(prediction.confidenceScore);
  }
  
  return {
    type: 'recommendation_strategy',
    timestamp: new Date().toISOString(),
    ...prediction,
    ontologyAnalysis: {
      marketingInsights: ontologyAnalysis.marketingInsights,
      demandInsights: ontologyAnalysis.demandInsights,
    },
  };
}

// Pattern Discovery
async function performPatternDiscovery(request: InferenceRequest, apiKey: string) {
  const { data, graph_data, time_series_data, parameters = {} } = request;
  
  if (parameters.analysis_type === 'business_goal_analysis') {
    return performBusinessGoalAnalysis(request, apiKey);
  }
  
  const dataSummary = summarizeData(data, graph_data);
  const timeSeriesSummary = time_series_data ? summarizeTimeSeries(time_series_data) : null;
  
  const prompt = `You are an expert in data mining and pattern recognition.

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

${timeSeriesSummary ? `TIME SERIES PATTERNS:
${JSON.stringify(timeSeriesSummary, null, 2)}
` : ''}

Return a JSON object with patterns, segments, trends, insights, and summary.`;

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
    trend: calculateTrendHelper(values),
  };
}

function calculateTrendHelper(values: number[]) {
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
