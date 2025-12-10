import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Target,
  Lightbulb,
  X,
  TrendingUp,
  Package,
  LayoutGrid,
  Users,
  Check,
  Clock,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useApplyRecommendation, RecommendationType } from "@/hooks/useROITracking";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardKPI } from "@/hooks/useDashboardKPI";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  action_category?: string;
  expected_impact?: any;
  status?: string;
}

interface Props {
  recommendations: Recommendation[];
  onDismiss: (id: string) => void;
}

const categoryIcons: Record<string, any> = {
  inventory: Package,
  layout: LayoutGrid,
  pricing: TrendingUp,
  staffing: Users,
};

const priorityColors: Record<string, string> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const priorityBorderColors: Record<string, string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
};

const typeIcons: Record<string, any> = {
  alert: AlertTriangle,
  action: Target,
  insight: Lightbulb,
};

export function AIRecommendationCard({ recommendations, onDismiss }: Props) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const { data: dashboardKPI } = useDashboardKPI(selectedStore?.id, format(new Date(), 'yyyy-MM-dd'));
  const applyRecommendation = useApplyRecommendation();

  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApply = async (rec: Recommendation) => {
    if (!selectedStore?.id || !orgId) return;

    setApplyingId(rec.id);

    try {
      // 현재 KPI를 베이스라인으로
      const currentKPIs = {
        total_revenue: dashboardKPI?.total_revenue || 0,
        total_visitors: dashboardKPI?.total_visits || 0,
        conversion_rate: dashboardKPI?.conversion_rate || 0,
        avg_transaction_value: dashboardKPI?.total_revenue && dashboardKPI?.total_purchases
          ? dashboardKPI.total_revenue / dashboardKPI.total_purchases
          : 0,
      };

      await applyRecommendation.mutateAsync({
        storeId: selectedStore.id,
        recommendationType: (rec.action_category || 'layout') as RecommendationType,
        recommendationSummary: rec.title,
        recommendationDetails: {
          description: rec.description,
          expected_impact: rec.expected_impact,
          original_id: rec.id,
        },
        measurementDays: 7,
      });

      setAppliedIds(prev => new Set(prev).add(rec.id));
    } catch (error) {
      console.error('추천 적용 실패:', error);
    } finally {
      setApplyingId(null);
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            오늘의 AI 추천
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>현재 표시할 추천이 없습니다.</p>
            <p className="text-sm mt-1">데이터가 축적되면 AI 추천이 생성됩니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          오늘의 AI 추천 ({recommendations.length}개)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const TypeIcon = typeIcons[rec.recommendation_type] || Lightbulb;
          const CategoryIcon = rec.action_category ? categoryIcons[rec.action_category] : null;
          const isApplying = applyingId === rec.id;
          const isApplied = appliedIds.has(rec.id) || rec.status === 'applied';

          return (
            <div
              key={rec.id}
              className={cn(
                "p-4 rounded-lg border border-l-4 bg-card animate-fade-in relative group",
                priorityBorderColors[rec.priority] || "border-l-gray-500"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={() => onDismiss(rec.id)}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <Badge variant={priorityColors[rec.priority] as any}>
                      {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '중간' : '낮음'}
                    </Badge>
                    {CategoryIcon && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CategoryIcon className="w-3 h-3" />
                        <span>
                          {rec.action_category === 'inventory' ? '재고' :
                           rec.action_category === 'layout' ? '레이아웃' :
                           rec.action_category === 'pricing' ? '가격' :
                           rec.action_category === 'staffing' ? '인력' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>

              {/* Impact */}
              {rec.expected_impact && (
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-xs">
                  {rec.expected_impact.revenue_increase && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-muted-foreground">예상 매출:</span>
                      <span className="font-semibold text-green-600">
                        +₩{Math.floor(rec.expected_impact.revenue_increase).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {rec.expected_impact.cvr_increase && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      <span className="text-muted-foreground">전환율:</span>
                      <span className="font-semibold text-blue-600">
                        +{rec.expected_impact.cvr_increase}%
                      </span>
                    </div>
                  )}
                  {rec.expected_impact.sales_per_sqm_increase && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-500" />
                      <span className="text-muted-foreground">매출/㎡:</span>
                      <span className="font-semibold text-purple-600">
                        +₩{Math.floor(rec.expected_impact.sales_per_sqm_increase).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t flex gap-2">
                {isApplied ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                    disabled
                  >
                    <Check className="w-4 h-4" />
                    적용됨
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleApply(rec)}
                    disabled={isApplying || !selectedStore?.id}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        적용 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        적용하기
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => onDismiss(rec.id)}
                >
                  <Clock className="w-4 h-4" />
                  나중에
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
