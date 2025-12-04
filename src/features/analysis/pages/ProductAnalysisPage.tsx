import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useEffect, useMemo } from "react";
import { TrendingUp, Package, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
import { useTopProducts, useCategoryPerformance } from "@/hooks/useProductPerformance";  // ✅ L3 사용
import { useLatestKPIAgg } from "@/hooks/useDashboardKPIAgg";  // ✅ L3 사용
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";  // L2 - 실시간 재고
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

const COLORS = ['#1B6BFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

/**
 * 상품 분석 페이지 - 통일된 L3 구조
 * 
 * 데이터 소스:
 * - KPI 카드: daily_kpis_agg + product_performance_agg (L3) ✅
 * - 카테고리별 매출: product_performance_agg + line_items (L3/L2) ✅
 * - 상위 상품: product_performance_agg (L3) ✅
 * - 재고 현황: inventory_levels (L2) - 실시간 재고
 */
export default function ProductAnalysisPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Product Analysis',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  // ✅ L3 데이터 소스 - 최근 7일 KPI (매출, 마진 등)
  const { data: latestKPIs, isLoading: kpisLoading, refetch: refetchKPIs } = useLatestKPIAgg(selectedStore?.id, 7);
  
  // ✅ L3 데이터 소스 - 상위 상품 성과
  const { data: topProducts, isLoading: topLoading } = useTopProducts(selectedStore?.id, 10, 7);
  
  // ✅ L3/L2 데이터 소스 - 카테고리별 성과
  const { data: categoryData, isLoading: categoryLoading } = useCategoryPerformance(selectedStore?.id, 7);
  
  // L2 데이터 - 실시간 재고 (Realtime 구독)
  const { inventoryLevels, isLoading: inventoryLoading } = useRealtimeInventory();

  // ✅ L3 기반 KPI 계산
  const kpiStats = useMemo(() => {
    if (!latestKPIs || latestKPIs.length === 0) {
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        avgMargin: 0,
        totalUnitsSold: 0,
      };
    }

    // 최근 7일 합계
    const totalRevenue = latestKPIs.reduce((sum, kpi) => sum + (kpi.total_revenue || 0), 0);
    const totalTransactions = latestKPIs.reduce((sum, kpi) => sum + (kpi.total_transactions || 0), 0);
    const totalUnitsSold = latestKPIs.reduce((sum, kpi) => sum + (kpi.total_units_sold || 0), 0);
    
    // 마진율은 L3에서 직접 제공하지 않으므로 추후 ETL 확장 필요
    // 임시로 0 처리
    const avgMargin = 0;

    return {
      totalRevenue,
      totalTransactions,
      avgMargin,
      totalUnitsSold,
    };
  }, [latestKPIs]);

  // 재고 현황 데이터
  const inventoryData = useMemo(() => {
    return inventoryLevels.map(level => {
      const stockPercentage = level.optimal_stock > 0 
        ? (level.current_stock / level.optimal_stock) * 100 
        : 0;
      const stockStatus = level.current_stock < level.minimum_stock 
        ? "critical" 
        : stockPercentage < 50 
          ? "low" 
          : "normal";
      
      return { 
        productName: level.products?.product_name || 'Unknown',
        currentStock: level.current_stock, 
        minStock: level.minimum_stock, 
        optimalStock: level.optimal_stock, 
        stockStatus,
        stockPercentage,
      };
    });
  }, [inventoryLevels]);

  // 재고 부족 상품 수
  const lowStockCount = inventoryData.filter(i => i.stockStatus !== "normal").length;

  // ✅ L3 기반 상위 상품 차트 데이터
  const topProductsChartData = useMemo(() => {
    if (!topProducts || topProducts.length === 0) return [];
    
    return topProducts.slice(0, 5).map((p, idx) => ({
      name: `상품 ${idx + 1}`,  // product_id 대신 표시명 (추후 products 테이블 조인으로 개선)
      product_id: p.product_id,
      revenue: p.revenue,
      units: p.units_sold,
    }));
  }, [topProducts]);

  // ✅ L3 기반 카테고리 차트 데이터
  const categoryChartData = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [];
    
    return categoryData.map(c => ({
      category: c.category || '미분류',
      revenue: c.revenue,
      count: c.count,
    }));
  }, [categoryData]);

  const isLoading = kpisLoading || topLoading || categoryLoading || inventoryLoading;

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>매장을 선택해주세요</CardTitle>
              <CardDescription>
                분석을 시작하려면 상단에서 매장을 먼저 선택해주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">상품 분석</h1>
            <p className="text-muted-foreground mt-2">상품 성과와 재고 현황을 분석하세요</p>
          </div>
          <Button onClick={() => refetchKPIs()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* KPI Cards - L3 기반 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ✅ L3 기반 총 매출 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">총 매출</p>
                  <p className="text-2xl font-bold">
                    {kpiStats.totalRevenue > 0 ? (
                      `₩${Math.round(kpiStats.totalRevenue).toLocaleString()}`
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최근 7일</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* ✅ L3 기반 판매 수량 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">판매 수량</p>
                  <p className="text-2xl font-bold">
                    {kpiStats.totalUnitsSold > 0 ? (
                      <>
                        {kpiStats.totalUnitsSold.toLocaleString()}
                        <span className="text-sm">개</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최근 7일</p>
                </div>
                <Package className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* 평균 마진율 - 추후 L3 확장 필요 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">거래 건수</p>
                  <p className="text-2xl font-bold">
                    {kpiStats.totalTransactions > 0 ? (
                      <>
                        {kpiStats.totalTransactions.toLocaleString()}
                        <span className="text-sm">건</span>
                      </>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">최근 7일</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* L2 기반 재고 부족 (실시간) */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">재고 부족</p>
                  <p className="text-2xl font-bold">
                    {inventoryData.length > 0 ? (
                      <span className={lowStockCount > 0 ? "text-destructive" : ""}>
                        {lowStockCount}
                      </span>
                    ) : (
                      <span className="text-base text-muted-foreground">데이터 없음</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">실시간 모니터링</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 차트 섹션 - L3 기반 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✅ 카테고리별 매출 - L3 사용 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 매출</CardTitle>
              <CardDescription>최근 7일 카테고리 성과 (L3)</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryChartData} 
                        dataKey="revenue" 
                        nameKey="category" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>카테고리 데이터가 없습니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ 상위 성과 상품 - L3 사용 */}
          <Card>
            <CardHeader>
              <CardTitle>상위 성과 상품</CardTitle>
              <CardDescription>최근 7일 매출 Top 5 (L3)</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProductsChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" tickFormatter={(v) => `₩${(v / 1000).toFixed(0)}K`} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="매출" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>상품 성과 데이터가 없습니다</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 재고 현황 - L2 사용 (실시간) */}
        <Card>
          <CardHeader>
            <CardTitle>재고 현황</CardTitle>
            <CardDescription>실시간 재고 모니터링 (L2 Realtime)</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>현재 재고</TableHead>
                    <TableHead>최소 재고</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>재고율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.slice(0, 10).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.currentStock}</TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.stockStatus === 'critical' 
                              ? 'destructive' 
                              : item.stockStatus === 'low' 
                                ? 'default' 
                                : 'secondary'
                          }
                        >
                          {item.stockStatus === 'critical' ? '위험' : item.stockStatus === 'low' ? '부족' : '정상'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <Progress value={Math.min(item.stockPercentage, 100)} className="h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>재고 데이터가 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
