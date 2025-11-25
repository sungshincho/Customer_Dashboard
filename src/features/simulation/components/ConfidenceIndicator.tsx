import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number;
  variant?: 'default' | 'compact';
  showLabel?: boolean;
}

export function ConfidenceIndicator({
  score,
  variant = 'default',
  showLabel = true,
}: ConfidenceIndicatorProps) {
  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return { level: 'high', label: '높음', color: 'text-green-500', icon: CheckCircle };
    if (score >= 60) return { level: 'medium', label: '중간', color: 'text-yellow-500', icon: Sparkles };
    return { level: 'low', label: '낮음', color: 'text-red-500', icon: AlertTriangle };
  };

  const confidence = getConfidenceLevel(score);
  const Icon = confidence.icon;

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 cursor-help">
              <Icon className="w-3 h-3" />
              {score.toFixed(0)}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>신뢰도: {confidence.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${confidence.color}`} />
          {showLabel && (
            <span className="text-sm font-medium">
              신뢰도: {confidence.label}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold">{score.toFixed(0)}%</span>
      </div>
      <Progress value={score} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {score >= 80 && '예측 결과를 높은 신뢰도로 활용할 수 있습니다.'}
        {score >= 60 && score < 80 && '예측 결과를 참고용으로 활용하세요.'}
        {score < 60 && '데이터 품질이 낮아 예측 정확도가 제한적입니다.'}
      </p>
    </div>
  );
}
