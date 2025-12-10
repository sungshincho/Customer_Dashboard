/**
 * AIRecommendTab/index.tsx
 *
 * AI 의사결정 허브
 * 예측 → 최적화 → 추천 → 실행 → 측정 루프
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { useApplyRecommendation } from '@/hooks/useROITracking';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import {
  ActiveStrategies,
  PredictSection,
  OptimizeSection,
  RecommendSection,
  ExecuteSection,
  MeasureSection,
} from './components';

import type {
  DemandForecast,
  SeasonTrend,
  RiskPrediction,
  PriceOptimization,
  InventoryOptimization,
  StrategyRecommendation,
  Campaign,
  ROIMeasurement,
  ROISummary,
  ActiveStrategy,
} from './types/aiDecision.types';

export function AIDecisionHub() {
  const navigate = useNavigate();
  const { selectedStore } = useSelectedStore();
  const { dateRange } = useDateFilterStore();
  const { data: aiRecommendations = [], isLoading: isLoadingRecs } = useAIRecommendations(selectedStore?.id);
  const applyRecommendation = useApplyRecommendation();

  // 예측 데이터 (mock - 실제 구현 시 훅으로 분리)
  const demandForecast: DemandForecast = useMemo(() => ({
    period: '7d',
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    confidence: 85,
    trend: 'up',
    percentChange: 12.5,
  }), []);

  const visitorForecast: DemandForecast = useMemo(() => ({
    period: '7d',
    predictedRevenue: 32500000,
    predictedVisitors: 1250,
    confidence: 82,
    trend: 'up',
    percentChange: 8.3,
  }), []);

  const seasonTrend: SeasonTrend = useMemo(() => ({
    currentSeason: '12월 성수기',
    peakPeriod: { start: '12/20', end: '12/25' },
    expectedImpact: 35,
    recommendations: ['재고 확보', '인력 증원', '프로모션 준비'],
  }), []);

  const riskPredictions: RiskPrediction[] = useMemo(() => [
    {
      id: '1',
      type: 'stockout',
      severity: 'high',
      productName: '겨울 패딩 A',
      description: '현재 재고 소진 예상: 3일 내',
      probability: 85,
      mitigationActions: ['긴급 발주', '대체 상품 노출'],
    },
    {
      id: '2',
      type: 'stockout',
      severity: 'medium',
      productName: '니트 B',
      description: '현재 재고 소진 예상: 7일 내',
      probability: 65,
      mitigationActions: ['추가 발주 권장'],
    },
  ], []);

  // 최적화 데이터 (mock)
  const priceOptimization: PriceOptimization = useMemo(() => ({
    totalProducts: 156,
    optimizableCount: 23,
    potentialRevenueIncrease: 4850000,
    potentialRevenueIncreasePercent: 15.2,
    actions: [
      {
        id: '1',
        productId: 'prod-1',
        productName: '겨울 아우터',
        currentValue: 150000,
        recommendedValue: 162000,
        expectedImpact: 1200000,
        confidence: 88,
      },
      {
        id: '2',
        productId: 'prod-2',
        productName: '여름 재고',
        currentValue: 80000,
        recommendedValue: 64000,
        expectedImpact: 800000,
        confidence: 92,
      },
    ],
  }), []);

  const inventoryOptimization: InventoryOptimization = useMemo(() => ({
    totalItems: 89,
    orderRecommendations: 12,
    stockoutPrevention: 5,
    overStockReduction: 3,
    actions: [
      {
        id: '1',
        productId: 'prod-1',
        productName: '패딩 A',
        currentValue: 10,
        recommendedValue: 60,
        expectedImpact: 0,
        confidence: 95,
      },
      {
        id: '2',
        productId: 'prod-2',
        productName: '니트 B',
        currentValue: 15,
        recommendedValue: 45,
        expectedImpact: 0,
        confidence: 88,
      },
    ],
  }), []);

  // 추천 전략 데이터 변환
  const strategyRecommendations: StrategyRecommendation[] = useMemo(() => {
    return aiRecommendations.slice(0, 3).map((rec, index) => ({
      id: rec.id,
      rank: (index + 1) as 1 | 2 | 3,
      title: rec.title,
      description: rec.description,
      type: 'discount' as const,
      confidence: rec.priority === 'high' ? 94 : rec.priority === 'medium' ? 87 : 75,
      targetAudience: '전체 고객',
      duration: 7,
      expectedResults: {
        revenueIncrease: rec.expected_impact?.revenue_increase || 0,
        conversionIncrease: 2.1,
        roi: rec.priority === 'high' ? 312 : rec.priority === 'medium' ? 187 : 120,
      },
      status: rec.status === 'pending' ? 'recommended' as const : rec.status as any,
    }));
  }, [aiRecommendations]);

  // 진행 중인 전략 (mock)
  const activeStrategies: ActiveStrategy[] = useMemo(() => [
    {
      id: '1',
      name: '겨울 패딩 10% 할인',
      type: 'discount',
      status: 'active',
      startDate: '2024-12-07',
      endDate: '2024-12-14',
      daysActive: 3,
      expectedROI: 245,
      currentROI: 198,
      progress: 43,
      trend: 'up' as const,
    },
    {
      id: '2',
      name: '재고 발주 최적화',
      type: 'bundle',
      status: 'active',
      startDate: '2024-12-09',
      endDate: '2024-12-16',
      daysActive: 1,
      expectedROI: 150,
      currentROI: 145,
      progress: 14,
      trend: 'stable' as const,
    },
  ], []);

  // 실행 중인 캠페인 (mock)
  const campaigns: Campaign[] = useMemo(() => [
    {
      id: '1',
      strategyId: 's1',
      name: '겨울 패딩 10% 할인',
      description: '시즌 패딩 전 품목 10% 할인',
      type: 'discount',
      startDate: '2024-12-07',
      endDate: '2024-12-14',
      status: 'active',
      progress: 43,
      expectedROI: 245,
      currentROI: 198,
      metrics: {
        revenue: 4200000,
        conversions: 85,
        reach: 1200,
      },
    },
  ], []);

  // ROI 측정 데이터 (mock)
  const roiMeasurements: ROIMeasurement[] = useMemo(() => [
    {
      id: '1',
      campaignId: 'c1',
      campaignName: '블랙프라이데이',
      type: 'discount',
      period: { start: '2024-11-24', end: '2024-11-30', days: 7 },
      expectedROI: 280,
      actualROI: 312,
      status: 'exceeded',
      baselineRevenue: 15000000,
      actualRevenue: 19680000,
      revenueChange: 4680000,
      revenueChangePercent: 31.2,
      insights: ['할인율 최적화로 기대치 초과'],
    },
    {
      id: '2',
      campaignId: 'c2',
      campaignName: '신상품 런칭',
      type: 'event',
      period: { start: '2024-12-01', end: '2024-12-07', days: 7 },
      expectedROI: 150,
      actualROI: 98,
      status: 'missed',
      baselineRevenue: 10000000,
      actualRevenue: 10980000,
      revenueChange: 980000,
      revenueChangePercent: 9.8,
      insights: ['타겟 고객층 재검토 필요'],
    },
  ], []);

  const roiSummary: ROISummary = useMemo(() => ({
    totalCampaigns: 15,
    completedCampaigns: 12,
    averageROI: 205,
    totalRevenueImpact: 28500000,
    successRate: 75,
    topPerformingType: 'discount',
    learnings: [
      {
        id: '1',
        insight: '"할인 프로모션"이 "런칭 프로모션"보다 평균 45% 높은 ROI',
        dataPoints: 24,
        confidence: 92,
        applicableTo: ['discount', 'event'],
      },
      {
        id: '2',
        insight: '최적 프로모션 기간: 5-7일',
        dataPoints: 18,
        confidence: 85,
        applicableTo: ['discount', 'bundle', 'targeting'],
      },
      {
        id: '3',
        insight: '타겟팅 전략이 전체 대상보다 ROI 23% 높음',
        dataPoints: 15,
        confidence: 88,
        applicableTo: ['targeting'],
      },
    ],
  }), []);

  // 핸들러
  const handleViewStrategyDetails = (id: string) => {
    console.log('View strategy details:', id);
  };

  const handleCreateNewStrategy = () => {
    navigate('/insights?tab=ai');
  };

  const handleViewPredictDetails = (type: string) => {
    console.log('View predict details:', type);
  };

  const handleOptimizeDetails = (type: 'price' | 'inventory') => {
    console.log('View optimize details:', type);
  };

  const handleApplyOptimization = (type: 'price' | 'inventory') => {
    console.log('Apply optimization:', type);
  };

  const handleSimulateStrategy = (id: string) => {
    console.log('Simulate strategy:', id);
    navigate('/studio');
  };

  const handleConfigureStrategy = (id: string) => {
    console.log('Configure strategy:', id);
  };

  const handleExecuteStrategy = async (id: string) => {
    console.log('Execute strategy:', id);
    await applyRecommendation.mutateAsync(id);
  };

  const handlePauseCampaign = (id: string) => {
    console.log('Pause campaign:', id);
  };

  const handleResumeCampaign = (id: string) => {
    console.log('Resume campaign:', id);
  };

  const handleStopCampaign = (id: string) => {
    console.log('Stop campaign:', id);
  };

  const handleEditCampaign = (id: string) => {
    console.log('Edit campaign:', id);
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          AI 의사결정 허브
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          데이터 기반 예측 → 최적화 → 추천 → 실행 → 측정
        </p>
      </div>

      {/* 진행 중인 전략 */}
      <ActiveStrategies
        strategies={activeStrategies}
        onViewDetails={handleViewStrategyDetails}
        onCreateNew={handleCreateNewStrategy}
      />

      <Separator />

      {/* 1단계: 예측 */}
      <PredictSection
        demandForecast={demandForecast}
        visitorForecast={visitorForecast}
        seasonTrend={seasonTrend}
        riskPredictions={riskPredictions}
        onViewDetails={handleViewPredictDetails}
        isLoading={false}
      />

      <Separator />

      {/* 2단계: 최적화 */}
      <OptimizeSection
        priceOptimization={priceOptimization}
        inventoryOptimization={inventoryOptimization}
        onViewDetails={handleOptimizeDetails}
        onApply={handleApplyOptimization}
        isLoading={false}
      />

      <Separator />

      {/* 3단계: 추천 */}
      <RecommendSection
        recommendations={strategyRecommendations}
        onSimulate={handleSimulateStrategy}
        onConfigure={handleConfigureStrategy}
        onExecute={handleExecuteStrategy}
        isLoading={isLoadingRecs}
      />

      <Separator />

      {/* 4단계: 실행 */}
      <ExecuteSection
        campaigns={campaigns}
        onPause={handlePauseCampaign}
        onResume={handleResumeCampaign}
        onStop={handleStopCampaign}
        onEdit={handleEditCampaign}
        isLoading={false}
      />

      <Separator />

      {/* 5단계: 측정 */}
      <MeasureSection
        measurements={roiMeasurements}
        summary={roiSummary}
        isLoading={false}
      />
    </div>
  );
}

export default AIDecisionHub;
