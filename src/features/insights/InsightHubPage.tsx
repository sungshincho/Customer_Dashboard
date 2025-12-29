/**
 * InsightHubPage.tsx
 * 통합 인사이트 허브 - 3D Glassmorphism + 탭 아이콘 수정
 */

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { GlobalDateFilter } from '@/components/common/GlobalDateFilter';
import { useTheme } from '@/hooks/useTheme';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

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

const text3D = {
  heroNumber: {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.1))',
  } as React.CSSProperties,
  body: {
    fontWeight: 500,
    color: '#515158',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
  } as React.CSSProperties,
  darkHeroNumber: {
    fontWeight: 800,
    letterSpacing: '-0.04em',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
  } as React.CSSProperties,
  darkBody: {
    fontWeight: 500,
    color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties,
};

export default function InsightHubPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, #ffffff 0%, #c8c8cc 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                N
              </span>
            </div>
            <div>
              <h1 style={{ fontSize: '24px', margin: 0, ...(isDark ? text3D.darkHeroNumber : text3D.heroNumber) }}>
                인사이트 허브
              </h1>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0', ...(isDark ? text3D.darkBody : text3D.body) }}>
                실시간 대시보드 + 분석 + AI 추천
              </p>
            </div>
          </div>
          <GlobalDateFilter />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div
            style={{
              display: 'inline-block',
              borderRadius: '18px',
              padding: '1.5px',
              background: isDark
                ? 'linear-gradient(145deg, rgba(75,75,85,0.8) 0%, rgba(50,50,60,0.6) 50%, rgba(65,65,75,0.8) 100%)'
                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 8px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '6px',
                background: isDark
                  ? 'linear-gradient(165deg, rgba(40,40,50,0.95) 0%, rgba(30,30,40,0.9) 100%)'
                  : 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(250,250,254,0.88) 50%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(40px)',
                borderRadius: '17px',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                      background: isActive
                        ? 'linear-gradient(145deg, #222228 0%, #2c2c34 45%, #1c1c24 100%)'
                        : 'transparent',
                      boxShadow: isActive
                        ? '0 2px 4px rgba(0,0,0,0.16), 0 4px 8px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.1)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: isActive ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.5)' : '#515158'),
                      }}
                    />
                    <span
                      className="hidden sm:inline"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: isActive ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.5)' : '#515158'),
                      }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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
