/**
 * ViewModeToggle.tsx
 *
 * 3D 뷰어 As-Is / To-Be / Split 모드 전환 토글
 * - As-Is: 현재 배치
 * - To-Be: 최적화 결과
 * - Split: 좌우 분할 비교
 */

import { Eye, GitCompare, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type ViewMode = 'as-is' | 'to-be' | 'split';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  hasOptimizationResults?: boolean;
}

const modeConfig = [
  {
    id: 'as-is' as ViewMode,
    label: 'As-Is',
    shortcut: 'A',
    icon: Eye,
    description: '현재 배치',
    activeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'to-be' as ViewMode,
    label: 'To-Be',
    shortcut: 'T',
    icon: GitCompare,
    description: '최적화 결과',
    activeColor: 'bg-green-600 text-white',
  },
  {
    id: 'split' as ViewMode,
    label: 'Split',
    shortcut: 'S',
    icon: Columns,
    description: '좌우 비교',
    activeColor: 'bg-purple-600 text-white',
  },
];

export function ViewModeToggle({
  mode,
  onChange,
  disabled = false,
  hasOptimizationResults = false,
}: ViewModeToggleProps) {
  const canUseToBe = hasOptimizationResults;

  return (
    <TooltipProvider>
      <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg p-1 flex gap-0.5">
        {modeConfig.map((config) => {
          const Icon = config.icon;
          const isActive = mode === config.id;
          const isDisabled = disabled || (config.id !== 'as-is' && !canUseToBe);

          return (
            <Tooltip key={config.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !isDisabled && onChange(config.id)}
                  disabled={isDisabled}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                    isActive
                      ? config.activeColor
                      : 'text-white/60 hover:text-white hover:bg-white/10',
                    isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{config.description}</p>
                {!canUseToBe && config.id !== 'as-is' && (
                  <p className="text-muted-foreground">최적화 결과가 필요합니다</p>
                )}
                <p className="text-muted-foreground">단축키: {config.shortcut}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default ViewModeToggle;
