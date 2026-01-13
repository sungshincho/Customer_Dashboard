// ============================================================================
// DataSourceCards.tsx - 데이터 소스 상태 카드
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Users,
  Package,
  Wifi,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import type { DataSourceStatus } from '../types';

interface DataSourceCardsProps {
  dataSources: Record<string, DataSourceStatus>;
}

const sourceIcons: Record<string, any> = {
  pos: ShoppingCart,
  sensor: Wifi,
  crm: Users,
  product: Package,
  external: Cloud,
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  error: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  active: '연결됨',
  inactive: '비활성',
  error: '오류',
};

export function DataSourceCards({ dataSources }: DataSourceCardsProps) {
  const sources = Object.entries(dataSources);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
          데이터 소스
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sources.map(([key, source]) => {
            const Icon = sourceIcons[key] || Cloud;
            const StatusIcon =
              source.status === 'active'
                ? CheckCircle
                : source.status === 'error'
                ? XCircle
                : AlertCircle;

            return (
              <div
                key={key}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${statusColors[source.status]} flex items-center justify-center`}
                  >
                    <StatusIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {source.name}
                </span>
                <Badge
                  variant={source.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1 text-xs"
                >
                  {statusLabels[source.status]}
                </Badge>
                {source.last_sync && (
                  <span className="mt-1 text-xs text-gray-500">
                    {formatRelativeTime(source.last_sync)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  return `${diffDays}일 전`;
}
