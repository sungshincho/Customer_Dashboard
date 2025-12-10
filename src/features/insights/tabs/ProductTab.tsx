/**
 * ProductTab.tsx
 *
 * 인사이트 허브 - 상품 탭
 * 상품별 성과, 카테고리 분석, 재고 현황
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

export function ProductTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();

  // 상품별 판매 데이터
  const { data: productData } = useQuery({
    queryKey: ['product-sales', selectedStore?.id, dateRange],
    queryFn: async () => {
      if (!selectedStore?.id) return [];

      const { data } = await supabase
        .from('product_sales')
        .select('product_name, category, quantity_sold, revenue, stock_level')
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      // 상품별 집계
      const productMap = new Map<string, {
        category: string;
        quantity: number;
        revenue: number;
        stock: number;
        records: number;
      }>();

      (data || []).forEach((d) => {
        const existing = productMap.get(d.product_name) || {
          category: d.category,
          quantity: 0,
          revenue: 0,
          stock: 0,
          records: 0,
        };
        productMap.set(d.product_name, {
          category: d.category || existing.category,
          quantity: existing.quantity + (d.quantity_sold || 0),
          revenue: existing.revenue + (d.revenue || 0),
          stock: d.stock_level || existing.stock,
          records: existing.records + 1,
        });
      });

      return Array.from(productMap.entries())
        .map(([name, data]) => ({
          name,
          category: data.category,
          quantity: data.quantity,
          revenue: data.revenue,
          stock: data.stock,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!selectedStore?.id,
  });

  // 카테고리별 집계
  const categoryData = useMemo(() => {
    if (!productData) return [];

    const categoryMap = new Map<string, { revenue: number; quantity: number }>();
    productData.forEach((p) => {
      const existing = categoryMap.get(p.category) || { revenue: 0, quantity: 0 };
      categoryMap.set(p.category, {
        revenue: existing.revenue + p.revenue,
        quantity: existing.quantity + p.quantity,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productData]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalRevenue = productData?.reduce((sum, p) => sum + p.revenue, 0) || 0;
    const totalQuantity = productData?.reduce((sum, p) => sum + p.quantity, 0) || 0;
    const topProduct = productData?.[0];
    const lowStockCount = productData?.filter(p => p.stock < 10).length || 0;

    return { totalRevenue, totalQuantity, topProduct, lowStockCount };
  }, [productData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₩{(summary.totalRevenue / 10000).toFixed(0)}만
            </div>
            <p className="text-xs text-muted-foreground">분석 기간 총 매출</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              판매 수량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity.toLocaleString()}개</div>
            <p className="text-xs text-muted-foreground">총 판매량</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              베스트셀러
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{summary.topProduct?.name || '-'}</div>
            <p className="text-xs text-muted-foreground">
              ₩{(summary.topProduct?.revenue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              재고 부족
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.lowStockCount > 0 && "text-red-500"
            )}>
              {summary.lowStockCount}개
            </div>
            <p className="text-xs text-muted-foreground">재고 10개 미만 상품</p>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 매출 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 매출</CardTitle>
            <CardDescription>카테고리별 매출 비중</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>카테고리별 판매량</CardTitle>
            <CardDescription>카테고리별 판매 수량</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="hsl(var(--chart-2))" name="판매량" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TOP 10 상품 */}
      <Card>
        <CardHeader>
          <CardTitle>상품 성과 TOP 10</CardTitle>
          <CardDescription>매출 기준 상위 10개 상품</CardDescription>
        </CardHeader>
        <CardContent>
          {productData && productData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis tickFormatter={(v) => `₩${(v/10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => `₩${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="매출" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상품 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>상품별 상세 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">상품명</th>
                  <th className="text-left py-3 px-4">카테고리</th>
                  <th className="text-right py-3 px-4">판매량</th>
                  <th className="text-right py-3 px-4">매출</th>
                  <th className="text-right py-3 px-4">재고</th>
                </tr>
              </thead>
              <tbody>
                {productData?.slice(0, 15).map((product) => (
                  <tr key={product.name} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="text-right py-3 px-4">{product.quantity.toLocaleString()}개</td>
                    <td className="text-right py-3 px-4">₩{product.revenue.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant={product.stock < 10 ? 'destructive' : product.stock < 30 ? 'secondary' : 'default'}>
                        {product.stock}개
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
