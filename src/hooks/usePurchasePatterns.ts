import { useMemo } from 'react';
import { useRealPurchases, useRealProducts } from './useRealSampleData';

/**
 * 구매 패턴 분석 Hook (Tier 1)
 * 실제 purchases + products 데이터 기반
 */

export interface PurchasePattern {
  // 시간대별 구매 패턴
  hourlyPattern: { hour: number; count: number; revenue: number }[];
  
  // 요일별 구매 패턴
  weeklyPattern: { day: string; count: number; revenue: number }[];
  
  // 카테고리별 구매 패턴
  categoryPattern: { category: string; count: number; revenue: number; avgPrice: number }[];
  
  // Top 제품
  topProducts: { product_id: string; name: string; count: number; revenue: number }[];
}

export function usePurchasePatterns() {
  const { data: purchases, isLoading: purchasesLoading } = useRealPurchases();
  const { data: products, isLoading: productsLoading } = useRealProducts();

  const patterns = useMemo<PurchasePattern>(() => {
    if (!purchases || !products) {
      return {
        hourlyPattern: [],
        weeklyPattern: [],
        categoryPattern: [],
        topProducts: [],
      };
    }

    // 시간대별 패턴
    const hourlyMap = new Map<number, { count: number; revenue: number }>();
    purchases.forEach((p: any) => {
      const hour = new Date(p.purchase_date).getHours();
      const current = hourlyMap.get(hour) || { count: 0, revenue: 0 };
      hourlyMap.set(hour, {
        count: current.count + 1,
        revenue: current.revenue + (parseFloat(p.price) || 0),
      });
    });

    const hourlyPattern = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour - b.hour);

    // 요일별 패턴
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weeklyMap = new Map<string, { count: number; revenue: number }>();
    purchases.forEach((p: any) => {
      const dayIndex = new Date(p.purchase_date).getDay();
      const day = weekdays[dayIndex];
      const current = weeklyMap.get(day) || { count: 0, revenue: 0 };
      weeklyMap.set(day, {
        count: current.count + 1,
        revenue: current.revenue + (parseFloat(p.price) || 0),
      });
    });

    const weeklyPattern = weekdays.map(day => ({
      day,
      ...(weeklyMap.get(day) || { count: 0, revenue: 0 }),
    }));

    // 카테고리별 패턴 (products의 category 정보 활용)
    const categoryMap = new Map<string, { count: number; revenue: number; prices: number[] }>();
    purchases.forEach((p: any) => {
      const product = products.find((prod: any) => prod.product_id === p.product_id);
      const category = product?.category || 'Unknown';
      const price = parseFloat(p.price) || 0;
      
      const current = categoryMap.get(category) || { count: 0, revenue: 0, prices: [] };
      categoryMap.set(category, {
        count: current.count + 1,
        revenue: current.revenue + price,
        prices: [...current.prices, price],
      });
    });

    const categoryPattern = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue,
        avgPrice: data.revenue / data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top 제품
    const productMap = new Map<string, { name: string; count: number; revenue: number }>();
    purchases.forEach((p: any) => {
      const product = products.find((prod: any) => prod.product_id === p.product_id);
      const productId = p.product_id;
      const productName = product?.name || 'Unknown';
      const price = parseFloat(p.price) || 0;

      const current = productMap.get(productId) || { name: productName, count: 0, revenue: 0 };
      productMap.set(productId, {
        name: productName,
        count: current.count + 1,
        revenue: current.revenue + price,
      });
    });

    const topProducts = Array.from(productMap.entries())
      .map(([product_id, data]) => ({ product_id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      hourlyPattern,
      weeklyPattern,
      categoryPattern,
      topProducts,
    };
  }, [purchases, products]);

  return {
    patterns,
    isLoading: purchasesLoading || productsLoading,
  };
}

/**
 * 월별 매출 트렌드 (Tier 1)
 */
export function useMonthlyRevenueTrend() {
  const { data: purchases, isLoading } = useRealPurchases();

  const monthlyTrend = useMemo(() => {
    if (!purchases) return [];

    const monthlyMap = new Map<string, number>();
    purchases.forEach((p: any) => {
      const date = new Date(p.purchase_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + (parseFloat(p.price) || 0));
    });

    return Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [purchases]);

  return {
    monthlyTrend,
    isLoading,
  };
}
