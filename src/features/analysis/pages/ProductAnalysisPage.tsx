import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Package, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
import { useStoreDataset } from "@/hooks/useStoreData";
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

const COLORS = ['#1B6BFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ProductAnalysisPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { data: storeData, isLoading, refetch } = useStoreDataset();
  const { inventoryLevels } = useRealtimeInventory();
  const [products, setProducts] = useState<any[]>([]);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Product Analysis',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedStore) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('products').select('*').eq('user_id', user.id);
      if (data) setProducts(data);
    };
    fetchProducts();
  }, [selectedStore]);

  const productPerformance = useMemo(() => {
    if (!storeData?.purchases) return [];
    return products.map(product => {
      const productPurchases = storeData.purchases.filter((p: any) => p.product_name === product.name);
      const sales = productPurchases.reduce((sum: number, p: any) => sum + (parseInt(p.quantity) || 0), 0);
      const revenue = productPurchases.reduce((sum: number, p: any) => sum + (parseFloat(p.unit_price) || 0) * (parseInt(p.quantity) || 0), 0);
      const inventory = inventoryLevels.find(inv => inv.product_id === product.id);
      const margin = ((product.selling_price - product.cost_price) / product.selling_price) * 100;
      return { name: product.name, sku: product.sku, category: product.category || '미분류', sales, revenue, margin, currentStock: inventory?.current_stock || 0, price: product.selling_price };
    });
  }, [products, storeData, inventoryLevels]);

  const inventoryData = inventoryLevels.map(level => {
    const stockPercentage = (level.current_stock / level.optimal_stock) * 100;
    const stockStatus = level.current_stock < level.minimum_stock ? "critical" : stockPercentage < 50 ? "low" : "normal";
    return { productName: level.products.name, currentStock: level.current_stock, minStock: level.minimum_stock, optimalStock: level.optimal_stock, stockStatus };
  });

  const totalRevenue = productPerformance.length > 0 ? productPerformance.reduce((sum, p) => sum + p.revenue, 0) : 0;
  const lowStockCount = inventoryData.length > 0 ? inventoryData.filter(i => i.stockStatus !== "normal").length : 0;
  const avgMargin = productPerformance.length > 0 ? productPerformance.reduce((sum, p) => sum + p.margin, 0) / productPerformance.length : 0;

  const categoryData = productPerformance.reduce((acc: any[], p) => {
    const existing = acc.find(c => c.category === p.category);
    if (existing) existing.revenue += p.revenue;
    else acc.push({ category: p.category, revenue: p.revenue });
    return acc;
  }, []);

  const topProducts = [...productPerformance].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  if (!selectedStore) {
    return <DashboardLayout><div className="flex items-center justify-center h-[60vh]"><Card className="max-w-md"><CardHeader><CardTitle>매장을 선택해주세요</CardTitle></CardHeader></Card></div></DashboardLayout>;
  }

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div><h1 className="text-3xl font-bold gradient-text">상품 분석</h1><p className="text-muted-foreground mt-2">상품 성과와 재고 현황을 분석하세요</p></div>
          <Button onClick={() => refetch()} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" />새로고침</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">총 매출</p><p className="text-2xl font-bold">{totalRevenue > 0 ? `₩${Math.round(totalRevenue).toLocaleString()}` : <span className="text-base text-muted-foreground">데이터 없음</span>}</p></div><DollarSign className="w-8 h-8 text-primary opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">상품 수</p><p className="text-2xl font-bold">{productPerformance.length > 0 ? productPerformance.length : <span className="text-base text-muted-foreground">데이터 없음</span>}</p></div><Package className="w-8 h-8 text-green-500 opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">평균 마진율</p><p className="text-2xl font-bold">{avgMargin > 0 ? `${avgMargin.toFixed(1)}%` : <span className="text-base text-muted-foreground">데이터 없음</span>}</p></div><TrendingUp className="w-8 h-8 text-orange-500 opacity-50" /></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">재고 부족</p><p className="text-2xl font-bold">{inventoryData.length > 0 ? <span className="text-destructive">{lowStockCount}</span> : <span className="text-base text-muted-foreground">데이터 없음</span>}</p></div><AlertTriangle className="w-8 h-8 text-destructive opacity-50" /></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>카테고리별 매출</CardTitle></CardHeader><CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>{categoryData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>카테고리 데이터가 없습니다</p></div>
              </div>
            )}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>상위 성과 상품</CardTitle></CardHeader><CardContent>
            {topProducts.length > 0 ? (
              <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts} layout="vertical"><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} /><Tooltip /><Bar dataKey="revenue" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer></div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center"><TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>상품 성과 데이터가 없습니다</p></div>
              </div>
            )}
          </CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>재고 현황</CardTitle></CardHeader><CardContent>
          {inventoryData.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>상품명</TableHead><TableHead>현재 재고</TableHead><TableHead>최소 재고</TableHead><TableHead>상태</TableHead><TableHead>재고율</TableHead></TableRow></TableHeader><TableBody>{inventoryData.slice(0, 10).map((item, idx) => {
              const stockPercentage = (item.currentStock / item.optimalStock) * 100;
              return <TableRow key={idx}><TableCell>{item.productName}</TableCell><TableCell>{item.currentStock}</TableCell><TableCell>{item.minStock}</TableCell><TableCell><Badge variant={item.stockStatus === 'critical' ? 'destructive' : item.stockStatus === 'low' ? 'default' : 'secondary'}>{item.stockStatus === 'critical' ? '위험' : item.stockStatus === 'low' ? '부족' : '정상'}</Badge></TableCell><TableCell><Progress value={stockPercentage} className="h-2" /></TableCell></TableRow>;
            })}</TableBody></Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>재고 데이터가 없습니다</p>
            </div>
          )}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
