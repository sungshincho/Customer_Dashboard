/**
 * ExecuteSection.tsx
 *
 * 4단계: 실행 섹션
 * - 현재 실행 중인 캠페인
 * - 진행률 및 실시간 성과
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Edit,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignStatus } from '../types/aiDecision.types';
import { formatCurrency } from '../../../components';

interface ExecuteSectionProps {
  campaigns: Campaign[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  scheduled: { label: '예정', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  active: { label: '실행 중', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  paused: { label: '일시정지', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  completed: { label: '완료', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  cancelled: { label: '취소됨', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export function ExecuteSection({
  campaigns,
  onPause,
  onResume,
  onStop,
  onEdit,
  isLoading,
}: ExecuteSectionProps) {
  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'paused');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
          4
        </div>
        <h3 className="text-lg font-semibold">실행 이력 (Execute)</h3>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-green-500" />
            현재 실행 중
            {activeCampaigns.length > 0 && (
              <Badge variant="secondary">{activeCampaigns.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-2 bg-muted rounded w-full mb-3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : activeCampaigns.length > 0 ? (
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onPause={() => onPause(campaign.id)}
                  onResume={() => onResume(campaign.id)}
                  onStop={() => onStop(campaign.id)}
                  onEdit={() => onEdit(campaign.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>실행 중인 캠페인이 없습니다</p>
              <p className="text-sm mt-1">AI 추천 전략을 실행해보세요</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 캠페인 카드 컴포넌트
interface CampaignCardProps {
  campaign: Campaign;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onEdit: () => void;
}

function CampaignCard({
  campaign,
  onPause,
  onResume,
  onStop,
  onEdit,
}: CampaignCardProps) {
  const status = statusConfig[campaign.status];
  const roiDiff = campaign.currentROI - campaign.expectedROI;
  const isPerformingWell = roiDiff >= 0;

  // 날짜 계산
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  const today = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="p-4 border rounded-lg bg-card">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn('text-xs', status.className)}>
            {status.label}
          </Badge>
          <span className="font-semibold">{campaign.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {campaign.status === 'active' ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPause}>
              <Pause className="h-3 w-3" />
            </Button>
          ) : campaign.status === 'paused' ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onResume}>
              <Play className="h-3 w-3" />
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStop}>
            <Square className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 기간 및 진행률 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>
            시작: {startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
          <span>진행률: {campaign.progress}%</span>
          <span>
            종료: {endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <Progress value={campaign.progress} className="h-2" />
      </div>

      {/* 성과 지표 */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">현재 매출</p>
          <p className="text-sm font-bold">
            {formatCurrency(campaign.metrics.revenue)}
          </p>
        </div>
        <div className="text-center border-x border-border/50">
          <p className="text-xs text-muted-foreground">전환</p>
          <p className="text-sm font-bold">
            {campaign.metrics.conversions.toLocaleString()}건
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">현재 ROI</p>
          <p className={cn(
            'text-sm font-bold flex items-center justify-center gap-1',
            isPerformingWell ? 'text-green-500' : 'text-yellow-500'
          )}>
            {campaign.currentROI}%
            {isPerformingWell ? (
              <TrendingUp className="w-3 h-3" />
            ) : roiDiff < -10 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
          </p>
        </div>
      </div>

      {/* ROI 비교 */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          예상 ROI: {campaign.expectedROI}%
        </span>
        <span className={cn(
          'font-medium',
          isPerformingWell ? 'text-green-500' : 'text-yellow-500'
        )}>
          {isPerformingWell ? '+' : ''}{roiDiff.toFixed(0)}%p 차이
        </span>
      </div>
    </div>
  );
}
