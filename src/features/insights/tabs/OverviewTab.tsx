/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * 업계 표준 용어 기반 KPI (Footfall, Unique Visitors, Revenue, Conversion)
 * 퍼널 차트, 목표 달성률, AI 추천 효과, 오늘의 AI 인사이트
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';
import { AIRecommendationEffectWidget } from '@/components/dashboard/AIRecommendationEffectWidget';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Box,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { MetricCard, FunnelChart, formatCurrency, formatPercent } from '../components';

export function OverviewTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { data: metrics, isLoading } = useInsightMetrics();
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  // 우선순위 높은 추천
  const topRecommendations = recommendations?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI 카드 - 표준 용어 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          labelEn="Footfall"
          label="총 입장"
          value={metrics?.footfall.toLocaleString() || '0'}
          subLabel="기간 내 총 입장 횟수"
          change={metrics?.changes.footfall}
        />
        <MetricCard
          icon={<UserCheck className="h-5 w-5" />}
          labelEn="Unique Visitors"
          label="순 방문객"
          value={metrics?.uniqueVisitors.toLocaleString() || '0'}
          subLabel={metrics?.visitFrequency ? `평균 ${metrics.visitFrequency.toFixed(1)}회 방문` : undefined}
          change={metrics?.changes.uniqueVisitors}
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          labelEn="Revenue"
          label="총 매출"
          value={formatCurrency(metrics?.revenue || 0, 'man')}
          subLabel={metrics?.atv ? `객단가 ${formatCurrency(metrics.atv, 'chun')}` : undefined}
          change={metrics?.changes.revenue}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          labelEn="Conversion"
          label="구매 전환율"
          value={formatPercent(metrics?.conversionRate || 0)}
          subLabel={`${metrics?.transactions.toLocaleString() || 0}건 거래`}
          change={metrics?.changes.conversionRate}
          changeUnit="%p"
        />
      </div>

      {/* 방문 빈도 안내 */}
      {metrics?.visitFrequency && metrics.visitFrequency > 1 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">평균 방문 빈도 {metrics.visitFrequency.toFixed(1)}회:</span>{' '}
            Footfall {metrics.footfall.toLocaleString()} / Unique Visitors {metrics.uniqueVisitors.toLocaleString()}
          </p>
        </div>
      )}

      {/* 고객 여정 퍼널 */}
      {metrics?.funnel && (
        <FunnelChart data={metrics.funnel} />
      )}

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
    </div>
  );
}
