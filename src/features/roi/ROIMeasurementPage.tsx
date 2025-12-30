/**
 * ROI 측정 대시보드 메인 페이지
 *
 * 모든 시뮬레이션(2D/3D) 적용 결과를 한 곳에서 추적하고 ROI를 측정
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingUp, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';

import { useROISummary } from './hooks/useROISummary';
import { useCategoryPerformanceGrouped } from './hooks/useCategoryPerformance';
import { useAppliedStrategies } from './hooks/useAppliedStrategies';

import {
  ROISummaryCards,
  CategoryPerformanceTable,
  AppliedStrategyTable,
  StrategyDetailModal,
  AIInsightsCard,
} from './components';

import type { DateRange } from './types/roi.types';

export const ROIMeasurementPage: React.FC = () => {
  const { selectedStore } = useSelectedStore();
  const [dateRange, setDateRange] = useState<DateRange>('90d');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
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

  // 데이터 훅
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useROISummary(dateRange);

  const {
    data: categoryData,
    isLoading: categoryLoading,
    refetch: refetchCategory,
  } = useCategoryPerformanceGrouped(dateRange);

  const {
    data: strategies,
    isLoading: strategiesLoading,
    refetch: refetchStrategies,
  } = useAppliedStrategies(dateRange);

  const handleRefresh = () => {
    refetchSummary();
    refetchCategory();
    refetchStrategies();
  };

  const handleExportAll = () => {
    // 전체 데이터 내보내기 로직 (간단히 JSON 형태로)
    const exportData = {
      summary,
      categoryData,
      strategies,
      exportedAt: new Date().toISOString(),
      dateRange,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roi_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 min-h-screen">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
              </div>
              ROI 측정 대시보드
            </h1>
            <p className={`mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              모든 시뮬레이션 적용 결과를 한눈에 추적하고 분석하세요
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className={`w-32 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">최근 7일</SelectItem>
                <SelectItem value="30d">최근 30일</SelectItem>
                <SelectItem value="90d">최근 90일</SelectItem>
                <SelectItem value="all">전체 기간</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className={isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportAll} 
              className={isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}
            >
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        {/* KPI 요약 카드 */}
        <ROISummaryCards data={summary} isLoading={summaryLoading} />

        {/* 카테고리별 성과 */}
        <CategoryPerformanceTable
          data={categoryData || { '2d': [], '3d': [] }}
          isLoading={categoryLoading}
        />

        {/* 적용 이력 테이블 */}
        <AppliedStrategyTable
          data={strategies}
          isLoading={strategiesLoading}
          onRowClick={(id) => setSelectedStrategyId(id)}
        />

        {/* AI 인사이트 */}
        <AIInsightsCard dateRange={dateRange} />

        {/* 전략 상세 모달 */}
        {selectedStrategyId && (
          <StrategyDetailModal
            strategyId={selectedStrategyId}
            onClose={() => setSelectedStrategyId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ROIMeasurementPage;
