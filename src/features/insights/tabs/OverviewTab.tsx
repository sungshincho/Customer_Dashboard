/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * KPI 카드, 목표 달성률, AI 추천 효과, 오늘의 AI 인사이트
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';
import { AIRecommendationEffectWidget } from '@/components/dashboard/AIRecommendationEffectWidget';
import { FunnelVisualization } from '@/components/dashboard/FunnelVisualization';
import {
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Box,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useKPIsByDateRange } from '@/hooks/useDashboardKPI';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function OverviewTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();

  // 전역 기간 필터를 사용하여 KPI 데이터 조회
  const { data: kpiData } = useKPIsByDateRange(
    selectedStore?.id,
    dateRange.startDate,
    dateRange.endDate
  );
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  // KPI 카드 데이터 - 기간 내 집계
  const stats = useMemo(() => {
    if (!kpiData || kpiData.length === 0) {
      return [
        { title: '방문자', value: '0', change: '데이터 없음', changeType: 'neutral' as const, icon: Users },
        { title: '매출', value: '₩0', change: '데이터 없음', changeType: 'neutral' as const, icon: DollarSign },
        { title: '전환율', value: '0%', change: '데이터 없음', changeType: 'neutral' as const, icon: TrendingUp },
        { title: '객단가', value: '₩0', change: '데이터 없음', changeType: 'neutral' as const, icon: ShoppingCart },
      ];
    }

    // 기간 내 총합 계산
    const totalVisits = kpiData.reduce((sum, d) => sum + (d.total_visits || 0), 0);
    const totalRevenue = kpiData.reduce((sum, d) => sum + (d.total_revenue || 0), 0);
    const totalPurchases = kpiData.reduce((sum, d) => sum + (d.total_purchases || 0), 0);
    const avgConversionRate = kpiData.reduce((sum, d) => sum + (d.conversion_rate || 0), 0) / kpiData.length;
    const avgBasket = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    // 전반기 vs 후반기 비교로 변화율 계산
    const midPoint = Math.floor(kpiData.length / 2);
    let visitsChange = 0, revenueChange = 0, conversionChange = 0;

    if (kpiData.length >= 2 && midPoint > 0) {
      const firstHalf = kpiData.slice(0, midPoint);
      const secondHalf = kpiData.slice(midPoint);

      const firstVisits = firstHalf.reduce((s, d) => s + (d.total_visits || 0), 0);
      const secondVisits = secondHalf.reduce((s, d) => s + (d.total_visits || 0), 0);
      const firstRevenue = firstHalf.reduce((s, d) => s + (d.total_revenue || 0), 0);
      const secondRevenue = secondHalf.reduce((s, d) => s + (d.total_revenue || 0), 0);
      const firstConversion = firstHalf.reduce((s, d) => s + (d.conversion_rate || 0), 0) / firstHalf.length;
      const secondConversion = secondHalf.reduce((s, d) => s + (d.conversion_rate || 0), 0) / secondHalf.length;

      if (firstVisits > 0) visitsChange = ((secondVisits - firstVisits) / firstVisits) * 100;
      if (firstRevenue > 0) revenueChange = ((secondRevenue - firstRevenue) / firstRevenue) * 100;
      conversionChange = secondConversion - firstConversion;
    }

    const periodLabel = kpiData.length > 1 ? `${kpiData.length}일` : '오늘';

    return [
      {
        title: '방문자',
        value: totalVisits.toLocaleString(),
        change: visitsChange !== 0 ? `${visitsChange > 0 ? '+' : ''}${visitsChange.toFixed(1)}%` : periodLabel,
        changeType: visitsChange >= 0 ? 'positive' as const : 'negative' as const,
        icon: Users,
      },
      {
        title: '매출',
        value: `₩${(totalRevenue / 10000).toFixed(0)}만`,
        change: revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%` : periodLabel,
        changeType: revenueChange >= 0 ? 'positive' as const : 'negative' as const,
        icon: DollarSign,
      },
      {
        title: '전환율',
        value: `${avgConversionRate.toFixed(1)}%`,
        change: conversionChange !== 0 ? `${conversionChange > 0 ? '+' : ''}${conversionChange.toFixed(1)}%p` : periodLabel,
        changeType: conversionChange >= 0 ? 'positive' as const : 'negative' as const,
        icon: TrendingUp,
      },
      {
        title: '객단가',
        value: `₩${Math.round(avgBasket / 1000)}천`,
        change: '평균',
        changeType: 'neutral' as const,
        icon: ShoppingCart,
      },
    ];
  }, [kpiData]);

  // 우선순위 높은 추천
  const topRecommendations = recommendations?.slice(0, 2) || [];

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* 목표 달성률 & AI 추천 효과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GoalProgressWidget />
        <AIRecommendationEffectWidget />
      </div>

      {/* 오늘의 AI 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            오늘의 AI 인사이트
          </CardTitle>
          <CardDescription>
            AI가 분석한 주요 인사이트와 추천 액션
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topRecommendations.length > 0 ? (
            topRecommendations.map((rec) => (
              <div
                key={rec.id}
                className={cn(
                  'p-4 rounded-lg border border-l-4',
                  rec.priority === 'high'
                    ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
                    : rec.priority === 'medium'
                    ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                    : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}
                      </Badge>
                      <span className="font-semibold">{rec.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    {rec.expected_impact && (
                      <p className="text-sm text-green-600 mt-2">
                        예상 효과: 매출 +{rec.expected_impact.revenue_increase?.toLocaleString() || '?'}원
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" className="gap-1">
                      <BarChart3 className="h-3 w-3" />
                      분석
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/studio')}>
                      <Box className="h-3 w-3" />
                      3D
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>AI 인사이트가 없습니다</p>
              <p className="text-sm mt-1">데이터가 축적되면 AI가 인사이트를 생성합니다</p>
            </div>
          )}

          {topRecommendations.length > 0 && (
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => navigate('/insights?tab=ai')}
            >
              모든 AI 추천 보기
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 고객 퍼널 - 기간 집계 */}
      {kpiData && kpiData.length > 0 && (
        <FunnelVisualization
          data={{
            funnel_entry: kpiData.reduce((sum, d) => sum + (d.funnel_entry || 0), 0),
            funnel_browse: kpiData.reduce((sum, d) => sum + (d.funnel_browse || 0), 0),
            funnel_fitting: kpiData.reduce((sum, d) => sum + (d.funnel_fitting || 0), 0),
            funnel_purchase: kpiData.reduce((sum, d) => sum + (d.funnel_purchase || 0), 0),
            funnel_return: kpiData.reduce((sum, d) => sum + (d.funnel_return || 0), 0),
          }}
        />
      )}
    </div>
  );
}
