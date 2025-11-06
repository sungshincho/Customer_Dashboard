import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";

const funnelData = [
  { stage: "방문", count: 1000, rate: 100, color: "hsl(var(--primary))" },
  { stage: "관심", count: 680, rate: 68, color: "hsl(217, 91%, 60%)" },
  { stage: "체류", count: 420, rate: 42, color: "hsl(262, 83%, 58%)" },
  { stage: "구매", count: 150, rate: 15, color: "hsl(142, 76%, 36%)" },
];

const timeRanges = {
  "today": { label: "오늘", multiplier: 1 },
  "week": { label: "이번 주", multiplier: 7 },
  "month": { label: "이번 달", multiplier: 30 },
};

export const ConversionFunnel = () => {
  const [timeRange, setTimeRange] = useState<keyof typeof timeRanges>("today");

  const scaledData = funnelData.map((item) => ({
    ...item,
    count: Math.round(item.count * timeRanges[timeRange].multiplier),
  }));

  const totalRevenue = scaledData[3].count * 125000;
  const conversionRate = ((scaledData[3].count / scaledData[0].count) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">전환 퍼널 분석</h4>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as keyof typeof timeRanges)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(timeRanges).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +12%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{scaledData[0].count.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">총 방문자</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +8%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{scaledData[3].count.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">구매 고객</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <DollarSign className="w-5 h-5 text-green-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +15%
            </Badge>
          </div>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <div className="text-sm text-muted-foreground">전환율</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="flex items-center justify-between">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              +18%
            </Badge>
          </div>
          <div className="text-2xl font-bold">₩{(totalRevenue / 1000000).toFixed(0)}M</div>
          <div className="text-sm text-muted-foreground">총 매출</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h5 className="text-sm font-semibold mb-4">퍼널 시각화</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scaledData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="stage" type="category" stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {scaledData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-6 space-y-4">
          <h5 className="text-sm font-semibold">단계별 전환율</h5>
          {scaledData.map((item, index) => (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {item.count.toLocaleString()} ({item.rate}%)
                  </span>
                  {index > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <TrendingDown className="w-3 h-3" />
                      -{(100 - (item.count / scaledData[index - 1].count) * 100).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.rate}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-border space-y-2">
            <h6 className="text-xs font-semibold text-muted-foreground">최적화 제안</h6>
            <ul className="text-xs space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>방문→관심 단계에서 32% 이탈. 입구 디스플레이 개선 권장</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>체류→구매 전환율 낮음. 결제 프로세스 간소화 필요</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
