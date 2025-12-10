/**
 * PredictSection.tsx
 *
 * 1단계: 예측 섹션
 * - 수요 예측
 * - 방문자 예측
 * - 시즌 트렌드
 * - 리스크 예측
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemandForecast, SeasonTrend, RiskPrediction } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface PredictSectionProps {
  demandForecast: DemandForecast | null;
  visitorForecast: DemandForecast | null;
  seasonTrend: SeasonTrend | null;
  riskPredictions: RiskPrediction[];
  onViewDetails: (type: string) => void;
  isLoading?: boolean;
}

export function PredictSection({
  demandForecast,
  visitorForecast,
  seasonTrend,
  riskPredictions,
  onViewDetails,
  isLoading,
}: PredictSectionProps) {
  const highRiskCount = riskPredictions.filter(r => r.severity === 'high').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
          1
        </div>
        <h3 className="text-lg font-semibold">예측 (Predict)</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 수요 예측 카드 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              수요 예측
            </CardTitle>
            <p className="text-xs text-muted-foreground">다음 7일 예상 매출</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : demandForecast ? (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(demandForecast.predictedRevenue)}
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  demandForecast.trend === 'up' ? 'text-green-500' :
                  demandForecast.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                )}>
                  {demandForecast.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : demandForecast.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  전주 대비 {demandForecast.percentChange >= 0 ? '+' : ''}
                  {demandForecast.percentChange.toFixed(1)}%
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('demand')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>

        {/* 방문자 예측 카드 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              방문자 예측
            </CardTitle>
            <p className="text-xs text-muted-foreground">다음 7일 예상 방문</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : visitorForecast ? (
              <>
                <div className="text-2xl font-bold">
                  {visitorForecast.predictedVisitors.toLocaleString()}명
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  visitorForecast.trend === 'up' ? 'text-green-500' :
                  visitorForecast.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                )}>
                  {visitorForecast.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : visitorForecast.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  전주 대비 {visitorForecast.percentChange >= 0 ? '+' : ''}
                  {visitorForecast.percentChange.toFixed(1)}%
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('visitor')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>

        {/* 시즌 트렌드 카드 */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              시즌 트렌드
            </CardTitle>
            <p className="text-xs text-muted-foreground">계절성 분석</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : seasonTrend ? (
              <>
                <div className="text-xl font-bold">{seasonTrend.currentSeason}</div>
                <p className="text-sm text-muted-foreground">
                  예상 피크: {seasonTrend.peakPeriod.start} - {seasonTrend.peakPeriod.end}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('season')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            ) : (
              <>
                <div className="text-xl font-bold">12월 성수기</div>
                <p className="text-sm text-muted-foreground">예상 피크: 12/20-25</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('season')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 리스크 예측 카드 */}
        <Card className={cn(
          "relative overflow-hidden",
          highRiskCount > 0 && "border-red-500/50"
        )}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-bl-full" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-4 w-4",
                highRiskCount > 0 ? "text-red-500" : "text-yellow-500"
              )} />
              리스크 예측
            </CardTitle>
            <p className="text-xs text-muted-foreground">위험 요소 모니터링</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ) : riskPredictions.length > 0 ? (
              <>
                <div className="space-y-1">
                  {highRiskCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">높음</Badge>
                      <span className="text-sm">{highRiskCount}건</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    재고 부족 위험: {riskPredictions.filter(r => r.type === 'stockout').length}품목
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('risk')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-500 text-xs">정상</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  현재 감지된 위험 없음
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full text-xs"
                  onClick={() => onViewDetails('risk')}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  상세 분석
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
