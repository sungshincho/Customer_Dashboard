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
  Users
} from "lucide-react";

interface Recommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  action_category?: string;
  expected_impact?: any;
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

const typeIcons: Record<string, any> = {
  alert: AlertTriangle,
  action: Target,
  insight: Lightbulb,
};

export function AIRecommendationCard({ recommendations, onDismiss }: Props) {
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

          return (
            <div
              key={rec.id}
              className="p-4 rounded-lg border bg-card animate-fade-in relative group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDismiss(rec.id)}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
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
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
