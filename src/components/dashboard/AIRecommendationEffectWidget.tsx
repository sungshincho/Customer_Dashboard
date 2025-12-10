/**
 * AIRecommendationEffectWidget.tsx
 *
 * AI 추천 적용 후 ROI 측정 결과를 표시하는 위젯
 * - 총 매출 영향 표시
 * - 적용된 추천 목록 및 개별 ROI
 * - 측정 대기 중인 추천 표시
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useROISummary, useRecommendationApplications, usePendingMeasurements, useCompleteROIMeasurement, RECOMMENDATION_TYPE_LABELS, STATUS_LABELS } from "@/hooks/useROITracking";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function AIRecommendationEffectWidget() {
  const { selectedStore } = useSelectedStore();
  const { data: roiSummary, isLoading: summaryLoading } = useROISummary(selectedStore?.id);
  const { data: applications = [] } = useRecommendationApplications(selectedStore?.id);
  const pendingMeasurements = usePendingMeasurements(selectedStore?.id);
  const completeROI = useCompleteROIMeasurement();

  // 측정 대기 중 또는 측정 중인 항목
  const appliedApplications = applications.filter(app => app.status === 'applied');
  const completedApplications = applications.filter(app => app.status === 'completed');

  // 측정 완료 핸들러
  const handleCompleteMeasurement = async (applicationId: string) => {
    try {
      await completeROI.mutateAsync(applicationId);
    } catch (error) {
      console.error('ROI 측정 실패:', error);
    }
  };

  // 데이터가 없는 경우
  if (!roiSummary && applications.length === 0) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI 추천 효과
          </CardTitle>
          <CardDescription>
            추천을 적용하면 7일 후 ROI를 측정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>아직 적용된 추천이 없습니다</p>
            <p className="text-sm mt-1">AI 추천을 적용하면 효과를 측정할 수 있습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI 추천 효과
        </CardTitle>
        <CardDescription>
          적용된 추천의 ROI 측정 결과
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총 효과 요약 */}
        {roiSummary && roiSummary.completedMeasurements > 0 && (
          <div className={cn(
            "p-4 rounded-lg",
            (roiSummary.avgROI || 0) > 0
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-red-50 dark:bg-red-950/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">총 매출 영향</span>
              <span className={cn(
                "text-xl font-bold",
                (roiSummary.avgROI || 0) > 0 ? "text-green-600" : "text-red-600"
              )}>
                {(roiSummary.avgROI || 0) > 0 ? '+' : ''}{(roiSummary.avgROI || 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{roiSummary.completedMeasurements}개 추천 측정 완료</span>
              <span>{roiSummary.positiveImpactRate}% 긍정적 효과</span>
            </div>
            {(roiSummary.totalEstimatedAnnualImpact || 0) > 0 && (
              <div className="mt-2 pt-2 border-t text-xs">
                <span className="text-muted-foreground">예상 연간 영향: </span>
                <span className="font-semibold text-green-600">
                  +₩{(roiSummary.totalEstimatedAnnualImpact || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 측정 대기 중인 추천 */}
        {pendingMeasurements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              측정 준비 완료 ({pendingMeasurements.length}개)
            </h4>
            {pendingMeasurements.map(app => (
              <div
                key={app.id}
                className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{app.recommendation_summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {RECOMMENDATION_TYPE_LABELS[app.recommendation_type] || app.recommendation_type}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className="ml-2 gap-1"
                    onClick={() => handleCompleteMeasurement(app.id)}
                    disabled={completeROI.isPending}
                  >
                    {completeROI.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <BarChart3 className="h-3 w-3" />
                    )}
                    ROI 측정
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 측정 중인 추천 */}
        {appliedApplications.filter(app => !pendingMeasurements.find(p => p.id === app.id)).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              측정 중 ({appliedApplications.filter(app => !pendingMeasurements.find(p => p.id === app.id)).length}개)
            </h4>
            {appliedApplications
              .filter(app => !pendingMeasurements.find(p => p.id === app.id))
              .slice(0, 3)
              .map(app => {
                const endDate = app.measurement_end_date ? parseISO(app.measurement_end_date) : new Date();
                const daysRemaining = differenceInDays(endDate, new Date());
                const totalDays = app.measurement_period_days || 7;
                const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

                return (
                  <div
                    key={app.id}
                    className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate flex-1">{app.recommendation_summary}</p>
                      <Badge variant="outline" className="ml-2">
                        {daysRemaining > 0 ? `${daysRemaining}일 남음` : '측정 준비'}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-1" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {app.measurement_end_date && format(parseISO(app.measurement_end_date), 'M월 d일', { locale: ko })} 측정 예정
                    </p>
                  </div>
                );
              })}
          </div>
        )}

        {/* 완료된 측정 결과 */}
        {completedApplications.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              측정 완료 ({completedApplications.length}개)
            </h4>
            {completedApplications.slice(0, 3).map(app => {
              // ROI 정보는 roi_measurements에서 가져와야 하지만,
              // 간단히 표시하기 위해 기본 정보만 표시
              return (
                <div
                  key={app.id}
                  className="p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{app.recommendation_summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {RECOMMENDATION_TYPE_LABELS[app.recommendation_type] || app.recommendation_type}
                        {app.applied_at && ` • ${format(parseISO(app.applied_at), 'M월 d일', { locale: ko })} 적용`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      완료
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 유형별 성과 요약 */}
        {roiSummary && Object.keys(roiSummary.byType || {}).length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">유형별 평균 ROI</h4>
            <div className="space-y-2">
              {Object.entries(roiSummary.byType).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {RECOMMENDATION_TYPE_LABELS[type as keyof typeof RECOMMENDATION_TYPE_LABELS] || type}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{data.count}건</span>
                    <span className={cn(
                      "font-medium",
                      data.avgROI > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {data.avgROI > 0 ? '+' : ''}{data.avgROI.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
