import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, AlertTriangle, Package, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { useState } from "react";
import { AdvancedFilters, FilterState } from "@/features/data-management/analysis/components/AdvancedFilters";
import { ExportButton } from "@/features/data-management/analysis/components/ExportButton";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useRealtimeInventory } from "@/hooks/useRealtimeInventory";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InventoryPage() {
  const { selectedStore } = useSelectedStore();
  const [filters, setFilters] = useState<FilterState>({ dateRange: undefined, store: "전체", category: "전체" });
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [stockFilter, setStockFilter] = useState<string>("전체");
  const [showInventoryLevel, setShowInventoryLevel] = useState(true);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);
  const [showWeeklyDemand, setShowWeeklyDemand] = useState(true);

  const { inventoryLevels, orderSuggestions, isLoading, refetch } = useRealtimeInventory();

  const handleRefresh = () => {
    refetch();
  };

  // 재고 데이터 변환
  const inventoryData = inventoryLevels.map(level => {
    const stockPercentage = (level.current_stock / level.optimal_stock) * 100;
    let stockStatus: "normal" | "low" | "critical" = "normal";
    if (level.current_stock < level.minimum_stock) {
      stockStatus = "critical";
    } else if (stockPercentage < 50) {
      stockStatus = "low";
    }

    return {
      id: level.id,
      productId: level.product_id,
      productName: level.products.name,
      sku: level.products.sku,
      category: level.products.category || "기타",
      currentStock: level.current_stock,
      minStock: level.minimum_stock,
      optimalStock: level.optimal_stock,
      weeklyDemand: level.weekly_demand,
      price: level.products.selling_price,
      stockStatus,
    };
  });

  // 필터링된 재고 데이터
  const filteredInventory = inventoryData.filter(item => {
    if (selectedCategory !== "전체" && item.category !== selectedCategory) return false;
    if (stockFilter === "부족" && item.stockStatus !== "low" && item.stockStatus !== "critical") return false;
    if (stockFilter === "정상" && item.stockStatus !== "normal") return false;
    return true;
  });

  // 카테고리 목록
  const categories = ["전체", ...Array.from(new Set(inventoryData.map(item => item.category)))];

  // 주요 지표
  const totalProducts = inventoryData.length;
  const lowStockCount = inventoryData.filter(item => item.stockStatus === "low" || item.stockStatus === "critical").length;
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
  const potentialLoss = orderSuggestions.reduce((sum, s) => sum + (s.potential_revenue_loss || 0), 0);

  const exportData = {
    filters,
    selectedCategory,
    stockFilter,
    inventoryData: filteredInventory,
    orderSuggestions,
    metrics: {
      totalProducts,
      lowStockCount,
      totalValue,
      potentialLoss
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">재고 현황</h1>
            <p className="text-muted-foreground mt-2">
              {selectedStore 
                ? `${selectedStore.store_name} - 총 ${totalProducts}개 상품, 재고 부족 ${lowStockCount}개` 
                : '실시간 재고 수준 및 자동 발주 제안'}
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton data={exportData} filename="inventory-status" title="재고 현황" />
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </div>

        <AdvancedFilters filters={filters} onFiltersChange={setFilters} />

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                총 상품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}개</div>
              <p className="text-xs text-muted-foreground mt-1">
                정상: {totalProducts - lowStockCount}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                재고 부족
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{lowStockCount}개</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체의 {totalProducts > 0 ? ((lowStockCount / totalProducts) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                재고 가치
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₩{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                평균 단가: ₩{totalProducts > 0 ? Math.round(totalValue / totalProducts).toLocaleString() : 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                잠재 손실
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">₩{potentialLoss.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                품절 예상으로 인한 손실
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 통합 관리 뷰 */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* 좌측: 컨트롤 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">재고 컨트롤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">카테고리</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">재고 상태</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="정상">정상</SelectItem>
                    <SelectItem value="부족">부족</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">표시 섹션</label>
                <div className="space-y-2">
                  <Button
                    variant={showInventoryLevel ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowInventoryLevel(!showInventoryLevel)}
                    className="w-full justify-start"
                  >
                    {showInventoryLevel ? "✓" : ""} 재고 현황
                  </Button>
                  <Button
                    variant={showLowStockAlert ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLowStockAlert(!showLowStockAlert)}
                    className="w-full justify-start"
                  >
                    {showLowStockAlert ? "✓" : ""} 재고 부족 알림
                  </Button>
                  <Button
                    variant={showWeeklyDemand ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowWeeklyDemand(!showWeeklyDemand)}
                    className="w-full justify-start"
                  >
                    {showWeeklyDemand ? "✓" : ""} 주간 수요
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">빠른 통계</label>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-muted text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">평균 재고율</span>
                      <Badge variant="secondary">
                        {totalProducts > 0 
                          ? Math.round((inventoryData.reduce((sum, item) => sum + (item.currentStock / item.optimalStock * 100), 0) / totalProducts))
                          : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">발주 필요</span>
                      <Badge variant="destructive">{orderSuggestions.length}건</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 우측: 데이터 뷰 */}
          <div className="md:col-span-3 space-y-6">
            {/* 재고 현황 */}
            {showInventoryLevel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    재고 현황
                  </CardTitle>
                  <CardDescription>현재/최소/최적 재고 수준</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>상품명</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>현재 재고</TableHead>
                          <TableHead>재고율</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const stockPercentage = (item.currentStock / item.optimalStock) * 100;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.productName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{item.currentStock}</div>
                                  <div className="text-xs text-muted-foreground">
                                    최소: {item.minStock} / 최적: {item.optimalStock}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span>{Math.round(stockPercentage)}%</span>
                                  </div>
                                  <Progress value={Math.min(100, stockPercentage)} />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.stockStatus === "critical"
                                      ? "destructive"
                                      : item.stockStatus === "low"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {item.stockStatus === "critical" ? "긴급" : item.stockStatus === "low" ? "부족" : "정상"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 재고 부족 알림 */}
            {showLowStockAlert && orderSuggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    재고 부족 알림 & 자동 발주 제안
                  </CardTitle>
                  <CardDescription>예상 품절일 및 잠재 매출 손실</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{suggestion.products.name}</h4>
                            <p className="text-sm text-muted-foreground">SKU: {suggestion.products.sku}</p>
                          </div>
                          <Badge 
                            variant={
                              suggestion.urgency_level === "high" || suggestion.urgency_level === "critical"
                                ? "destructive" 
                                : suggestion.urgency_level === "medium"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {suggestion.urgency_level === "high" || suggestion.urgency_level === "critical" ? "긴급" : suggestion.urgency_level === "medium" ? "중요" : "보통"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="p-2 rounded bg-background">
                            <div className="text-xs text-muted-foreground mb-1">현재 재고</div>
                            <div className="text-lg font-bold">{suggestion.current_stock}개</div>
                          </div>
                          <div className="p-2 rounded bg-background">
                            <div className="text-xs text-muted-foreground mb-1">권장 발주량</div>
                            <div className="text-lg font-bold text-primary">{suggestion.suggested_order_quantity}개</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="text-xs text-muted-foreground">예상 품절일</div>
                              <div className="font-medium">
                                {suggestion.estimated_stockout_date 
                                  ? new Date(suggestion.estimated_stockout_date).toLocaleDateString('ko-KR')
                                  : "미정"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-red-500" />
                            <div>
                              <div className="text-xs text-muted-foreground">잠재 손실</div>
                              <div className="font-medium text-red-500">
                                ₩{(suggestion.potential_revenue_loss || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button size="sm" className="flex-1">발주 승인</Button>
                          <Button size="sm" variant="outline" className="flex-1">나중에</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 주간 수요 */}
            {showWeeklyDemand && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    주간 수요 추이
                  </CardTitle>
                  <CardDescription>상품별 주간 수요 패턴</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredInventory.slice(0, 10).map(item => ({
                      name: item.productName,
                      demand: item.weeklyDemand
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                      <YAxis label={{ value: '주간 수요량', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredInventory
                      .sort((a, b) => b.weeklyDemand - a.weeklyDemand)
                      .slice(0, 6)
                      .map((item, idx) => (
                        <div key={item.id} className="p-3 rounded-lg bg-muted">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">#{idx + 1}</Badge>
                            <span className="text-sm font-medium">{item.weeklyDemand}개/주</span>
                          </div>
                          <div className="text-sm font-medium truncate">{item.productName}</div>
                          <Progress value={(item.weeklyDemand / Math.max(...inventoryData.map(i => i.weeklyDemand))) * 100} className="mt-2" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
