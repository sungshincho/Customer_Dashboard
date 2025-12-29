/**
 * InsightHubPage.tsx
 *
 * 통합 인사이트 허브 - 3D Glassmorphism Design
 * 대시보드 + 분석 + AI 추천 + 예측
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

// Tab Components
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
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Chrome highlight */}
              <div
                className="absolute"
                style={{
                  top: '2px',
                  left: '18%',
                  right: '18%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                }}
              />
              <span
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #c8c8cc 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
              >
                N
              </span>
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                }}
              >
                인사이트 허브
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: '#515158',
                  textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                실시간 대시보드 + 분석 + AI 추천
              </p>
            </div>
          </div>

          <GlobalDateFilter />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Glass Tab List */}
          <div
            className="inline-block rounded-2xl p-[1.5px]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.04)',
            }}
          >
            <TabsList
              className="h-auto p-1.5 gap-1"
              style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(250,250,254,0.85) 50%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(40px)',
                borderRadius: '15px',
              }}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 data-[state=inactive]:bg-transparent"
                  style={
                    activeTab === tab.value
                      ? {
                          background: 'linear-gradient(145deg, #222228 0%, #2c2c34 45%, #1c1c24 100%)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.1)',
                        }
                      : {
                          background: 'transparent',
                          border: '1px solid transparent',
                        }
                  }
                >
                  <tab.icon
                    className="h-4 w-4"
                    style={
                      activeTab === tab.value
                        ? {
                            color: 'transparent',
                            background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d5 100%)',
                            WebkitBackgroundClip: 'text',
                          }
                        : {
                            color: '#515158',
                          }
                    }
                  />
                  <span
                    className="hidden sm:inline text-xs font-medium"
                    style={
                      activeTab === tab.value
                        ? {
                            background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d5 40%, #ffffff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                          }
                        : {
                            color: '#515158',
                            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                          }
                    }
                  >
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="store" className="space-y-6 mt-0">
            <StoreTab />
          </TabsContent>

          <TabsContent value="customer" className="space-y-6 mt-0">
            <CustomerTab />
          </TabsContent>

          <TabsContent value="product" className="space-y-6 mt-0">
            <ProductTab />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6 mt-0">
            <PredictionTab />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-0">
            <AIRecommendationTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
