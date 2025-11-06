import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const ageData = [
  { name: "10대", value: 15, color: "hsl(219 100% 85%)" },
  { name: "20대", value: 35, color: "hsl(219 100% 75%)" },
  { name: "30대", value: 28, color: "hsl(219 100% 65%)" },
  { name: "40대", value: 15, color: "hsl(219 100% 60%)" },
  { name: "50대+", value: 7, color: "hsl(var(--primary))" },
];

const genderData = [
  { name: "여성", value: 62, color: "hsl(var(--primary))" },
  { name: "남성", value: 38, color: "hsl(219 100% 75%)" },
];

export function Demographics() {
  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">고객 인구통계</CardTitle>
        <CardDescription>연령대 및 성별 분포</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-center">연령대 분포</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                    borderRadius: "8px",
                    backdropFilter: "blur(12px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-center">성별 분포</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                    borderRadius: "8px",
                    backdropFilter: "blur(12px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">주요 고객층</p>
          <p className="text-lg font-semibold gradient-text">20-30대 여성 (63%)</p>
        </div>
      </CardContent>
    </Card>
  );
}
