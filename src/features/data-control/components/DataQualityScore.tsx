// ============================================================================
// DataQualityScore.tsx - 데이터 품질 점수 표시
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import type { DataQualityScore as DataQualityScoreType } from '../types';

interface DataQualityScoreProps {
  score: DataQualityScoreType;
}

const confidenceConfig: Record<string, { label: string; color: string; icon: any }> = {
  high: {
    label: '높음',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
  medium: {
    label: '보통',
    color: 'bg-yellow-500',
    icon: AlertTriangle,
  },
  low: {
    label: '낮음',
    color: 'bg-red-500',
    icon: XCircle,
  },
};

export function DataQualityScoreCard({ score }: DataQualityScoreProps) {
  const confidence = confidenceConfig[score.confidence_level];
  const ConfidenceIcon = confidence.icon;

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden">
      <div
        className={`h-1 ${getProgressColor(score.overall_score)}`}
        style={{ width: `${score.overall_score}%` }}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              데이터 품질 점수
            </h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(score.overall_score)}`}>
                {score.overall_score}
              </span>
              <span className="text-lg text-gray-500">/ 100</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${confidence.color} text-white border-0`}
          >
            <ConfidenceIcon className="w-3 h-3 mr-1" />
            신뢰도 {confidence.label}
          </Badge>
        </div>

        {/* Coverage Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            데이터 소스 커버리지
          </h4>
          {Object.entries(score.coverage)
            .filter(([key]) => key !== 'raw_imports')
            .map(([key, data]: [string, any]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                  {data.label}
                </div>
                <div className="flex-1">
                  <Progress
                    value={data.completeness * 100}
                    className="h-2"
                  />
                </div>
                <div className="w-16 text-right">
                  {data.available ? (
                    <Badge variant="default" className="text-xs bg-green-600">
                      {data.record_count.toLocaleString()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      없음
                    </Badge>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Warnings */}
        {score.warnings.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              경고 ({score.warning_count})
            </h4>
            <div className="space-y-2">
              {score.warnings.slice(0, 3).map((warning, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded-lg ${
                    warning.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : warning.severity === 'medium'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  {warning.severity === 'high' ? (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : warning.severity === 'medium' ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {warning.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Good Message */}
        {score.warnings.length === 0 && score.overall_score >= 80 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">
                모든 데이터 소스가 정상입니다
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
