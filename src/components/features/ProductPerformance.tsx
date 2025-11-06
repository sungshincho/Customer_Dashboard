import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Package, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  stock: number;
  trend: number;
  status: "high" | "medium" | "low" | "critical";
}

const products: Product[] = [
  { id: "P1", name: "데님 자켓", category: "아우터", sales: 145, revenue: 14500000, stock: 23, trend: 15, status: "high" },
  { id: "P2", name: "화이트 티셔츠", category: "상의", sales: 320, revenue: 9600000, stock: 85, trend: 8, status: "high" },
  { id: "P3", name: "블랙 진", category: "하의", sales: 210, revenue: 16800000, stock: 42, trend: -5, status: "medium" },
  { id: "P4", name: "스니커즈", category: "신발", sales: 98, revenue: 11760000, stock: 8, trend: 12, status: "critical" },
  { id: "P5", name: "백팩", category: "악세사리", sales: 67, revenue: 6700000, stock: 156, trend: -12, status: "low" },
];

const categoryData = [
  { name: "아우터", value: 14500000, color: "hsl(var(--primary))" },
  { name: "상의", value: 9600000, color: "hsl(217, 91%, 60%)" },
  { name: "하의", value: 16800000, color: "hsl(262, 83%, 58%)" },
  { name: "신발", value: 11760000, color: "hsl(142, 76%, 36%)" },
  { name: "악세사리", value: 6700000, color: "hsl(48, 96%, 53%)" },
];

export const ProductPerformance = () => {
  const [sortBy, setSortBy] = useState<"sales" | "revenue" | "trend">("sales");

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "sales") return b.sales - a.sales;
    if (sortBy === "revenue") return b.revenue - a.revenue;
    return b.trend - a.trend;
  });

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const avgTrend = products.reduce((sum, p) => sum + p.trend, 0) / products.length;
  const lowStockCount = products.filter((p) => p.status === "critical").length;

  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "high": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-orange-500";
      case "critical": return "text-red-500";
    }
  };

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "high": return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">우수</Badge>;
      case "medium": return <Badge variant="outline">보통</Badge>;
      case "low": return <Badge variant="outline" className="border-orange-500/50 text-orange-500">저조</Badge>;
      case "critical": return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />긴급</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">총 매출</div>
          <div className="text-2xl font-bold">₩{(totalRevenue / 1000000).toFixed(0)}M</div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            +{avgTrend.toFixed(1)}%
          </Badge>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">총 판매량</div>
          <div className="text-2xl font-bold">{totalSales}개</div>
          <div className="text-xs text-muted-foreground">이번 주</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">평균 성장률</div>
          <div className="text-2xl font-bold text-primary">+{avgTrend.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">전주 대비</div>
        </Card>

        <Card className="glass p-4 space-y-2">
          <div className="text-sm text-muted-foreground">재고 알림</div>
          <div className="text-2xl font-bold text-red-500">{lowStockCount}개</div>
          <div className="text-xs text-muted-foreground">긴급 보충 필요</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Product List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">상품별 실적</h4>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">판매량</SelectItem>
                <SelectItem value="revenue">매출</SelectItem>
                <SelectItem value="trend">성장률</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="glass p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.category}</div>
                  </div>
                  {getStatusBadge(product.status)}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">판매</div>
                    <div className="font-semibold">{product.sales}개</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">매출</div>
                    <div className="font-semibold">₩{(product.revenue / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">재고</div>
                    <div className={`font-semibold ${getStatusColor(product.status)}`}>
                      {product.stock}개
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {product.trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${product.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {product.trend > 0 ? '+' : ''}{product.trend}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs 지난주</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">카테고리별 매출</h5>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `₩${(value / 1000000).toFixed(1)}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-6">
            <h5 className="text-sm font-semibold mb-4">상위 5개 상품 판매량</h5>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="id" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="glass p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold mb-1">재고 관리 알림</div>
                <p className="text-muted-foreground">
                  스니커즈 재고 부족 (8개). 평균 일 판매량 14개 기준 3일 내 재고 소진 예상.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
