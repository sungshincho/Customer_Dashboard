/**
 * AI 인사이트 카드 컴포넌트
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { useCategoryPerformanceGrouped } from '../hooks/useCategoryPerformance';
import { useROISummary } from '../hooks/useROISummary';
import { getModuleDisplayName } from '../utils/moduleConfig';
import type { DateRange, CategoryPerformance } from '../types/roi.types';
import { cn } from '@/lib/utils';

interface AIInsightsCardProps {
  dateRange: DateRange;
}

// 인사이트 생성 로직
const generateInsights = (
  summary: { averageRoi: number; successRate: number; totalApplied: number } | undefined,
  categoryData: { '2d': CategoryPerformance[]; '3d': CategoryPerformance[] }
): {
  analysis: string[];
  recommendations: string[];
} => {
  const analysis: string[] = [];
  const recommendations: string[] = [];

  if (!summary || summary.totalApplied === 0) {
    return {
      analysis: ['아직 적용된 전략이 없습니다.'],
      recommendations: ['인사이트 허브나 디지털트윈 스튜디오에서 첫 번째 전략을 적용해보세요.'],
    };
  }

  // 전체 데이터 합치기
  const allCategories = [...categoryData['2d'], ...categoryData['3d']].filter(
    (c) => c.appliedCount > 0
  );

  if (allCategories.length === 0) {
    return {
      analysis: ['적용된 전략 데이터를 분석 중입니다.'],
      recommendations: ['더 많은 데이터가 쌓이면 정확한 인사이트를 제공할 수 있습니다.'],
    };
  }

  // 최고 ROI 모듈 찾기
  const bestROI = allCategories.reduce((best, curr) =>
    curr.averageRoi > best.averageRoi ? curr : best
  );

  // 최고 성공률 모듈 찾기 (적용 건수 2건 이상)
  const categoriesWithEnoughData = allCategories.filter((c) => c.appliedCount >= 2);
  const bestSuccessRate = categoriesWithEnoughData.length > 0
    ? categoriesWithEnoughData.reduce((best, curr) => {
        const currRate = curr.successCount / curr.appliedCount;
        const bestRate = best.successCount / best.appliedCount;
        return currRate > bestRate ? curr : best;
      })
    : null;

  // ROI가 낮은 모듈 찾기
  const lowROI = allCategories.filter((c) => c.averageRoi < 100 && c.appliedCount > 0);

  // 분석 생성
  if (bestROI.averageRoi > 0) {
    analysis.push(
      `"${getModuleDisplayName(bestROI.sourceModule)}" 전략이 가장 높은 평균 ROI (${bestROI.averageRoi.toFixed(0)}%)를 기록했습니다.`
    );
  }

  if (bestSuccessRate && bestSuccessRate.appliedCount > 0) {
    const rate = ((bestSuccessRate.successCount / bestSuccessRate.appliedCount) * 100).toFixed(1);
    analysis.push(
      `"${getModuleDisplayName(bestSuccessRate.sourceModule)}" 성공률이 ${rate}%로 가장 안정적입니다.`
    );
  }

  if (lowROI.length > 0) {
    const lowROINames = lowROI.map((c) => `"${getModuleDisplayName(c.sourceModule)}"`).join(', ');
    analysis.push(`${lowROINames}은 예상 대비 실제 ROI 차이가 있어 개선이 필요합니다.`);
  }

  // 추천 생성
  if (bestROI.averageRoi >= 200 && bestSuccessRate) {
    recommendations.push(
      `${getModuleDisplayName(bestROI.sourceModule)} + ${getModuleDisplayName(bestSuccessRate.sourceModule)} 조합 전략을 추천합니다.`
    );
  }

  if (lowROI.length > 0) {
    recommendations.push(`${lowROI.map(c => getModuleDisplayName(c.sourceModule)).join(', ')} 적용 전 A/B 테스트를 권장합니다.`);
  }

  // 계절성 추천 (12월)
  const currentMonth = new Date().getMonth() + 1;
  if (currentMonth === 12) {
    recommendations.push('12월 성수기: 재고 최적화와 프로모션 우선 적용을 권장합니다.');
  }

  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push('더 많은 전략을 적용하여 데이터를 축적하면 정교한 추천이 가능합니다.');
  }

  return { analysis, recommendations };
};

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ dateRange }) => {
  const { data: summary, isLoading: summaryLoading } = useROISummary(dateRange);
  const { data: categoryData, isLoading: categoryLoading } = useCategoryPerformanceGrouped(dateRange);

  const isLoading = summaryLoading || categoryLoading;

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-5/6 bg-white/10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const insights = generateInsights(summary, categoryData);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI 인사이트
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 성과 분석 */}
        <div>
          <h4 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            성과 분석
          </h4>
          <ul className="space-y-1.5">
            {insights.analysis.map((item, i) => (
              <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-white/30 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 추천 */}
        <div>
          <h4 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            추천
          </h4>
          <ul className="space-y-1.5">
            {insights.recommendations.map((item, i) => (
              <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                <span className="text-yellow-400/50 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsCard;
