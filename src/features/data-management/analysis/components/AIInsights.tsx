import { Card } from "@/components/ui/card";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AIInsight } from "@/types/analysis.types";

// Export for backward compatibility
export type Insight = AIInsight;

interface AIInsightsProps {
  insights: AIInsight[];
}

export const AIInsights = ({ insights }: AIInsightsProps) => {
  const getIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "recommendation":
        return <Lightbulb className="w-5 h-5 text-green-500" />;
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI 인사이트</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
            {getIcon(insight.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{insight.title}</h4>
                {insight.impact && (
                  <Badge variant={getImpactColor(insight.impact)}>
                    {insight.impact === "high" ? "높음" : insight.impact === "medium" ? "중간" : "낮음"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
