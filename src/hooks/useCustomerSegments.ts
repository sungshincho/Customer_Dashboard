import { useMemo } from 'react';
import { useRealCustomers, useRealPurchases } from './useRealSampleData';

/**
 * 고객 세그먼트 분석 Hook (Tier 1)
 * VIP / Regular / New 고객 분류
 * 
 * 실제 customers + purchases 데이터 기반
 */

export interface CustomerSegment {
  customer_id: string;
  name: string;
  segment: 'VIP' | 'Regular' | 'New';
  totalSpent: number;
  purchaseCount: number;
  avgOrderValue: number;
  lastPurchaseDate?: string;
  lifetimeValue: number;
}

export function useCustomerSegments() {
  const { data: customers, isLoading: customersLoading } = useRealCustomers();
  const { data: purchases, isLoading: purchasesLoading } = useRealPurchases();

  const segments = useMemo(() => {
    if (!customers || !purchases) return [];

    const result: CustomerSegment[] = customers.map((customer: any) => {
      // 해당 고객의 모든 구매 내역
      const customerPurchases = purchases.filter(
        (p: any) => p.customer_id === customer.customer_id
      );

      const totalSpent = customerPurchases.reduce(
        (sum: number, p: any) => sum + (parseFloat(p.price) || 0),
        0
      );

      const purchaseCount = customerPurchases.length;
      const avgOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

      // 마지막 구매일
      const lastPurchase = customerPurchases.sort(
        (a: any, b: any) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
      )[0];

      // 세그먼트 분류 로직
      let segment: 'VIP' | 'Regular' | 'New' = 'New';
      if (purchaseCount >= 10 && totalSpent >= 500000) {
        segment = 'VIP';
      } else if (purchaseCount >= 3) {
        segment = 'Regular';
      }

      return {
        customer_id: customer.customer_id,
        name: customer.name,
        segment,
        totalSpent,
        purchaseCount,
        avgOrderValue,
        lastPurchaseDate: lastPurchase?.purchase_date,
        lifetimeValue: totalSpent, // 간단히 총 구매액을 LTV로 사용
      };
    });

    return result;
  }, [customers, purchases]);

  // 세그먼트별 통계
  const segmentStats = useMemo(() => {
    const vip = segments.filter(s => s.segment === 'VIP');
    const regular = segments.filter(s => s.segment === 'Regular');
    const newCustomers = segments.filter(s => s.segment === 'New');

    return {
      vip: {
        count: vip.length,
        totalRevenue: vip.reduce((sum, c) => sum + c.totalSpent, 0),
        avgLTV: vip.length > 0 ? vip.reduce((sum, c) => sum + c.lifetimeValue, 0) / vip.length : 0,
      },
      regular: {
        count: regular.length,
        totalRevenue: regular.reduce((sum, c) => sum + c.totalSpent, 0),
        avgLTV: regular.length > 0 ? regular.reduce((sum, c) => sum + c.lifetimeValue, 0) / regular.length : 0,
      },
      new: {
        count: newCustomers.length,
        totalRevenue: newCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
        avgLTV: newCustomers.length > 0 ? newCustomers.reduce((sum, c) => sum + c.lifetimeValue, 0) / newCustomers.length : 0,
      },
    };
  }, [segments]);

  return {
    segments,
    segmentStats,
    isLoading: customersLoading || purchasesLoading,
    totalCustomers: segments.length,
  };
}

/**
 * 특정 세그먼트의 고객 목록 가져오기
 */
export function useSegmentCustomers(segmentType: 'VIP' | 'Regular' | 'New') {
  const { segments, isLoading } = useCustomerSegments();

  const filteredCustomers = useMemo(() => {
    return segments.filter(s => s.segment === segmentType);
  }, [segments, segmentType]);

  return {
    customers: filteredCustomers,
    isLoading,
    count: filteredCustomers.length,
  };
}
