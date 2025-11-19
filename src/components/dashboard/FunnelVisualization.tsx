import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface FunnelData {
  funnel_entry: number;
  funnel_browse: number;
  funnel_fitting: number;
  funnel_purchase: number;
  funnel_return: number;
}

interface Props {
  data: FunnelData;
}

export function FunnelVisualization({ data }: Props) {
  const stages = [
    { label: "유입", count: data.funnel_entry, color: "bg-blue-500" },
    { label: "체류", count: data.funnel_browse, color: "bg-green-500" },
    { label: "피팅", count: data.funnel_fitting, color: "bg-yellow-500" },
    { label: "구매", count: data.funnel_purchase, color: "bg-orange-500" },
    { label: "재방문", count: data.funnel_return, color: "bg-purple-500" },
  ];

  const maxCount = data.funnel_entry;

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle>고객 퍼널</CardTitle>
        <CardDescription>유입부터 재방문까지의 고객 여정</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const conversionRate = index > 0 && stages[index - 1].count > 0
              ? ((stage.count / stages[index - 1].count) * 100).toFixed(1)
              : '100.0';

            return (
              <div key={stage.label} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                {/* 퍼널 단계 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stage.count.toLocaleString()}명</div>
                    {index > 0 && (
                      <div className="text-xs text-muted-foreground">
                        전환율: {conversionRate}%
                      </div>
                    )}
                  </div>
                </div>

                {/* 퍼널 바 */}
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-3 text-white text-sm font-medium`}
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage.toFixed(0)}%
                  </div>
                </div>

                {/* 화살표 (마지막 단계 제외) */}
                {index < stages.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 요약 통계 */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.funnel_entry > 0 ? ((data.funnel_purchase / data.funnel_entry) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">전체 전환율</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.funnel_purchase > 0 ? ((data.funnel_return / data.funnel_purchase) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">재방문율</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
