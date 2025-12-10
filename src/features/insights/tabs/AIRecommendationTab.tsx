/**
 * AIRecommendationTab.tsx
 *
 * 인사이트 허브 - AI 추천 탭
 * AI 추천 목록, 적용 현황, ROI 분석
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  Box,
  ArrowRight,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { formatCurrency } from '../components';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useApplyRecommendation } from '@/hooks/useROITracking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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

  // 우선순위별 분류
  const priorityGroups = useMemo(() => {
    const high = recommendations.filter(r => r.priority === 'high' && r.status === 'pending');
    const medium = recommendations.filter(r => r.priority === 'medium' && r.status === 'pending');
    const low = recommendations.filter(r => r.priority === 'low' && r.status === 'pending');
    return { high, medium, low };
  }, [recommendations]);

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
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              대기 중인 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending}개</div>
            <p className="text-xs text-muted-foreground">적용 가능한 추천</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              적용 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.applied}개</div>
            <p className="text-xs text-muted-foreground">이번 달 적용</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              총 ROI 효과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.totalROI >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.totalROI >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.totalROI))}
            </div>
            <p className="text-xs text-muted-foreground">적용된 추천의 매출 증가</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              평균 ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.avgROI >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.avgROI >= 0 ? '+' : ''}{formatCurrency(Math.abs(summary.avgROI))}
            </div>
            <p className="text-xs text-muted-foreground">추천당 평균 효과</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 영역 */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            대기 중 ({summary.pending})
          </TabsTrigger>
          <TabsTrigger value="applied" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            적용 완료 ({summary.applied})
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            ROI 분석
          </TabsTrigger>
        </TabsList>

        {/* 대기 중인 추천 */}
        <TabsContent value="pending" className="space-y-6">
          {/* 높은 우선순위 */}
          {priorityGroups.high.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Sparkles className="h-5 w-5" />
                  높은 우선순위
                </CardTitle>
                <CardDescription>즉시 적용을 권장하는 추천</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorityGroups.high.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApply={() => handleApply(rec.id)}
                    onNavigate={() => navigate('/studio')}
                    isApplying={applyRecommendation.isPending}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* 중간 우선순위 */}
          {priorityGroups.medium.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Sparkles className="h-5 w-5" />
                  중간 우선순위
                </CardTitle>
                <CardDescription>검토 후 적용을 권장</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorityGroups.medium.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApply={() => handleApply(rec.id)}
                    onNavigate={() => navigate('/studio')}
                    isApplying={applyRecommendation.isPending}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* 낮은 우선순위 */}
          {priorityGroups.low.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                  낮은 우선순위
                </CardTitle>
                <CardDescription>참고용 추천</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorityGroups.low.map(rec => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onApply={() => handleApply(rec.id)}
                    onNavigate={() => navigate('/studio')}
                    isApplying={applyRecommendation.isPending}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {summary.pending === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">대기 중인 추천이 없습니다</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 새로운 인사이트를 발견하면 알려드립니다
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 적용 완료 */}
        <TabsContent value="applied" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>적용된 추천</CardTitle>
              <CardDescription>최근 적용한 AI 추천 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {appliedData?.applications && appliedData.applications.length > 0 ? (
                <div className="space-y-4">
                  {appliedData.applications.map((app: any) => (
                    <div key={app.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{app.ai_recommendations?.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {app.ai_recommendations?.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          적용일: {new Date(app.applied_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <Badge variant={app.status === 'measuring' ? 'secondary' : 'default'}>
                        {app.status === 'measuring' ? 'ROI 측정 중' : app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  적용된 추천이 없습니다
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI 분석 */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI 측정 결과</CardTitle>
              <CardDescription>완료된 ROI 측정 결과</CardDescription>
            </CardHeader>
            <CardContent>
              {appliedData?.measurements && appliedData.measurements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">측정 기간</th>
                        <th className="text-right py-3 px-4">기준 매출</th>
                        <th className="text-right py-3 px-4">실제 매출</th>
                        <th className="text-right py-3 px-4">변화량</th>
                        <th className="text-right py-3 px-4">변화율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliedData.measurements.map((m: any) => {
                        const change = (m.actual_revenue_change || 0);
                        const changePercent = m.baseline_revenue
                          ? (change / m.baseline_revenue) * 100
                          : 0;

                        return (
                          <tr key={m.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              {m.period_days}일 ({new Date(m.measured_at).toLocaleDateString('ko-KR')})
                            </td>
                            <td className="text-right py-3 px-4">
                              ₩{(m.baseline_revenue || 0).toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4">
                              ₩{(m.actual_revenue || 0).toLocaleString()}
                            </td>
                            <td className={cn(
                              "text-right py-3 px-4 font-medium",
                              change >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {change >= 0 ? '+' : ''}₩{change.toLocaleString()}
                            </td>
                            <td className={cn(
                              "text-right py-3 px-4",
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
                <div className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>완료된 ROI 측정이 없습니다</p>
                  <p className="text-sm mt-1">
                    추천을 적용하면 7일 후 자동으로 ROI가 측정됩니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 추천 카드 컴포넌트
function RecommendationCard({
  recommendation,
  onApply,
  onNavigate,
  isApplying,
}: {
  recommendation: any;
  onApply: () => void;
  onNavigate: () => void;
  isApplying: boolean;
}) {
  return (
    <div className={cn(
      'p-4 rounded-lg border border-l-4',
      recommendation.priority === 'high'
        ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
        : recommendation.priority === 'medium'
        ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
        : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{recommendation.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
          {recommendation.expected_impact && (
            <p className="text-sm text-green-600 mt-2">
              예상 효과: 매출 +{recommendation.expected_impact.revenue_increase?.toLocaleString() || '?'}원
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
          >
            적용하기
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={onNavigate}>
            <Box className="h-3 w-3" />
            3D 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
