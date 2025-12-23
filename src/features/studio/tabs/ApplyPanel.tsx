/**
 * ApplyPanel.tsx
 *
 * 적용하기 패널 - 4번째 탭
 * - 저장된 시나리오 관리
 * - 시나리오 비교
 * - 실매장 적용 및 ROI 측정 연계
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Save,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  Trash2,
  ExternalLink,
  Printer,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입 정의
// ============================================================================

interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  changesCount: number;
  expectedRevenue: number;
  expectedConversion: number;
  implementationCost: number;
  expectedROI: number;
  difficulty: 'low' | 'medium' | 'high';
  changes: ScenarioChange[];
}

interface ScenarioChange {
  id: string;
  type: 'furniture' | 'product' | 'staff';
  item: string;
  from: string;
  to: string;
  expectedEffect: string;
  estimatedTime: string;
  completed?: boolean;
}

interface AppliedStrategy {
  id: string;
  name: string;
  appliedAt: string;
  currentROI: number;
  status: 'active' | 'measuring' | 'completed';
}

interface ApplyPanelProps {
  storeId: string;
  onApplyScenario?: (scenarioId: string) => void;
  onNavigateToROI?: () => void;
}

// ============================================================================
// 데모 데이터
// ============================================================================

const DEMO_SCENARIOS: SavedScenario[] = [
  {
    id: 'scenario-a',
    name: '시나리오 A (최신)',
    createdAt: '2024-12-23 14:30',
    changesCount: 9,
    expectedRevenue: 23.5,
    expectedConversion: 18.2,
    implementationCost: 500000,
    expectedROI: 340,
    difficulty: 'medium',
    changes: [
      { id: 'c1', type: 'furniture', item: '라운지 소파', from: '입구 좌측', to: '입구 +2m 전방', expectedEffect: '체류 +15%', estimatedTime: '15분' },
      { id: 'c2', type: 'furniture', item: '의류 행거', from: '벽면', to: '중앙 동선', expectedEffect: '노출 +40%', estimatedTime: '30분' },
      { id: 'c3', type: 'product', item: '레더 재킷', from: 'RACK-001', to: 'MANNE-001', expectedEffect: '주목 +60%', estimatedTime: '5분' },
      { id: 'c4', type: 'product', item: '캐시미어 코트', from: 'RACK-003', to: 'RACK-001', expectedEffect: '매출 +25%', estimatedTime: '5분' },
    ],
  },
  {
    id: 'scenario-b',
    name: '시나리오 B',
    createdAt: '2024-12-23 11:00',
    changesCount: 5,
    expectedRevenue: 15,
    expectedConversion: 10,
    implementationCost: 200000,
    expectedROI: 300,
    difficulty: 'low',
    changes: [
      { id: 'c5', type: 'furniture', item: '디스플레이 테이블', from: 'A존', to: 'B존 입구', expectedEffect: '동선 개선', estimatedTime: '20분' },
    ],
  },
  {
    id: 'scenario-c',
    name: '시나리오 C',
    createdAt: '2024-12-22 16:45',
    changesCount: 12,
    expectedRevenue: 28,
    expectedConversion: 22,
    implementationCost: 800000,
    expectedROI: 280,
    difficulty: 'high',
    changes: [],
  },
];

const DEMO_APPLIED_STRATEGIES: AppliedStrategy[] = [
  { id: 'as1', name: '레이아웃 최적화 v1', appliedAt: '12/20', currentROI: 18.3, status: 'active' },
  { id: 'as2', name: '동선 개선 v2', appliedAt: '12/15', currentROI: 12.1, status: 'active' },
];

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ApplyPanel({ storeId, onApplyScenario, onNavigateToROI }: ApplyPanelProps) {
  const navigate = useNavigate();

  // 상태
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEMO_SCENARIOS[0]?.id || '');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['comparison', 'checklist']));
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // 선택된 시나리오
  const selectedScenario = useMemo(
    () => DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId),
    [selectedScenarioId]
  );

  // 섹션 토글
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  // 작업 완료 토글
  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 실매장 적용 핸들러
  const handleApply = () => {
    if (!selectedScenario) {
      toast.error('시나리오를 선택해주세요');
      return;
    }

    toast.success(`"${selectedScenario.name}" 적용 및 ROI 측정을 시작합니다`);
    onApplyScenario?.(selectedScenario.id);

    // ROI 페이지로 이동 옵션
    setTimeout(() => {
      if (window.confirm('ROI 대시보드로 이동하시겠습니까?')) {
        navigate('/roi');
      }
    }, 1000);
  };

  // ROI 페이지 이동
  const handleNavigateToROI = () => {
    navigate('/roi');
    onNavigateToROI?.();
  };

  // 난이도 색상
  const getDifficultyColor = (difficulty: 'low' | 'medium' | 'high') => {
    switch (difficulty) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-red-500/20 text-red-400';
    }
  };

  const getDifficultyLabel = (difficulty: 'low' | 'medium' | 'high') => {
    switch (difficulty) {
      case 'low': return '하';
      case 'medium': return '중';
      case 'high': return '상';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">적용하기</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNavigateToROI}
          className="text-xs border-white/20 text-white/80 hover:bg-white/10"
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          ROI 대시보드
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* 저장된 시나리오 목록 */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-white/80 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            저장된 시나리오
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <RadioGroup
            value={selectedScenarioId}
            onValueChange={setSelectedScenarioId}
            className="space-y-2"
          >
            {DEMO_SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                  selectedScenarioId === scenario.id
                    ? 'bg-primary/20 border border-primary/40'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                )}
                onClick={() => setSelectedScenarioId(scenario.id)}
              >
                <RadioGroupItem value={scenario.id} id={scenario.id} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={scenario.id}
                    className="text-sm font-medium text-white cursor-pointer"
                  >
                    {scenario.name}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-white/60">
                    <span>{scenario.changesCount}건 변경</span>
                    <span>•</span>
                    <span className="text-green-400">+{scenario.expectedRevenue}% 매출</span>
                    <span>•</span>
                    <span>{scenario.createdAt}</span>
                  </div>
                </div>
                <Badge className={getDifficultyColor(scenario.difficulty)}>
                  난이도 {getDifficultyLabel(scenario.difficulty)}
                </Badge>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 시나리오 비교 테이블 */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('comparison')}
          className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white w-full"
        >
          {expandedSections.has('comparison') ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <BarChart3 className="w-4 h-4 text-purple-400" />
          시나리오 비교
        </button>

        {expandedSections.has('comparison') && (
          <div className="bg-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-white/60">지표</th>
                  {DEMO_SCENARIOS.map((s) => (
                    <th
                      key={s.id}
                      className={cn(
                        'text-center p-2',
                        s.id === selectedScenarioId ? 'text-primary' : 'text-white/60'
                      )}
                    >
                      {s.name.replace('시나리오 ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="p-2 text-white/60">예상 매출</td>
                  {DEMO_SCENARIOS.map((s) => (
                    <td key={s.id} className="text-center p-2 text-green-400">
                      +{s.expectedRevenue}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-2 text-white/60">전환율</td>
                  {DEMO_SCENARIOS.map((s) => (
                    <td key={s.id} className="text-center p-2 text-blue-400">
                      +{s.expectedConversion}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-2 text-white/60">구현 비용</td>
                  {DEMO_SCENARIOS.map((s) => (
                    <td key={s.id} className="text-center p-2 text-white/80">
                      ₩{(s.implementationCost / 10000).toFixed(0)}만
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="p-2 text-white/60">예상 ROI</td>
                  {DEMO_SCENARIOS.map((s) => (
                    <td key={s.id} className="text-center p-2 text-yellow-400 font-medium">
                      {s.expectedROI}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 text-white/60">난이도</td>
                  {DEMO_SCENARIOS.map((s) => (
                    <td key={s.id} className="text-center p-2">
                      <Badge className={cn('text-[10px]', getDifficultyColor(s.difficulty))}>
                        {getDifficultyLabel(s.difficulty)}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 구현 체크리스트 */}
      {selectedScenario && selectedScenario.changes.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('checklist')}
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white w-full"
          >
            {expandedSections.has('checklist') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <FileText className="w-4 h-4 text-orange-400" />
            구현 체크리스트 ({selectedScenario.name})
          </button>

          {expandedSections.has('checklist') && (
            <div className="space-y-2">
              {selectedScenario.changes.map((change) => (
                <div
                  key={change.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg bg-white/5 transition-colors',
                    completedTasks.has(change.id) && 'bg-green-500/10'
                  )}
                >
                  <Checkbox
                    checked={completedTasks.has(change.id)}
                    onCheckedChange={() => toggleTask(change.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          change.type === 'furniture' ? 'border-blue-500/50 text-blue-400' :
                          change.type === 'product' ? 'border-green-500/50 text-green-400' :
                          'border-purple-500/50 text-purple-400'
                        )}
                      >
                        {change.type === 'furniture' ? '가구' : change.type === 'product' ? '제품' : '직원'}
                      </Badge>
                      <span className={cn(
                        'text-sm',
                        completedTasks.has(change.id) ? 'text-white/50 line-through' : 'text-white'
                      )}>
                        {change.item}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {change.from} → {change.to}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-green-400">{change.expectedEffect}</span>
                      <span className="text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {change.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 체크리스트 액션 버튼 */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => toast.info('체크리스트를 인쇄합니다')}
                >
                  <Printer className="w-3 h-3 mr-1" />
                  인쇄
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white/80 hover:bg-white/10"
                  onClick={() => toast.info('담당자를 할당합니다')}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  담당자 할당
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 적용 버튼 */}
      <Button
        onClick={handleApply}
        disabled={!selectedScenario}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        실매장에 적용하고 ROI 측정 시작
      </Button>

      {/* 적용 중인 전략 */}
      {DEMO_APPLIED_STRATEGIES.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <TrendingUp className="w-4 h-4 text-green-400" />
            적용 중인 전략 ({DEMO_APPLIED_STRATEGIES.length}건)
          </div>

          <div className="space-y-2">
            {DEMO_APPLIED_STRATEGIES.map((strategy) => (
              <div
                key={strategy.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div>
                  <div className="text-sm text-white">{strategy.name}</div>
                  <div className="text-xs text-white/60">적용일: {strategy.appliedAt}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-400 font-medium">
                    +{strategy.currentROI}%
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      strategy.status === 'active' ? 'border-green-500/50 text-green-400' :
                      strategy.status === 'measuring' ? 'border-yellow-500/50 text-yellow-400' :
                      'border-white/30 text-white/60'
                    )}
                  >
                    {strategy.status === 'active' ? '측정중' : strategy.status === 'measuring' ? '분석중' : '완료'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300/80">
          시나리오를 적용하면 ROI 대시보드에서 실시간으로 효과를 측정할 수 있습니다.
          변경사항은 체크리스트를 통해 단계별로 구현하세요.
        </p>
      </div>
    </div>
  );
}

export default ApplyPanel;
