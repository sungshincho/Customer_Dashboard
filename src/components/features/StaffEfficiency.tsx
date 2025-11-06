import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Clock, TrendingUp, Award } from "lucide-react";

const staffData = [
  { name: "김지연", role: "매니저", efficiency: 95, sales: 12, hours: 8, rating: 4.9 },
  { name: "이수현", role: "시니어", efficiency: 88, sales: 10, hours: 8, rating: 4.7 },
  { name: "박민지", role: "주니어", efficiency: 82, sales: 8, hours: 7, rating: 4.5 },
  { name: "최윤아", role: "시니어", efficiency: 90, sales: 11, hours: 8, rating: 4.8 },
  { name: "정하나", role: "주니어", efficiency: 76, sales: 6, hours: 6, rating: 4.3 },
];

export function StaffEfficiency() {
  const avgEfficiency = Math.round(staffData.reduce((sum, s) => sum + s.efficiency, 0) / staffData.length);
  const totalSales = staffData.reduce((sum, s) => sum + s.sales, 0);
  const topStaff = staffData.reduce((best, current) => 
    current.efficiency > best.efficiency ? current : best
  );

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">직원 효율성 분석</CardTitle>
        <CardDescription>실시간 성과 및 근무 최적화</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">근무 인원</p>
            <p className="text-xl font-bold gradient-text">{staffData.length}명</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">평균 효율</p>
            <p className="text-xl font-bold text-primary animate-glow-pulse">{avgEfficiency}%</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Award className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 판매</p>
            <p className="text-xl font-bold gradient-text">{totalSales}건</p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-primary animate-glow-pulse" />
            <div>
              <p className="font-semibold gradient-text">오늘의 최우수 직원</p>
              <p className="text-sm text-muted-foreground">
                {topStaff.name} ({topStaff.role}) - {topStaff.efficiency}% 효율
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {staffData.map((staff, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {staff.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground">{staff.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{staff.efficiency}%</p>
                  <p className="text-xs text-muted-foreground">효율</p>
                </div>
              </div>
              <Progress value={staff.efficiency} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {staff.hours}시간
                  </span>
                  <span>판매: {staff.sales}건</span>
                </div>
                <span className="flex items-center gap-1">
                  평점: {staff.rating} ⭐
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-border">
          <p className="text-sm font-medium text-muted-foreground">AI 권장사항</p>
          <p className="text-sm mt-1">
            주말 피크타임(16-18시) 2명 추가 배치 권장. 예상 매출 증가: +18%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
