import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, Package, Star, DollarSign } from "lucide-react";

const productData = [
  { product: "원피스 A", sales: 89, revenue: 7920000, rating: 4.8, stock: 23 },
  { product: "블라우스 B", sales: 76, revenue: 5320000, rating: 4.6, stock: 45 },
  { product: "팬츠 C", sales: 54, revenue: 4860000, rating: 4.5, stock: 12 },
  { product: "가디건 D", sales: 48, revenue: 3840000, rating: 4.7, stock: 34 },
  { product: "스커트 E", sales: 41, revenue: 2870000, rating: 4.4, stock: 28 },
];

export function ProductPerformance() {
  const totalRevenue = productData.reduce((sum, p) => sum + p.revenue, 0);
  const avgRating = (productData.reduce((sum, p) => sum + p.rating, 0) / productData.length).toFixed(1);
  const topProduct = productData[0];

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="gradient-text">상품 성과 분석</CardTitle>
        <CardDescription>판매/매출/재고 통합 관리</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <DollarSign className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">총 매출</p>
            <p className="text-lg font-bold gradient-text">₩{(totalRevenue / 10000).toFixed(0)}만</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Star className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">평균 평점</p>
            <p className="text-lg font-bold text-primary animate-glow-pulse">{avgRating}</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Package className="w-4 h-4 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">베스트</p>
            <p className="text-sm font-bold gradient-text">{topProduct.product}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="product" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--primary) / 0.2)",
                borderRadius: "8px",
                backdropFilter: "blur(12px)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "매출") return `₩${(value / 10000).toFixed(0)}만`;
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="sales" fill="hsl(219 100% 75%)" name="판매량" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {productData.slice(0, 3).map((product, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/5">
              <span className="text-sm font-medium">{product.product}</span>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>재고: {product.stock}개</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  {product.rating}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
