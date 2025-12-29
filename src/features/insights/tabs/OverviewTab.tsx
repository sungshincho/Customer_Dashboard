/**
 * OverviewTab.tsx
 *
 * 인사이트 허브 - 개요 탭
 * 3D Glassmorphism + Bento Grid Layout
 */

import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Box,
  Target,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useInsightMetrics } from '../hooks/useInsightMetrics';
import { MetricCard, FunnelChart, formatCurrency, formatPercent } from '../components';
import { Glass3DCard, Icon3D, Badge3D, text3DStyles } from '@/components/ui/glass-card';
import { GoalProgressWidget } from '@/components/goals/GoalProgressWidget';

export function OverviewTab() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { data: metrics, isLoading } = useInsightMetrics();
  const { data: recommendations } = useAIRecommendations(selectedStore?.id);

  const topRecommendations = recommendations?.slice(0, 2) || [];

  if (isLoading) {
    return (
      <div className="grid gap-5 grid-cols-12 auto-rows-fr">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`col-span-${i < 4 ? 3 : 6} animate-pulse`}
          >
            <div className="h-40 rounded-3xl bg-white/50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bento Grid - Main KPIs */}
      <div className="grid gap-5 grid-cols-12">
        {/* Footfall - Large Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 row-span-2">
          <Glass3DCard className="h-full">
            <div className="p-7 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Icon3D size={48}>
                  <Users className="h-5 w-5 text-gray-800" />
                </Icon3D>
                <div>
                  <p style={{ ...text3DStyles.label, fontSize: '9px' }}>FOOTFALL</p>
                  <p className="text-sm" style={text3DStyles.body}>총 입장</p>
                </div>
              </div>

              <div className="flex-1">
                <span
                  className="text-5xl block leading-none"
                  style={text3DStyles.heroNumber}
                >
                  {metrics?.footfall.toLocaleString() || '0'}
                </span>
                <p className="text-sm mt-3" style={text3DStyles.body}>
                  기간 내 총 입장 횟수
                </p>
              </div>

              {metrics?.changes.footfall !== undefined && (
                <div className="mt-4">
                  <Badge3D>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">
                      전주 대비 +{metrics.changes.footfall.toFixed(1)}%
                    </span>
                  </Badge3D>
                </div>
              )}
            </div>
          </Glass3DCard>
        </div>

        {/* Unique Visitors */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <MetricCard
            icon={<UserCheck className="h-5 w-5" />}
            labelEn="UNIQUE VISITORS"
            label="순 방문객"
            value={metrics?.uniqueVisitors.toLocaleString() || '0'}
            subLabel={metrics?.visitFrequency ? `평균 ${metrics.visitFrequency.toFixed(1)}회 방문` : undefined}
            change={metrics?.changes.uniqueVisitors}
          />
        </div>

        {/* Revenue - Dark Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 row-span-2">
          <Glass3DCard dark className="h-full">
            <div className="p-7 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Icon3D size={48} dark>
                  <span
                    className="text-lg"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(200,200,210,0.8) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ₩
                  </span>
                </Icon3D>
                <div>
                  <p style={{ ...text3DStyles.darkLabel, fontSize: '9px' }}>REVENUE</p>
                  <p className="text-sm" style={text3DStyles.darkBody}>총 매출</p>
                </div>
              </div>

              <div className="flex-1">
                <span
                  className="text-3xl block"
                  style={text3DStyles.darkNumber}
                >
                  {formatCurrency(metrics?.revenue || 0)}
                </span>
                <p className="text-sm mt-3" style={text3DStyles.darkBody}>
                  객단가 {formatCurrency(metrics?.atv || 0)}
                </p>
              </div>

              {metrics?.changes.revenue !== undefined && (
                <div className="mt-4">
                  <Badge3D dark>
                    <TrendingUp className="h-3.5 w-3.5 text-white/80" />
                    <span className="text-xs font-semibold text-white/90">
                      전월 대비 +{metrics.changes.revenue.toFixed(1)}%
                    </span>
                  </Badge3D>
                </div>
              )}
            </div>
          </Glass3DCard>
        </div>

        {/* Funnel Chart - Large */}
        <div className="col-span-12 lg:col-span-3 row-span-2">
          {metrics?.funnel && <FunnelChart data={metrics.funnel} className="h-full" />}
        </div>

        {/* Conversion */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            labelEn="CONVERSION"
            label="구매 전환율"
            value={formatPercent(metrics?.conversionRate || 0)}
            subLabel={`${metrics?.transactions.toLocaleString() || 0}건 거래`}
            change={metrics?.changes.conversionRate}
            changeUnit="%p"
          />
        </div>
      </div>

      {/* Second Row - Goals & AI */}
      <div className="grid gap-5 grid-cols-12">
        {/* Goals Widget */}
        <div className="col-span-12 lg:col-span-6">
          <GoalProgressWidget />
        </div>

        {/* AI Insight Card */}
        <div className="col-span-12 lg:col-span-6">
          <Glass3DCard>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, #222228 0%, #2c2c35 45%, #1c1c24 100%)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Sparkles
                    className="h-4 w-4"
                    style={{
                      color: 'transparent',
                      background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d5 100%)',
                      WebkitBackgroundClip: 'text',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                    }}
                  />
                </div>
                <div>
                  <h3 style={text3DStyles.heading}>오늘의 AI 인사이트</h3>
                  <p className="text-xs mt-0.5" style={text3DStyles.body}>
                    AI가 분석한 주요 인사이트
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {topRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {topRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(248,248,252,0.85) 50%, rgba(255,255,255,0.92) 100%)',
                        border: '1px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03), inset 0 1px 2px rgba(255,255,255,1)',
                      }}
                    >
                      {/* Highlight */}
                      <div
                        className="absolute top-0 left-0 right-0 pointer-events-none"
                        style={{
                          height: '45%',
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, transparent 100%)',
                          borderRadius: '12px 12px 0 0',
                        }}
                      />

                      <div className="relative z-10">
                        {/* Priority Badge */}
                        <div
                          className="inline-block px-2 py-1 rounded mb-2"
                          style={{
                            background: 'linear-gradient(145deg, #1c1c22 0%, #282830 100%)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          }}
                        >
                          <span
                            className="text-[8px] font-bold tracking-wider uppercase"
                            style={{
                              background: 'linear-gradient(180deg, #ffffff 0%, #d5d5da 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {rec.priority === 'high' ? '높은 우선순위' : rec.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
                          </span>
                        </div>

                        <h4 className="text-sm mb-1" style={text3DStyles.heading}>
                          {rec.title}
                        </h4>
                        <p className="text-xs leading-relaxed" style={text3DStyles.body}>
                          {rec.description}
                        </p>

                        {rec.expected_impact && (
                          <p
                            className="text-xs mt-2 font-semibold"
                            style={{ color: '#059669' }}
                          >
                            예상 효과: 매출 +{rec.expected_impact.revenue_increase?.toLocaleString() || '?'}원
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* View All Button */}
                  <button
                    onClick={() => navigate('/insights?tab=ai')}
                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
                      border: '1px solid rgba(255,255,255,0.95)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,1)',
                      ...text3DStyles.body,
                    }}
                  >
                    모든 AI 추천 보기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p style={text3DStyles.body}>AI 인사이트가 없습니다</p>
                  <p className="text-xs mt-1" style={text3DStyles.body}>
                    데이터가 축적되면 AI가 인사이트를 생성합니다
                  </p>
                </div>
              )}
            </div>
          </Glass3DCard>
        </div>
      </div>

      {/* Third Row - Quick Stats */}
      <div className="grid gap-5 grid-cols-12">
        {/* Today's Visitors */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Glass3DCard>
            <div className="p-6 text-center flex flex-col items-center justify-center h-full">
              {/* Orb Icon */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3 relative"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(225,225,235,0.95) 30%, rgba(245,245,252,0.98) 60%, rgba(235,235,245,0.95) 100%)',
                  border: '1px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.07), 0 8px 16px rgba(0,0,0,0.06), inset 0 4px 12px rgba(255,255,255,1), inset 0 -4px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Highlight */}
                <div
                  className="absolute"
                  style={{
                    top: '5px',
                    left: '16%',
                    width: '42%',
                    height: '32%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: '50%',
                    filter: 'blur(1px)',
                  }}
                />
                <span className="text-xl relative z-10">◈</span>
              </div>

              <p style={{ ...text3DStyles.label, fontSize: '9px' }}>TODAY</p>
              <p className="text-4xl mt-1" style={text3DStyles.number}>892</p>
              <p className="text-xs mt-1" style={text3DStyles.body}>오늘 방문</p>
            </div>
          </Glass3DCard>
        </div>

        {/* Average Stay Time */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Glass3DCard>
            <div className="p-5 flex items-center justify-between h-full">
              <div>
                <p style={{ ...text3DStyles.label, fontSize: '9px' }}>AVG. STAY TIME</p>
                <p className="text-3xl mt-1" style={text3DStyles.number}>12:34</p>
                <p className="text-xs mt-1" style={text3DStyles.body}>평균 체류 시간</p>
              </div>
              <Icon3D size={44}>
                <Clock className="h-5 w-5 text-gray-800" />
              </Icon3D>
            </div>
          </Glass3DCard>
        </div>

        {/* Peak Hour */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <Glass3DCard>
            <div className="p-5 flex items-center justify-between h-full">
              <div>
                <p style={{ ...text3DStyles.label, fontSize: '9px' }}>PEAK HOUR</p>
                <p className="text-3xl mt-1" style={text3DStyles.number}>14:00</p>
                <p className="text-xs mt-1" style={text3DStyles.body}>피크 타임</p>
              </div>
              <Icon3D size={44}>
                <BarChart3 className="h-5 w-5 text-gray-800" />
              </Icon3D>
            </div>
          </Glass3DCard>
        </div>

        {/* Active Zones */}
        <div className="col-span-12 lg:col-span-3">
          <Glass3DCard>
            <div className="p-5 flex items-center justify-between h-full">
              <div>
                <p style={{ ...text3DStyles.label, fontSize: '9px' }}>ACTIVE ZONES</p>
                <p className="text-3xl mt-1" style={text3DStyles.number}>12</p>
                <p className="text-xs mt-1" style={text3DStyles.body}>활성 구역</p>
              </div>
              <Icon3D size={44}>
                <Target className="h-5 w-5 text-gray-800" />
              </Icon3D>
            </div>
          </Glass3DCard>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
