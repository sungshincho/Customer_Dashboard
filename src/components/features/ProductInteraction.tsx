import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { TrendingUp, Eye, ShoppingCart, CreditCard } from "lucide-react";

const productData = [
  { product: "원피스 A", views: 450, pickups: 234, purchases: 89 },
  { product: "블라우스 B", views: 389, pickups: 198, purchases: 76 },
  { product: "팬츠 C", views: 356, pickups: 167, purchases: 54 },
  { product: "가디건 D", views: 298, pickups: 145, purchases: 48 },
  { product: "스커트 E", views: 267, pickups: 123, purchases: 41 },
];

export function ProductInteraction() {
  const topProduct = productData[0];
  const conversionRate = ((topProduct.purchases / topProduct.views) * 100).toFixed(1);

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">상품 인터랙션</CardTitle>
        <CardDescription>상품별 조회/픽업/구매 분석</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Eye className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 조회</p>
            <p className="text-xl font-bold gradient-text">1,760</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <ShoppingCart className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 픽업</p>
            <p className="text-xl font-bold gradient-text">867</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <CreditCard className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 구매</p>
            <p className="text-xl font-bold gradient-text">308</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="product" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
            />
            <Bar dataKey="views" fill="hsl(219 100% 85%)" name="조회" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pickups" fill="hsl(219 100% 70%)" name="픽업" radius={[4, 4, 0, 0]} />
            <Bar dataKey="purchases" fill="hsl(var(--primary))" name="구매" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">베스트 상품</p>
            <p className="text-lg font-semibold gradient-text">{topProduct.product}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">전환율</p>
            <p className="text-2xl font-bold text-primary animate-glow-pulse">{conversionRate}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
