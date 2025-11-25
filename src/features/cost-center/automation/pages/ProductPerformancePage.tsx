import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, DollarSign, Package, Percent } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useStoreDataset } from "@/hooks/useStoreData";
import { DataReadinessGuard } from "@/components/DataReadinessGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  category: string;
  sales: number;
  revenue: number;
  conversionRate: number;
  turnoverRate: number;
  margin: number;
  profitability: number;
  contribution: number;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
}

const ProductPerformancePage = () => {
  const { selectedStore } = useSelectedStore();
  const { data: storeData, isLoading, refetch } = useStoreDataset();
  
  const [showPerformance, setShowPerformance] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showProfit, setShowProfit] = useState(true);
  
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<any[]>([]);

  // Fetch products and inventory levels from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStore) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch inventory levels
      const { data: inventoryData } = await supabase
        .from('inventory_levels')
        .select('*, products(*)')
        .eq('user_id', user.id);
      
      if (productsData) setProducts(productsData);
      if (inventoryData) setInventoryLevels(inventoryData);
    };
    
    fetchData();
  }, [selectedStore]);

  // Calculate product performance metrics
  const productPerformance: ProductPerformance[] = useMemo(() => {
    if (!storeData?.products || !storeData?.purchases || !storeData?.visits) return [];
    
    return products.map(product => {
      // Calculate sales from purchases
      const productPurchases = storeData.purchases.filter((p: any) => 
        p.product_name === product.name || p.sku === product.sku
      );
      const sales = productPurchases.reduce((sum: number, p: any) => 
        sum + (parseInt(p.quantity) || 0), 0
      );
      const revenue = productPurchases.reduce((sum: number, p: any) => 
        sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0
      );
      
      // Get inventory info
      const inventory = inventoryLevels.find(inv => inv.product_id === product.id);
      const currentStock = inventory?.current_stock || 0;
      const weeklyDemand = inventory?.weekly_demand || 0;
      
      // Calculate metrics
      const totalVisits = storeData.visits.length;
      const conversionRate = totalVisits > 0 ? (productPurchases.length / totalVisits) * 100 : 0;
      const turnoverRate = weeklyDemand > 0 ? (sales / weeklyDemand) * 100 : 0;
      const margin = ((product.selling_price - product.cost_price) / product.selling_price) * 100;
      const profit = revenue - (sales * product.cost_price);
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category || '미분류',
        sales,
        revenue,
        conversionRate,
        turnoverRate,
        margin,
        profitability: profit,
        contribution: 0, // Will calculate after total revenue
        currentStock,
        costPrice: product.cost_price,
        sellingPrice: product.selling_price,
      };
    });
  }, [storeData, products, inventoryLevels]);

  // Calculate contribution percentage
  const totalRevenue = productPerformance.reduce((sum, p) => sum + p.revenue, 0);
  productPerformance.forEach(p => {
    p.contribution = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
  });

  // Category analysis
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { 
      sales: number; 
      revenue: number; 
      products: number;
      avgMargin: number;
    }>();
    
    productPerformance.forEach(p => {
      const existing = categoryMap.get(p.category) || { 
        sales: 0, 
        revenue: 0, 
        products: 0,
        avgMargin: 0 
      };
      categoryMap.set(p.category, {
        sales: existing.sales + p.sales,
        revenue: existing.revenue + p.revenue,
        products: existing.products + 1,
        avgMargin: existing.avgMargin + p.margin,
      });
    });
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
      avgMargin: data.avgMargin / data.products,
    }));
  }, [productPerformance]);

  // Best and worst products
  const bestProducts = [...productPerformance]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const worstProducts = [...productPerformance]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 5);

  // KPIs
  const totalProducts = productPerformance.length;
  const totalSales = productPerformance.reduce((sum, p) => sum + p.sales, 0);
  const avgMargin = productPerformance.length > 0 
    ? productPerformance.reduce((sum, p) => sum + p.margin, 0) / productPerformance.length 
    : 0;
  const totalProfit = productPerformance.reduce((sum, p) => sum + p.profitability, 0);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  if (!selectedStore) {
    return (
      <DataReadinessGuard>
        <DashboardLayout>
          <Alert>
            <AlertDescription>매장을 선택해주세요.</AlertDescription>
          </Alert>
        </DashboardLayout>
      </DataReadinessGuard>
    );
  }

  return (
    <DataReadinessGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">상품 성과 분석</h1>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle>분석 옵션</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant={showPerformance ? "default" : "outline"}
                  onClick={() => setShowPerformance(!showPerformance)}
                  size="sm"
                >
                  상품별 성과
                </Button>
                <Button 
                  variant={showCategory ? "default" : "outline"}
                  onClick={() => setShowCategory(!showCategory)}
                  size="sm"
                >
                  카테고리 비교
                </Button>
                <Button 
                  variant={showProfit ? "default" : "outline"}
                  onClick={() => setShowProfit(!showProfit)}
                  size="sm"
                >
                  수익 분석
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">총 상품</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">총 판매량</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales.toLocaleString()}개</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₩{totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">평균 마진율</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* 1. Product Performance Section */}
          {showPerformance && (
            <Card>
              <CardHeader>
                <CardTitle>상품별 성과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Performance Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상품명</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">판매량</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">전환율</TableHead>
                        <TableHead className="text-right">재고회전율</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productPerformance.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell className="text-right">{product.sales}</TableCell>
                          <TableCell className="text-right">₩{product.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{product.conversionRate.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">{product.turnoverRate.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Sales Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">상품별 판매량</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" name="판매량" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Category Comparison Section */}
          {showCategory && (
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 비교</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Performance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">카테고리 성과</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" name="매출" />
                      <Bar yAxisId="right" dataKey="avgMargin" fill="hsl(var(--secondary))" name="평균 마진율(%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Best Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">베스트 상품 (Top 5)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>상품명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">판매량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bestProducts.map((product, idx) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Badge variant={idx === 0 ? "default" : "secondary"}>{idx + 1}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">₩{product.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{product.sales}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Worst Products */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">워스트 상품 (Bottom 5)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상품명</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">판매량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worstProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">₩{product.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{product.sales}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. Profit Analysis Section */}
          {showProfit && (
            <Card>
              <CardHeader>
                <CardTitle>수익 분석</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Revenue Contribution */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">매출 기여도</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={productPerformance.slice(0, 10)}
                        dataKey="contribution"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.contribution.toFixed(1)}%`}
                      >
                        {productPerformance.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Margin Analysis */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">마진율 분석</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productPerformance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="margin" fill="hsl(var(--accent))" name="마진율(%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Profitability Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">수익성 지표</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상품명</TableHead>
                        <TableHead className="text-right">매출</TableHead>
                        <TableHead className="text-right">마진율</TableHead>
                        <TableHead className="text-right">순이익</TableHead>
                        <TableHead className="text-right">기여도</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productPerformance
                        .sort((a, b) => b.profitability - a.profitability)
                        .slice(0, 10)
                        .map(product => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">₩{product.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{product.margin.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">₩{product.profitability.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{product.contribution.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total Profit */}
                <Card className="bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">총 순이익</p>
                        <p className="text-3xl font-bold">₩{totalProfit.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-12 w-12 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </DataReadinessGuard>
  );
};

export default ProductPerformancePage;
