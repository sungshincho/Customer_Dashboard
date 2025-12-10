/**
 * AIRecommendationTab.tsx
 *
 * 인사이트 허브 - AI 추천 탭
 * AI 의사결정 허브 (예측 → 최적화 → 추천 → 실행 → 측정)
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Box,
  Users,
  Calendar,
  AlertTriangle,
  Package,
  Target,
  Play,
  Settings,
  FlaskConical,
  Lightbulb,
  Pause,
  Square,
  Edit,
  Plus,
  ArrowRight,
  Minus,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useApplyRecommendation } from '@/hooks/useROITracking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ============================================================================
// 타입 정의
// ============================================================================
interface ActiveStrategy {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled';
  daysActive: number;
  expectedROI: number;
  currentROI: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
}

interface DemandForecast {
  predictedRevenue: number;
  predictedVisitors: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

interface PriceOptimization {
  totalProducts: number;
  optimizableCount: number;
  potentialRevenueIncreasePercent: number;
}

interface InventoryOptimization {
  totalItems: number;
  orderRecommendations: number;
  stockoutPrevention: number;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export function AIRecommendationTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { data: recommendations = [], isLoading } = useAIRecommendations(selectedStore?.id);
  const applyRecommendation = useApplyRecommendation();

  // 적용된 추천 및 ROI 데이터
  const { data: appliedData } = useQuery({
    queryKey: ['applied-recommendations', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return { applications: [], measurements: [] };

      const [applicationsRes, measurementsRes] = await Promise.all([
        supabase
          .from('recommendation_applications')
          .select('*, ai_recommendations(title, description)')
          .eq('store_id', selectedStore.id)
          .order('applied_at', { ascending: false }),
        supabase
          .from('roi_measurements')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('status', 'completed')
          .order('measured_at', { ascending: false }),
      ]);

      return {
        applications: applicationsRes.data || [],
        measurements: measurementsRes.data || [],
      };
    },
    enabled: !!selectedStore?.id,
  });

  // Mock 데이터 (실제 구현 시 API 연동)
  const activeStrategies: ActiveStrategy[] = useMemo(() => [
    {
      id: '1',
      name: '겨울 패딩 10% 할인',
      status: 'active',
      daysActive: 3,
      expectedROI: 245,
      currentROI: 198,
      progress: 43,
      trend: 'up',
    },
  ], []);

  const demandForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 12.5,
  }), []);

  const visitorForecast: DemandForecast = useMemo(() => ({
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    trend: 'up',
    percentChange: 8.3,
  }), []);

  const priceOptimization: PriceOptimization = useMemo(() => ({
    totalProducts: 156,
    optimizableCount: 23,
    potentialRevenueIncreasePercent: 15.2,
  }), []);

  const inventoryOptimization: InventoryOptimization = useMemo(() => ({
    totalItems: 89,
    orderRecommendations: 12,
    stockoutPrevention: 5,
  }), []);

  // 요약 통계
  const summary = useMemo(() => {
    const pending = recommendations.filter(r => r.status === 'pending').length;
    const applied = appliedData?.applications.length || 0;
    const totalROI = appliedData?.measurements.reduce((s, m) => s + (m.actual_revenue_change || 0), 0) || 0;
    const avgROI = appliedData?.measurements.length
      ? totalROI / appliedData.measurements.length
      : 0;

    return { pending, applied, totalROI, avgROI };
  }, [recommendations, appliedData]);

  // 추천 전략 변환
  const strategyRecommendations = useMemo(() => {
    return recommendations
      .filter(r => r.status === 'pending')
      .slice(0, 3)
      .map((rec, index) => ({
        id: rec.id,
        rank: index + 1,
        title: rec.title,
        description: rec.description,
        confidence: rec.priority === 'high' ? 94 : rec.priority === 'medium' ? 87 : 75,
        targetAudience: '전체 고객',
        duration: 7,
        expectedResults: {
          revenueIncrease: rec.expected_impact?.revenue_increase || 0,
          conversionIncrease: 2.1,
          roi: rec.priority === 'high' ? 312 : rec.priority === 'medium' ? 187 : 120,
        },
        priority: rec.priority,
      }));
  }, [recommendations]);

  // ROI 트렌드 데이터
  const roiTrendData = useMemo(() => {
    if (!appliedData?.measurements.length) {
      return [
        { date: '11/1', expectedROI: 150, actualROI: 145 },
        { date: '11/15', expectedROI: 180, actualROI: 195 },
        { date: '11/30', expectedROI: 280, actualROI: 312 },
        { date: '12/7', expectedROI: 245, actualROI: 198 },
      ];
    }
    return appliedData.measurements.slice(0, 10).map((m: any) => ({
      date: new Date(m.measured_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      expectedROI: 200,
      actualROI: m.actual_revenue_change ? (m.actual_revenue_change / (m.baseline_revenue || 1)) * 100 : 0,
    }));
  }, [appliedData]);

  const handleApply = async (id: string) => {
    await applyRecommendation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI 의사결정 허브
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          데이터 기반 예측 → 최적화 → 추천 → 실행 → 측정
        </p>
      </div>

      {/* 진행 중인 전략 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            진행 중인 전략
            <Badge variant="secondary">{activeStrategies.length}</Badge>
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" />
            새 전략
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      실행 중
                    </Badge>
                    <span className="font-medium truncate">{strategy.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>D+{strategy.daysActive}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      예상 ROI: {strategy.expectedROI}%
                      <ArrowRight className="w-3 h-3" />
                      <span className={cn(
                        'font-medium',
                        strategy.currentROI >= strategy.expectedROI ? 'text-green-500' : 'text-yellow-500'
                      )}>
                        현재: {strategy.currentROI}%
                      </span>
                      {strategy.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {strategy.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-xs">
                  상세보기
                </Button>
              </div>
              <Progress value={strategy.progress} className="h-1.5 mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* 1단계: 예측 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
            1
          </div>
          <h3 className="text-lg font-semibold">예측 (Predict)</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                수요 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">다음 7일 예상 매출</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(demandForecast.predictedRevenue)}
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-3 h-3" />
                전주 대비 +{demandForecast.percentChange}%
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                방문자 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">다음 7일 예상 방문</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visitorForecast.predictedVisitors.toLocaleString()}명
              </div>
              <div className="flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="w-3 h-3" />
                전주 대비 +{visitorForecast.percentChange}%
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                시즌 트렌드
              </CardTitle>
              <p className="text-xs text-muted-foreground">계절성 분석</p>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">12월 성수기</div>
              <p className="text-sm text-muted-foreground">예상 피크: 12/20-25</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-red-500/50">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-bl-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                리스크 예측
              </CardTitle>
              <p className="text-xs text-muted-foreground">위험 요소</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">높음</Badge>
                <span className="text-sm">2건</span>
              </div>
              <p className="text-sm text-muted-foreground">재고 부족 위험: 3품목</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* 2단계: 최적화 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
            2
          </div>
          <h3 className="text-lg font-semibold">최적화 (Optimize)</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded bg-yellow-500/20">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </div>
                가격 최적화
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">분석 대상</p>
                  <p className="text-lg font-bold">{priceOptimization.totalProducts}개</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">최적화 가능</p>
                  <p className="text-lg font-bold text-yellow-500">{priceOptimization.optimizableCount}개</p>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">잠재 수익 증가</span>
                </div>
                <p className="text-xl font-bold text-green-500 mt-1">
                  +{priceOptimization.potentialRevenueIncreasePercent}%
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">상세 보기</Button>
                <Button size="sm" className="flex-1 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  적용
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded bg-green-500/20">
                  <Package className="h-4 w-4 text-green-500" />
                </div>
                재고 최적화
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">분석 대상</p>
                  <p className="text-lg font-bold">{inventoryOptimization.totalItems}개</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-xs text-muted-foreground">발주 추천</p>
                  <p className="text-lg font-bold text-green-500">{inventoryOptimization.orderRecommendations}건</p>
                </div>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">품절 방지</p>
                <p className="text-xl font-bold text-red-500">{inventoryOptimization.stockoutPrevention}건</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">상세 보기</Button>
                <Button size="sm" className="flex-1 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  적용
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* 3단계: 추천 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
            3
          </div>
          <h3 className="text-lg font-semibold">추천 전략 (Recommend)</h3>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  이번 주 AI 추천 전략
                </CardTitle>
                <CardDescription className="mt-1">
                  데이터 분석 기반 최적 전략 추천
                </CardDescription>
              </div>
              <Badge variant="outline">신뢰도 기준</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategyRecommendations.length > 0 ? (
              strategyRecommendations.map((strategy) => (
                <div
                  key={strategy.id}
                  className={cn(
                    'p-4 rounded-lg border border-l-4 transition-all hover:shadow-md',
                    strategy.rank === 1
                      ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                      : strategy.rank === 2
                      ? 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20'
                      : 'border-l-orange-600 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <Badge className={cn(
                        'text-xs font-bold',
                        strategy.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        strategy.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                        'bg-orange-600/20 text-orange-600'
                      )}>
                        {strategy.rank}위
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{strategy.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{strategy.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      신뢰도 {strategy.confidence}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {strategy.targetAudience}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {strategy.duration}일
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3 bg-background/50 rounded-lg mb-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">추가 매출</p>
                      <p className="text-sm font-bold text-green-500">
                        +{formatCurrency(strategy.expectedResults.revenueIncrease)}
                      </p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-xs text-muted-foreground">전환율 증가</p>
                      <p className="text-sm font-bold text-blue-500">
                        +{strategy.expectedResults.conversionIncrease}%p
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">예상 ROI</p>
                      <p className="text-sm font-bold text-purple-500">
                        {strategy.expectedResults.roi}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => navigate('/studio')}>
                      <FlaskConical className="w-3 h-3" />
                      시뮬레이션
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Settings className="w-3 h-3" />
                      상세 설정
                    </Button>
                    <Button size="sm" className="flex-1 gap-1" onClick={() => handleApply(strategy.id)}>
                      <Play className="w-3 h-3" />
                      실행하기
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>추천 전략을 분석 중입니다</p>
                <p className="text-sm mt-1">충분한 데이터가 수집되면 AI가 전략을 추천합니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 4단계: 실행 - 생략 (진행 중인 전략에서 표시) */}

      {/* 5단계: 측정 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
            5
          </div>
          <h3 className="text-lg font-semibold">ROI 측정 (Measure)</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* 성과 테이블 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                전략 성과 요약
              </CardTitle>
              <CardDescription>최근 30일 기준</CardDescription>
            </CardHeader>
            <CardContent>
              {appliedData?.measurements && appliedData.measurements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">기간</th>
                        <th className="text-right py-2 px-2 font-medium">변화량</th>
                        <th className="text-right py-2 px-2 font-medium">변화율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliedData.measurements.slice(0, 5).map((m: any) => {
                        const change = m.actual_revenue_change || 0;
                        const changePercent = m.baseline_revenue
                          ? (change / m.baseline_revenue) * 100
                          : 0;

                        return (
                          <tr key={m.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-2">{m.period_days}일</td>
                            <td className={cn(
                              "py-2 px-2 text-right font-medium",
                              change >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </td>
                            <td className={cn(
                              "py-2 px-2 text-right",
                              changePercent >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground text-sm">
                  측정된 성과가 없습니다
                </div>
              )}
            </CardContent>
          </Card>

          {/* ROI 트렌드 차트 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                성과 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={roiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(0)}%`]} />
                  <Line
                    type="monotone"
                    dataKey="expectedROI"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="예상"
                  />
                  <Line
                    type="monotone"
                    dataKey="actualROI"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="실제"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI 학습 인사이트 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              AI 학습 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">&quot;할인 프로모션&quot;이 &quot;런칭 프로모션&quot;보다 평균 45% 높은 ROI</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>데이터 포인트: 24개</span>
                  <span>신뢰도: 92%</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">최적 프로모션 기간: 5-7일</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>데이터 포인트: 18개</span>
                  <span>신뢰도: 85%</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">타겟팅 전략이 전체 대상보다 ROI 23% 높음</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>데이터 포인트: 15개</span>
                  <span>신뢰도: 88%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
