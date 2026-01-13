// ============================================================================
// PipelineTimeline.tsx - 데이터 파이프라인 타임라인
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  ArrowRight,
  Layers,
  BarChart3,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { PipelineStats } from '../types';

interface PipelineTimelineProps {
  stats: PipelineStats;
}

export function PipelineTimeline({ stats }: PipelineTimelineProps) {
  const stages = [
    {
      name: 'Raw Import',
      layer: 'L1',
      icon: Database,
      count: stats.raw_imports.total,
      completed: stats.raw_imports.completed,
      pending: stats.raw_imports.pending,
      failed: stats.raw_imports.failed,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'L2 Transform',
      layer: 'L2',
      icon: Layers,
      count: stats.l2_records,
      completed: stats.l2_records,
      pending: 0,
      failed: 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      name: 'L3 Aggregate',
      layer: 'L3',
      icon: BarChart3,
      count: stats.l3_records,
      completed: stats.l3_records,
      pending: 0,
      failed: 0,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
          데이터 파이프라인
        </h3>

        <div className="flex items-center justify-between">
          {stages.map((stage, index) => (
            <div key={stage.layer} className="flex items-center">
              {/* Stage Card */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-2xl ${stage.bgColor} flex items-center justify-center mb-2`}
                >
                  <stage.icon className={`w-7 h-7 ${stage.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {stage.name}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {stage.count.toLocaleString()}
                </span>
                <div className="flex gap-1 mt-1">
                  {stage.pending > 0 && (
                    <Badge variant="secondary" className="text-xs py-0">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      {stage.pending}
                    </Badge>
                  )}
                  {stage.completed > 0 && (
                    <Badge variant="default" className="text-xs py-0 bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {stage.completed}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <div className="mx-4">
                  <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ETL Runs Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">ETL 실행</span>
            <div className="flex gap-3">
              <span className="text-gray-900 dark:text-white">
                총 {stats.etl_runs.total}회
              </span>
              {stats.etl_runs.running > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {stats.etl_runs.running} 실행 중
                </Badge>
              )}
              {stats.etl_runs.failed > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.etl_runs.failed} 실패
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
