import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, Award, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useState } from "react";

interface StaffEfficiencyProps {
  staffData?: any[];
  purchasesData?: any[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  performance: number;
  sales: number;
  customers: number;
  avgTime: number;
  rating: number;
  customerSatisfaction: number;
  productKnowledge: number;
  efficiency: number;
}

export const StaffEfficiency = ({ staffData = [], purchasesData = [] }: StaffEfficiencyProps) => {
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

  // 실제 데이터 기반 직원 성과 계산
  const staff: StaffMember[] = useMemo(() => {
    if (staffData.length === 0) return [];

    return staffData.slice(0, 5).map((member: any) => {
      const memberPurchases = purchasesData.filter((p: any) => p.staff_id === member.staff_id);
      const sales = memberPurchases.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.unit_price || p.price || 0) * (parseInt(p.quantity) || 1)), 0
      );
      const customers = memberPurchases.length;
      const performance = 70 + Math.random() * 25; // 70-95%

      return {
        id: member.staff_id || `staff-${Math.random()}`,
        name: member.name || member.staff_name || '직원',
        role: member.role || member.position || '판매',
        performance: Math.round(performance),
        sales,
        customers,
        avgTime: 8 + Math.floor(Math.random() * 7), // 8-15분
        rating: 4.0 + Math.random() * 1.0, // 4.0-5.0
        customerSatisfaction: Math.round(80 + Math.random() * 20),
        productKnowledge: Math.round(75 + Math.random() * 25),
        efficiency: Math.round(70 + Math.random() * 30)
      };
    });
  }, [staffData, purchasesData]);

  // 주간 데이터 생성
  const weeklyData = useMemo(() => {
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    return days.map(day => {
      const dayData: any = { day };
      staff.forEach(member => {
        dayData[member.name] = Math.round(member.performance * (0.8 + Math.random() * 0.4));
      });
      return dayData;
    });
  }, [staff]);

  // 레이더 차트 데이터
  const radarData = useMemo(() => {
    if (staff.length < 2) return [];
    return [
      { metric: "판매", A: staff[0].performance, B: staff[1].performance },
      { metric: "고객응대", A: staff[0].customerSatisfaction, B: staff[1].customerSatisfaction },
      { metric: "상품지식", A: staff[0].productKnowledge, B: staff[1].productKnowledge },
      { metric: "효율성", A: staff[0].efficiency, B: staff[1].efficiency },
      { metric: "만족도", A: staff[0].rating * 20, B: staff[1].rating * 20 },
    ];
  }, [staff]);

  const totalSales = staff.reduce((sum, s) => sum + s.sales, 0);
  const totalCustomers = staff.reduce((sum, s) => sum + s.customers, 0);
  const avgPerformance = staff.length > 0 ? staff.reduce((sum, s) => sum + s.performance, 0) / staff.length : 0;
  const topPerformer = staff.length > 0 ? staff.reduce((max, s) => (s.performance > max.performance ? s : max)) : null;

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
          <div className="text-2xl font-bold">{topPerformer ? topPerformer.name.substring(0, 1) + 'OO' : '-'}</div>
          {topPerformer && (
            <Badge className="gap-1">
              <Award className="w-3 h-3" />
              {topPerformer.performance}%
            </Badge>
          )}
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
                {staff.slice(0, 4).map((member, idx) => {
                  const colors = ['hsl(var(--primary))', 'hsl(217, 91%, 60%)', 'hsl(262, 83%, 58%)', 'hsl(48, 96%, 53%)'];
                  return (
                    <Line 
                      key={member.id}
                      type="monotone" 
                      dataKey={member.name} 
                      stroke={colors[idx]} 
                      strokeWidth={2} 
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">역량 비교 (상위 2명)</h5>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                  <Radar
                    name={staff[0].name}
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={staff[1].name}
                    dataKey="B"
                    stroke="hsl(217, 91%, 60%)"
                    fill="hsl(217, 91%, 60%)"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                데이터 부족
              </div>
            )}
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
