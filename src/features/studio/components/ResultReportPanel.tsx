/**
 * ResultReportPanel.tsx
 *
 * 통합 시뮬레이션 결과 리포트 패널
 * - Layout, Flow, Congestion, Staffing 결과 통합 표시
 * - 실제 시뮬레이션 결과 데이터 연동
 * - DraggablePanel 기반
 */

import { memo, useState } from 'react';
import {
  Layout,
  Route,
  Users2,
  UserCog,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileBarChart,
  Package,
  Armchair,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LayoutResult, FlowResult, CongestionResult, StaffingResult } from '../panels/results';

interface SimulationResults {
  layout: LayoutResult | null;
  flow: FlowResult | null;
  congestion: CongestionResult | null;
  staffing: StaffingResult | null;
}

interface ResultReportPanelProps {
  results: SimulationResults;
  onClose: () => void;
  onApply: (type: keyof SimulationResults) => void;
  onShowIn3D: (type: keyof SimulationResults) => void;
  defaultPosition?: { x: number; y: number };
  rightOffset?: number;
}

// 결과 유형 설정
const RESULT_TYPES = [
  { id: 'layout' as const, label: '레이아웃', icon: Layout, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { id: 'flow' as const, label: '동선', icon: Route, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { id: 'congestion' as const, label: '혼잡도', icon: Users2, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  { id: 'staffing' as const, label: '직원 배치', icon: UserCog, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
];

export const ResultReportPanel = memo(function ResultReportPanel({
  results,
  onClose,
  onApply,
  onShowIn3D,
  defaultPosition = { x: 350, y: 100 },
  rightOffset,
}: ResultReportPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    layout: true,
    flow: false,
    congestion: false,
    staffing: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // 결과가 하나라도 있는지 확인
  const hasAnyResult = Object.values(results).some((r) => r !== null);

  // 총 개선 효과 계산
  const totalImprovements = {
    revenue: (results.layout?.revenueIncrease || 0),
    efficiency:
      (results.layout ? results.layout.optimizedEfficiency - results.layout.currentEfficiency : 0) +
      (results.staffing ? results.staffing.optimizedCoverage - results.staffing.currentCoverage : 0),
    changes:
      (results.layout?.changes?.length || 0) +
      (results.layout?.productChanges?.length || 0) +
      (results.flow?.bottlenecks?.length || 0) +
      (results.staffing?.staffPositions?.length || 0),
  };

  return (
    <DraggablePanel
      id="result-report"
      title="AI 분석 리포트"
      icon={<FileBarChart className="w-4 h-4" />}
      defaultPosition={defaultPosition}
      rightOffset={rightOffset}
      defaultCollapsed={false}
      closable
      onClose={onClose}
      width="w-80"
    >
      {!hasAnyResult ? (
        <div className="py-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40">분석 결과 없음</p>
          <p className="text-xs text-white/30 mt-1">
            AI 시뮬레이션 또는 AI 최적화 탭에서
            <br />
            분석을 실행하세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 전체 요약 */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-white">총 개선 효과</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">
                  +₩{(totalImprovements.revenue / 10000).toFixed(0)}만
                </div>
                <div className="text-[10px] text-white/50">예상 매출</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">
                  +{totalImprovements.efficiency.toFixed(1)}%
                </div>
                <div className="text-[10px] text-white/50">효율성</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-400">{totalImprovements.changes}</div>
                <div className="text-[10px] text-white/50">변경 사항</div>
              </div>
            </div>
          </div>

          {/* 결과별 섹션 */}
          {RESULT_TYPES.map((type) => {
            const result = results[type.id];
            if (!result) return null;

            const Icon = type.icon;
            const isExpanded = expandedSections[type.id];

            return (
              <div
                key={type.id}
                className={cn('rounded-lg border border-white/10 overflow-hidden', type.bgColor)}
              >
                {/* 섹션 헤더 */}
                <button
                  onClick={() => toggleSection(type.id)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', type.color)} />
                    <span className="text-sm font-medium text-white">{type.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      완료
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </button>

                {/* 섹션 내용 */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 space-y-2">
                    {/* Layout 결과 */}
                    {type.id === 'layout' && results.layout && (
                      <LayoutResultContent result={results.layout} />
                    )}

                    {/* Flow 결과 */}
                    {type.id === 'flow' && results.flow && (
                      <FlowResultContent result={results.flow} />
                    )}

                    {/* Congestion 결과 */}
                    {type.id === 'congestion' && results.congestion && (
                      <CongestionResultContent result={results.congestion} />
                    )}

                    {/* Staffing 결과 */}
                    {type.id === 'staffing' && results.staffing && (
                      <StaffingResultContent result={results.staffing} />
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onShowIn3D(type.id)}
                        className="flex-1 h-7 text-xs bg-white/10 hover:bg-white/20 text-white"
                      >
                        3D 보기
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApply(type.id)}
                        className="flex-1 h-7 text-xs"
                      >
                        적용
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DraggablePanel>
  );
});

// Layout 결과 내용
const LayoutResultContent = memo(function LayoutResultContent({ result }: { result: LayoutResult }) {
  const improvement = result.optimizedEfficiency - result.currentEfficiency;

  return (
    <div className="space-y-2">
      {/* 효율성 점수 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentEfficiency}%</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedEfficiency}%</span>
        <span
          className={cn(
            'text-xs px-1 py-0.5 rounded',
            improvement > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}
        >
          {improvement > 0 ? '+' : ''}
          {improvement}%p
        </span>
      </div>

      {/* 예상 효과 */}
      <div className="grid grid-cols-3 gap-1.5 text-xs">
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-green-400 font-medium">+₩{(result.revenueIncrease / 10000).toFixed(0)}만</div>
          <div className="text-white/40 text-[10px]">매출</div>
        </div>
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-blue-400 font-medium">+{result.dwellTimeIncrease}분</div>
          <div className="text-white/40 text-[10px]">체류</div>
        </div>
        <div className="p-1.5 rounded bg-black/20 text-center">
          <div className="text-purple-400 font-medium">+{result.conversionIncrease}%</div>
          <div className="text-white/40 text-[10px]">전환</div>
        </div>
      </div>

      {/* 변경 사항 요약 */}
      {(result.changes.length > 0 || (result.productChanges && result.productChanges.length > 0)) && (
        <div className="text-xs text-white/60 flex items-center gap-2">
          <Armchair className="w-3 h-3" />
          <span>가구 {result.changes.length}건</span>
          {result.productChanges && result.productChanges.length > 0 && (
            <>
              <Package className="w-3 h-3 ml-1" />
              <span>제품 {result.productChanges.length}건</span>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// Flow 결과 내용
const FlowResultContent = memo(function FlowResultContent({ result }: { result: FlowResult }) {
  const improvement = result.currentPathLength - result.optimizedPathLength;

  return (
    <div className="space-y-2">
      {/* 경로 길이 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentPathLength}m</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedPathLength}m</span>
        {improvement > 0 && (
          <span className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400">
            -{improvement}m
          </span>
        )}
      </div>

      {/* 병목 지점 */}
      {result.bottlenecks.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-white/60 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            병목 지점 {result.bottlenecks.length}개
          </div>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {result.bottlenecks.slice(0, 3).map((b, i) => (
              <div key={i} className="text-xs p-1.5 rounded bg-black/20">
                <span className="text-white">{b.location}</span>
                <span className="text-white/40 ml-1">({b.congestion}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 개선 사항 */}
      {result.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.improvements.map((imp, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
              {imp.metric}: {imp.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// Congestion 결과 내용
const CongestionResultContent = memo(function CongestionResultContent({
  result,
}: {
  result: CongestionResult;
}) {
  return (
    <div className="space-y-2">
      {/* 피크 혼잡도 */}
      <div className="p-2 rounded bg-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-orange-400" />
            <span className="text-xs text-white/60">피크 시간</span>
          </div>
          <span className="text-sm font-medium text-white">{result.peakHours}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-white/60">최대 혼잡도</span>
          <span className="text-sm font-semibold text-red-400">{result.peakCongestion}%</span>
        </div>
      </div>

      {/* 구역별 혼잡도 */}
      {result.zoneData.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-white/60 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            구역별 혼잡도
          </div>
          <div className="grid grid-cols-2 gap-1">
            {result.zoneData.slice(0, 4).map((z, i) => (
              <div key={i} className="text-xs p-1.5 rounded bg-black/20 flex justify-between">
                <span className="text-white/70 truncate">{z.zone}</span>
                <span
                  className={cn(
                    'font-medium',
                    z.congestion >= 80 ? 'text-red-400' : z.congestion >= 50 ? 'text-yellow-400' : 'text-green-400'
                  )}
                >
                  {z.congestion}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 권장 사항 */}
      {result.recommendations.length > 0 && (
        <div className="text-xs text-blue-400 p-1.5 rounded bg-blue-500/10">
          {result.recommendations[0]}
        </div>
      )}
    </div>
  );
});

// Staffing 결과 내용
const StaffingResultContent = memo(function StaffingResultContent({
  result,
}: {
  result: StaffingResult;
}) {
  const improvement = result.optimizedCoverage - result.currentCoverage;

  return (
    <div className="space-y-2">
      {/* 커버리지 */}
      <div className="flex items-center gap-2 p-2 rounded bg-black/30">
        <span className="text-sm text-white/60">{result.currentCoverage}%</span>
        <ArrowRight className="w-3 h-3 text-white/40" />
        <span className="text-sm font-semibold text-white">{result.optimizedCoverage}%</span>
        {improvement > 0 && (
          <span className="text-xs px-1 py-0.5 rounded bg-green-500/20 text-green-400">
            +{improvement}%p
          </span>
        )}
      </div>

      {/* 직원 배치 */}
      <div className="flex items-center gap-2 text-xs">
        <UserCog className="w-3 h-3 text-purple-400" />
        <span className="text-white/60">직원 {result.staffCount}명</span>
        <span className="text-white/40">|</span>
        <span className="text-white/60">재배치 {result.staffPositions.length}명</span>
      </div>

      {/* 개선 사항 */}
      {result.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {result.improvements.map((imp, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
              {imp.metric}: {imp.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default ResultReportPanel;
