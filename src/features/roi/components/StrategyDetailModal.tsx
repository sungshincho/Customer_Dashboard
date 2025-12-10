/**
 * 전략 상세 모달 컴포넌트
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Calendar, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useStrategyDetail, useUpdateStrategyStatus } from '../hooks/useAppliedStrategies';
import { getModuleConfig, STATUS_CONFIG, RESULT_CONFIG, getSourceDisplayName } from '../utils/moduleConfig';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StrategyDetailModalProps {
  strategyId: string;
  onClose: () => void;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '-';
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`;
  return `₩${value.toLocaleString()}`;
};

const formatPercent = (value: number | null): string => {
  if (value === null) return '-';
  return `${value.toFixed(0)}%`;
};

export const StrategyDetailModal: React.FC<StrategyDetailModalProps> = ({
  strategyId,
  onClose,
}) => {
  const { data: strategy, isLoading } = useStrategyDetail(strategyId);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateStrategyStatus();

  if (isLoading || !strategy) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48 bg-white/10" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-white/10" />
            <Skeleton className="h-32 w-full bg-white/10" />
            <Skeleton className="h-48 w-full bg-white/10" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const config = getModuleConfig(strategy.sourceModule);
  const actualRoi = strategy.finalRoi || strategy.currentRoi;
  const achievementRate = actualRoi !== null && strategy.targetRoi
    ? Math.round((actualRoi / strategy.targetRoi) * 100)
    : null;

  // 진행 중인 경우 남은 일수 계산
  const daysRemaining = strategy.status === 'active'
    ? Math.max(0, Math.ceil((new Date(strategy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const totalDays = Math.ceil(
    (new Date(strategy.endDate).getTime() - new Date(strategy.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPassed = strategy.status === 'active' ? totalDays - (daysRemaining || 0) : totalDays;

  const handleCancelStrategy = () => {
    if (confirm('정말로 이 전략을 취소하시겠습니까?')) {
      updateStatus(
        { strategyId, status: 'cancelled' },
        {
          onSuccess: () => {
            toast.success('전략이 취소되었습니다');
            onClose();
          },
        }
      );
    }
  };

  const handleCompleteStrategy = () => {
    // 실제 구현 시 ROI 입력 모달 표시
    const finalRoiInput = prompt('최종 ROI를 입력하세요 (%):', actualRoi?.toString() || '');
    if (finalRoiInput === null) return;

    const finalRoi = parseFloat(finalRoiInput);
    if (isNaN(finalRoi)) {
      toast.error('올바른 숫자를 입력해주세요');
      return;
    }

    const result = finalRoi >= (strategy.targetRoi || 100)
      ? 'success'
      : finalRoi >= (strategy.targetRoi || 100) * 0.8
        ? 'partial'
        : 'failed';

    updateStatus(
      { strategyId, status: 'completed', result, finalRoi },
      {
        onSuccess: () => {
          toast.success('전략이 완료 처리되었습니다');
        },
      }
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </button>
            {strategy.status === 'active' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCompleteStrategy} disabled={isUpdating}>
                  완료 처리
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCancelStrategy} disabled={isUpdating}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <span className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl', config.bgColor)}>
              {config.icon}
            </span>
            <div>
              <DialogTitle className="text-white text-xl">{strategy.name}</DialogTitle>
              <p className="text-white/50 text-sm mt-1">
                적용일: {formatDate(strategy.startDate)} | 상태:{' '}
                <span className={STATUS_CONFIG[strategy.status].color}>
                  {STATUS_CONFIG[strategy.status].icon} {STATUS_CONFIG[strategy.status].label}
                </span>
                {daysRemaining !== null && ` (D+${daysPassed}/${totalDays})`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 전략 요약 */}
          <Card className="p-4 bg-white/5 border-white/10">
            <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              📋 전략 요약
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/50">유형</p>
                <p className="text-white font-medium">{config.displayName}</p>
              </div>
              <div>
                <p className="text-white/50">출처</p>
                <p className="text-white font-medium">{getSourceDisplayName(strategy.source)}</p>
              </div>
              <div>
                <p className="text-white/50">기간</p>
                <p className="text-white font-medium">
                  {formatDate(strategy.startDate)} ~ {formatDate(strategy.endDate)}
                </p>
              </div>
              {strategy.description && (
                <div className="col-span-2">
                  <p className="text-white/50">설명</p>
                  <p className="text-white">{strategy.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* ROI 추적 */}
          <Card className="p-4 bg-white/5 border-white/10">
            <h4 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
              📈 ROI 추적
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-white/50 text-xs mb-1">예상 ROI</p>
                <p className="text-2xl font-bold text-white">{formatPercent(strategy.expectedRoi)}</p>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl text-white/20">→</span>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-white/50 text-xs mb-1">현재 ROI</p>
                <p className={cn(
                  'text-2xl font-bold',
                  actualRoi === null
                    ? 'text-white/40'
                    : actualRoi >= strategy.expectedRoi
                      ? 'text-green-400'
                      : 'text-yellow-400'
                )}>
                  {formatPercent(actualRoi)}
                </p>
              </div>
            </div>
            {achievementRate !== null && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/50 text-sm">달성률</span>
                  <span className={cn(
                    'font-medium',
                    achievementRate >= 100 ? 'text-green-400' : achievementRate >= 80 ? 'text-yellow-400' : 'text-red-400'
                  )}>
                    {achievementRate}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      achievementRate >= 100 ? 'bg-green-500' : achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(100, achievementRate)}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* 세부 지표 */}
          {Object.keys(strategy.baselineMetrics).length > 0 && (
            <Card className="p-4 bg-white/5 border-white/10">
              <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                📊 기준 메트릭 (적용 전)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(strategy.baselineMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 bg-white/5 rounded">
                    <span className="text-white/50">{key}</span>
                    <span className="text-white font-medium">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 메모 */}
          {strategy.notes && (
            <Card className="p-4 bg-white/5 border-white/10">
              <h4 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                📝 메모
              </h4>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{strategy.notes}</p>
            </Card>
          )}

          {/* 액션 버튼 */}
          {strategy.status === 'active' && (
            <div className="flex justify-center gap-3 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => toast.info('전략 수정 기능 준비 중')}>
                전략 수정
              </Button>
              <Button variant="outline" onClick={handleCancelStrategy} disabled={isUpdating}>
                조기 종료
              </Button>
              <Button variant="outline" onClick={() => toast.info('기간 연장 기능 준비 중')}>
                기간 연장
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StrategyDetailModal;
