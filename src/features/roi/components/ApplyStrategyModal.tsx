/**
 * 전략 적용 모달 컴포넌트
 * - 인사이트 허브와 디지털트윈 스튜디오에서 공통으로 사용
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, Target, TrendingUp, Loader2 } from 'lucide-react';
import { useApplyStrategy } from '../hooks/useAppliedStrategies';
import { getModuleConfig, getSourceDisplayName } from '../utils/moduleConfig';
import type { ApplyStrategyInput, SimulationSource, SourceModule } from '../types/roi.types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ApplyStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyData: {
    source: SimulationSource;
    sourceModule: SourceModule;
    name: string;
    description?: string;
    settings: Record<string, any>;
    expectedRoi: number;
    expectedRevenue?: number;
    confidence?: number;
    baselineMetrics: Record<string, number>;
  };
  /** 적용 후 ROI 페이지로 이동 여부 */
  navigateToROI?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 100000000) return `₩${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000000) return `₩${(value / 10000000).toFixed(1)}천만`;
  if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`;
  return `₩${value.toLocaleString()}`;
};

export const ApplyStrategyModal: React.FC<ApplyStrategyModalProps> = ({
  isOpen,
  onClose,
  strategyData,
  navigateToROI = false,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(strategyData.name);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [targetRoi, setTargetRoi] = useState(strategyData.expectedRoi.toString());
  const [notes, setNotes] = useState('');

  const { mutate: applyStrategy, isPending } = useApplyStrategy();
  const config = getModuleConfig(strategyData.sourceModule);

  const handleApply = () => {
    if (!name.trim()) {
      toast.error('전략명을 입력해주세요');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('종료일은 시작일 이후여야 합니다');
      return;
    }

    const input: ApplyStrategyInput = {
      source: strategyData.source,
      sourceModule: strategyData.sourceModule,
      name: name.trim(),
      description: strategyData.description,
      settings: strategyData.settings,
      startDate,
      endDate,
      expectedRoi: strategyData.expectedRoi,
      expectedRevenue: strategyData.expectedRevenue,
      targetRoi: parseFloat(targetRoi) || strategyData.expectedRoi,
      baselineMetrics: strategyData.baselineMetrics,
      notes: notes.trim() || undefined,
    };

    applyStrategy(input, {
      onSuccess: () => {
        toast.success('전략이 적용되었습니다', {
          description: 'ROI 측정 대시보드에서 성과를 추적할 수 있습니다',
          action: navigateToROI
            ? undefined
            : {
                label: 'ROI 대시보드 보기',
                onClick: () => navigate('/roi'),
              },
        });
        onClose();
        if (navigateToROI) {
          navigate('/roi');
        }
      },
      onError: (error) => {
        toast.error('전략 적용 실패', {
          description: error.message,
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
              {config.icon}
            </span>
            전략 적용
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 전략 요약 */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="font-medium text-white mb-3">{strategyData.name}</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-white/50">예상 ROI</p>
                <p className="text-white font-medium text-lg">{strategyData.expectedRoi}%</p>
              </div>
              {strategyData.expectedRevenue !== undefined && (
                <div>
                  <p className="text-white/50">예상 매출</p>
                  <p className="text-green-400 font-medium text-lg">
                    +{formatCurrency(strategyData.expectedRevenue)}
                  </p>
                </div>
              )}
              {strategyData.confidence !== undefined && (
                <div>
                  <p className="text-white/50">신뢰도</p>
                  <p className="text-white font-medium text-lg">{strategyData.confidence}%</p>
                </div>
              )}
            </div>
            <p className="text-xs text-white/40 mt-3">
              출처: {getSourceDisplayName(strategyData.source)}
            </p>
          </div>

          {/* 전략명 */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">전략명 (수정 가능)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              placeholder="전략명 입력"
            />
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                시작일
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                종료일
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* ROI 목표 */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm flex items-center gap-1">
              <Target className="w-3 h-3" />
              ROI 목표 (%)
            </Label>
            <Input
              type="number"
              value={targetRoi}
              onChange={(e) => setTargetRoi(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              placeholder="예상 ROI 기준"
            />
            <p className="text-xs text-white/40">비워두면 예상 ROI ({strategyData.expectedRoi}%)가 목표가 됩니다</p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label className="text-white/70 text-sm">메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모나 특이사항을 입력하세요..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              rows={3}
            />
          </div>

          {/* 안내 */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-400/80">
              적용 시 ROI 측정 대시보드에 기록되며, 실시간으로 성과가 추적됩니다.
              적용 기간 동안 전략의 효과를 측정하여 최종 ROI를 산출합니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              취소
            </Button>
            <Button onClick={handleApply} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  적용 중...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  적용하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyStrategyModal;
