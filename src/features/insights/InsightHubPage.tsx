/**
 * InsightHubPage.tsx
 *
 * 통합 인사이트 허브 - 대시보드 + 분석 + AI 추천 + 예측
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalDateFilter } from '@/components/common/GlobalDateFilter';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

// 탭 컴포넌트들
import { OverviewTab } from '@/features/insights/tabs/OverviewTab';
import { StoreTab } from '@/features/insights/tabs/StoreTab';
import { CustomerTab } from '@/features/insights/tabs/CustomerTab';
import { ProductTab } from '@/features/insights/tabs/ProductTab';
import { PredictionTab } from '@/features/insights/tabs/PredictionTab';
import { AIRecommendationTab } from '@/features/insights/tabs/AIRecommendationTab';

const tabs = [
  { value: 'overview', label: '개요', icon: LayoutDashboard },
  { value: 'store', label: '매장', icon: Store },
  { value: 'customer', label: '고객', icon: Users },
  { value: 'product', label: '상품', icon: Package },
  { value: 'prediction', label: '예측', icon: TrendingUp },
  { value: 'ai', label: 'AI추천', icon: Sparkles },
];

export default function InsightHubPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">📊 인사이트 허브</h1>
            <p className="text-muted-foreground mt-1">
              실시간 대시보드 + 분석 + AI 추천 + 예측
            </p>
          </div>
          <GlobalDateFilter />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="store" className="space-y-6">
            <StoreTab />
          </TabsContent>

          <TabsContent value="customer" className="space-y-6">
            <CustomerTab />
          </TabsContent>

          <TabsContent value="product" className="space-y-6">
            <ProductTab />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6">
            <PredictionTab />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIRecommendationTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
