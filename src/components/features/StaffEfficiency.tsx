import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Award, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useState } from "react";
import { STAFF_DATA, STAFF_WEEKLY_DATA } from "@/data/sampleData";

type StaffMember = typeof STAFF_DATA[number];

const staff = STAFF_DATA;
const weeklyData = STAFF_WEEKLY_DATA;

const radarData = [
  { metric: "판매", A: STAFF_DATA[0].performance, B: STAFF_DATA[1].performance },
  { metric: "고객응대", A: STAFF_DATA[0].customerSatisfaction, B: STAFF_DATA[1].customerSatisfaction },
  { metric: "상품지식", A: STAFF_DATA[0].productKnowledge, B: STAFF_DATA[1].productKnowledge },
  { metric: "효율성", A: STAFF_DATA[0].efficiency, B: STAFF_DATA[1].efficiency },
  { metric: "만족도", A: STAFF_DATA[0].rating * 20, B: STAFF_DATA[1].rating * 20 },
];

export const StaffEfficiency = () => {
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

  const totalSales = staff.reduce((sum, s) => sum + s.sales, 0);
  const totalCustomers = staff.reduce((sum, s) => sum + s.customers, 0);
  const avgPerformance = staff.reduce((sum, s) => sum + s.performance, 0) / staff.length;
  const topPerformer = staff.reduce((max, s) => (s.performance > max.performance ? s : max));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">팀 총 매출</div>
          <div className="text-2xl font-bold">₩{(totalSales / 1000000).toFixed(0)}M</div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            +12%
          </Badge>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">응대 고객</div>
          <div className="text-2xl font-bold">{totalCustomers}명</div>
          <div className="text-xs text-muted-foreground">이번 주</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">평균 성과</div>
          <div className="text-2xl font-bold text-primary">{avgPerformance.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">목표 대비</div>
        </Card>

        <Card className="glass p-4 space-y-2 border-primary/30">
          <div className="text-sm text-muted-foreground">이달의 MVP</div>
          <div className="text-2xl font-bold">{topPerformer.name.split("")[0]}OO</div>
          <Badge className="gap-1">
            <Award className="w-3 h-3" />
            {topPerformer.performance}%
          </Badge>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">직원별 성과</h4>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {staff.map((member) => (
              <Card
                key={member.id}
                className={`glass p-4 space-y-3 transition-all ${
                  selectedStaff === member.id || selectedStaff === "all"
                    ? "opacity-100"
                    : "opacity-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </div>
                  </div>
                  <Badge
                    variant={member.performance >= 90 ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {member.performance >= 90 && <Award className="w-3 h-3" />}
                    {member.performance}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">매출</div>
                    <div className="font-semibold">₩{(member.sales / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">고객</div>
                    <div className="font-semibold">{member.customers}명</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">평균 응대시간</div>
                    <div className="font-semibold">{member.avgTime}분</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">만족도</div>
                    <div className="font-semibold text-amber-500">★ {member.rating}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${member.performance}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">주간 성과 추이</h5>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="김지훈" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="이서연" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
                <Line type="monotone" dataKey="박민준" stroke="hsl(262, 83%, 58%)" strokeWidth={2} />
                <Line type="monotone" dataKey="최유나" stroke="hsl(48, 96%, 53%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">역량 비교 (상위 2명)</h5>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                <Radar
                  name="김지훈"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Radar
                  name="이서연"
                  dataKey="B"
                  stroke="hsl(217, 91%, 60%)"
                  fill="hsl(217, 91%, 60%)"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">개선 제안</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">최유나:</span> 응대 시간 단축 교육 필요 (목표: 10분 이내)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">박민준:</span> 크로스셀링 기법 향상으로 객단가 증대 가능
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  <span className="font-semibold">김지훈:</span> 멘토링 역할 부여로 팀 전체 성과 향상 기대
                </span>
              </li>
            </ul>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-sm">
              <span className="font-semibold">팀 목표:</span> 이번 달 평균 성과 85% 달성 시
              전체 인센티브 +15% 지급
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
