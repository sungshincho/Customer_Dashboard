/**
 * LayoutResultPanel.tsx
 *
 * 레이아웃 최적화 시뮬레이션 결과 패널
 */

import { DraggablePanel } from '../../components/DraggablePanel';
import { Layout, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LayoutResult {
  currentEfficiency: number;
  optimizedEfficiency: number;
  revenueIncrease: number;
  dwellTimeIncrease: number;
  conversionIncrease: number;
  changes: {
    item: string;
    from: string;
    to: string;
    effect: string;
  }[];
}

interface LayoutResultPanelProps {
  result: LayoutResult;
  onClose: () => void;
  onApply: () => void;
  onShowIn3D: () => void;
  defaultPosition?: { x: number; y: number };
}

export const LayoutResultPanel: React.FC<LayoutResultPanelProps> = ({
  result,
  onClose,
  onApply,
  onShowIn3D,
  defaultPosition = { x: 350, y: 100 },
}) => {
  const improvement = result.optimizedEfficiency - result.currentEfficiency;

  return (
    <DraggablePanel
      id="layout-result"
      title="레이아웃 최적화 결과"
      icon={<Layout className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      closable
      onClose={onClose}
      width="w-72"
    >
      {/* 효율성 점수 */}
      <div className="mb-3">
        <p className="text-xs text-white/50 mb-1">효율성 점수</p>
        <div className="flex items-center gap-2">
          <span className="text-lg text-white/60">{result.currentEfficiency}%</span>
          <ArrowRight className="w-4 h-4 text-white/40" />
          <span className="text-lg text-white font-semibold">{result.optimizedEfficiency}%</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            improvement > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {improvement > 0 ? '+' : ''}{improvement}%p
          </span>
        </div>
      </div>

      {/* 예상 효과 */}
      <div className="mb-3">
        <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-400" />
          예상 효과
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/60">매출 증가</span>
            <span className="text-xs font-medium text-green-400">
              +₩{(result.revenueIncrease / 10000).toFixed(0)}만/월
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/60">체류시간</span>
            <span className="text-xs font-medium text-green-400">
              +{result.dwellTimeIncrease}분
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/60">전환율</span>
            <span className="text-xs font-medium text-green-400">
              +{result.conversionIncrease}%p
            </span>
          </div>
        </div>
      </div>

      {/* 변경 사항 */}
      <div>
        <p className="text-xs text-white/50 mb-2">변경 사항 ({result.changes.length}건)</p>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {result.changes.map((change, i) => (
            <div key={i} className="text-xs bg-white/5 rounded p-2">
              <p className="text-white font-medium">{change.item}</p>
              <p className="text-white/40">{change.from} → {change.to}</p>
              <p className="text-green-400">{change.effect}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowIn3D}
          className="flex-1 h-8 text-xs bg-white/10 hover:bg-white/20 text-white"
        >
          3D 보기
        </Button>
        <Button
          size="sm"
          onClick={onApply}
          className="flex-1 h-8 text-xs"
        >
          적용하기
        </Button>
      </div>
    </DraggablePanel>
  );
};

export default LayoutResultPanel;
