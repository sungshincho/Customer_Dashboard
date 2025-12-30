/**
 * ProductTab.tsx
 *
 * 인사이트 허브 - 상품 탭
 * 3D Glassmorphism Design + Dark Mode Support
 */

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Glass3DCard, Icon3D, text3DStyles } from '@/components/ui/glass-card';
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
  DollarSign,
  AlertTriangle,
  Award,
  Info,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { formatCurrency } from '../components';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useAuth } from '@/hooks/useAuth';

const CATEGORY_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

// 3D Text 스타일 (다크모드 지원)
const getText3D = (isDark: boolean) => ({
  heroNumber: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties : text3DStyles.heroNumber,
  number: isDark ? {
    fontWeight: 800,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : text3DStyles.number,
  label: isDark ? {
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    fontSize: '9px',
    color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : text3DStyles.label,
  body: isDark ? {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : text3DStyles.body,
});

export function ProductTab() {
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { user, orgId } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useInsightMetrics();
  const [isDark, setIsDark] = useState(false);

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.8)' : '#1a1a1f';

  // 상품별 판매 데이터
  const { data: productData } = useQuery({
    queryKey: ['product-performance', selectedStore?.id, dateRange, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return [];

      const { data: perfData, error: perfError } = await supabase
        .from('product_performance_agg')
        .select('product_id, units_sold, revenue, stock_level')
        .eq('org_id', orgId)
        .eq('store_id', selectedStore.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (perfError || !perfData || perfData.length === 0) return [];

      const productMap = new Map<string, { quantity: number; revenue: number; stock: number }>();
      perfData.forEach((d) => {
        const existing = productMap.get(d.product_id) || { quantity: 0, revenue: 0, stock: 0 };
        productMap.set(d.product_id, {
          quantity: existing.quantity + (d.units_sold || 0),
          revenue: existing.revenue + (d.revenue || 0),
          stock: d.stock_level ?? existing.stock,
        });
      });

      const productIds = [...productMap.keys()];
      const { data: productsInfo } = await supabase
        .from('products')
        .select('id, product_name, category')
        .in('id', productIds) as { data: Array<{ id: string; product_name: string; category: string | null }> | null };

      const productNameMap = new Map((productsInfo || []).map((p) => [p.id, { name: p.product_name, category: p.category || '기타' }]));

      return Array.from(productMap.entries())
        .map(([id, data]) => {
          const info = productNameMap.get(id) || { name: id.substring(0, 8), category: '기타' };
          return { id, name: info.name, category: info.category, ...data };
        })
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!selectedStore?.id && !!orgId,
  });

  // 카테고리별 데이터
  const categoryData = useMemo(() => {
    if (!productData || productData.length === 0) return [];
    const categoryMap = new Map<string, { revenue: number; quantity: number }>();
    productData.forEach((p) => {
      const existing = categoryMap.get(p.category) || { revenue: 0, quantity: 0 };
      categoryMap.set(p.category, {
        revenue: existing.revenue + p.revenue,
        quantity: existing.quantity + p.quantity,
      });
    });
    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, revenue: data.revenue, quantity: data.quantity }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productData]);

  const summary = useMemo(() => {
    const totalRevenue = productData?.reduce((sum, p) => sum + p.revenue, 0) || 0;
    const totalQuantity = productData?.reduce((sum, p) => sum + p.quantity, 0) || 0;
    const topProduct = productData?.[0];
    const lowStockCount = productData?.filter(p => p.stock > 0 && p.stock < 10).length || 0;
    return { totalRevenue, totalQuantity, topProduct, lowStockCount };
  }, [productData]);

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <DollarSign className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>REVENUE</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>총 매출</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{formatCurrency(metrics?.revenue || summary.totalRevenue)}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>분석 기간 총 매출</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Package className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>TRANSACTIONS</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>거래 수</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', ...text3D.heroNumber }}>{(metrics?.transactions || summary.totalQuantity).toLocaleString()}건</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>총 거래 건수</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <Award className="h-5 w-5" style={{ color: iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>BESTSELLER</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>베스트셀러</p>
              </div>
            </div>
            <p style={{ fontSize: '24px', ...text3D.heroNumber }} className="truncate">{summary.topProduct?.name || '-'}</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>{formatCurrency(summary.topProduct?.revenue || 0)}</p>
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon3D size={40} dark={isDark}>
                <AlertTriangle className="h-5 w-5" style={{ color: summary.lowStockCount > 0 ? '#ef4444' : iconColor }} />
              </Icon3D>
              <div>
                <p style={text3D.label}>LOW STOCK</p>
                <p style={{ fontSize: '12px', ...text3D.body }}>재고 부족</p>
              </div>
            </div>
            <p style={{ fontSize: '28px', color: summary.lowStockCount > 0 ? '#ef4444' : (isDark ? '#fff' : '#1a1a1f'), ...text3D.heroNumber }}>{summary.lowStockCount}개</p>
            <p style={{ fontSize: '12px', marginTop: '8px', ...text3D.body }}>재고 10개 미만 상품</p>
          </div>
        </Glass3DCard>
      </div>

      {/* ATV 안내 */}
      {metrics?.atv && metrics.atv > 0 && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }} />
          <p style={{ fontSize: '13px', ...text3D.body }}>
            <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>평균 객단가 (ATV):</span>{' '}
            {formatCurrency(metrics.atv)} = Revenue {formatCurrency(metrics.revenue || 0)} / Transactions {metrics.transactions.toLocaleString()}건
          </p>
        </div>
      )}

      {/* 상품별 매출 TOP 10 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>상품별 매출 TOP 10</h3>
          <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>매출 기준 상위 10개 상품</p>
          {productData && productData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill={isDark ? '#ffffff' : '#1a1a1f'} name="매출" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center" style={text3D.body}>상품 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>

      {/* 카테고리별 성과 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 매출 분포</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>카테고리별 매출 비율</p>
            {categoryData && categoryData.length > 0 ? (
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
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>카테고리 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>

        <Glass3DCard dark={isDark}>
          <div className="p-6">
            <h3 style={{ fontSize: '16px', marginBottom: '4px', ...text3D.number }}>카테고리별 판매량</h3>
            <p style={{ fontSize: '12px', marginBottom: '20px', ...text3D.body }}>카테고리별 판매 수량</p>
            {categoryData && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: isDark ? '#1a1a1f' : '#fff', border: 'none', borderRadius: 8 }} />
                  <Bar dataKey="quantity" fill={isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'} name="판매량" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={text3D.body}>카테고리 데이터가 없습니다</div>
            )}
          </div>
        </Glass3DCard>
      </div>

      {/* 상품 상세 테이블 */}
      <Glass3DCard dark={isDark}>
        <div className="p-6">
          <h3 style={{ fontSize: '16px', marginBottom: '20px', ...text3D.number }}>상품별 상세 성과</h3>
          {productData && productData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
                    <th className="text-left py-3 px-4" style={text3D.body}>상품</th>
                    <th className="text-left py-3 px-4" style={text3D.body}>카테고리</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>매출</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>판매량</th>
                    <th className="text-right py-3 px-4" style={text3D.body}>재고</th>
                  </tr>
                </thead>
                <tbody>
                  {productData?.slice(0, 10).map((product) => (
                    <tr key={product.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                      <td className="py-3 px-4" style={{ fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>{product.name}</td>
                      <td className="py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          color: isDark ? 'rgba(255,255,255,0.8)' : '#6b7280',
                        }}>
                          {product.category}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{formatCurrency(product.revenue)}</td>
                      <td className="text-right py-3 px-4" style={text3D.body}>{product.quantity.toLocaleString()}개</td>
                      <td className="text-right py-3 px-4">
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: product.stock < 10 ? 'rgba(239,68,68,0.15)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                          color: product.stock < 10 ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.7)' : '#6b7280'),
                        }}>
                          {product.stock}개
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center" style={text3D.body}>해당 기간에 상품 데이터가 없습니다</div>
          )}
        </div>
      </Glass3DCard>
    </div>
  );
}
