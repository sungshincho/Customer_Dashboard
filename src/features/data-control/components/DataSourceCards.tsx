// ============================================================================
// DataSourceCards.tsx - 데이터 소스 상태 카드 (비즈니스 + 컨텍스트)
// ============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Users,
  Package,
  Wifi,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Boxes,
  CloudSun,
  Calendar,
  TrendingUp,
  BarChart3,
  Database,
  Lock,
} from 'lucide-react';
import type { DataSourceStatus, ContextDataSource } from '../types';

// ============================================================================
// 비즈니스 데이터 소스 카드 (기존)
// ============================================================================

interface DataSourceCardsProps {
  dataSources: Record<string, DataSourceStatus>;
}

const sourceIcons: Record<string, any> = {
  pos: ShoppingCart,
  sensor: Wifi,
  crm: Users,
  product: Package,
  erp: Boxes,
  external: Cloud,
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  error: 'bg-red-500',
  testing: 'bg-yellow-500',
};

const statusLabels: Record<string, string> = {
  active: '연결됨',
  inactive: '비활성',
  error: '오류',
  testing: '테스트중',
};

export function DataSourceCards({ dataSources }: DataSourceCardsProps) {
  const sources = Object.entries(dataSources);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
          비즈니스 데이터 소스
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
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

// ============================================================================
// 컨텍스트 데이터 소스 카드 (날씨, 이벤트, 환율 등)
// ============================================================================

interface ContextDataSourceCardsProps {
  sources: ContextDataSource[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const contextIcons: Record<string, any> = {
  CloudSun: CloudSun,
  Calendar: Calendar,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Cloud: Cloud,
  Database: Database,
  weather: CloudSun,
  holidays: Calendar,
  exchange: TrendingUp,
  trends: BarChart3,
};

export function ContextDataSourceCards({
  sources,
  isLoading,
  onRefresh,
}: ContextDataSourceCardsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
            컨텍스트 데이터 소스
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              컨텍스트 데이터 소스
            </h3>
          </div>
          <div className="text-center py-8 text-gray-500">
            <CloudSun className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">컨텍스트 데이터 소스가 없습니다.</p>
            <p className="text-xs mt-1">시스템이 자동으로 기본 연결을 생성합니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            컨텍스트 데이터 소스
          </h3>
          <span className="text-xs text-gray-500">
            날씨, 공휴일, 이벤트 등 외부 환경 데이터
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sources.map((source) => {
            // 아이콘 결정 (icon_name > data_category > 기본)
            const iconKey = source.icon_name || source.data_category || 'Cloud';
            const Icon = contextIcons[iconKey] || Cloud;
            const StatusIcon =
              source.status === 'active'
                ? CheckCircle
                : source.status === 'error'
                ? XCircle
                : AlertCircle;

            return (
              <div
                key={source.id}
                className="flex flex-col items-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${statusColors[source.status] || 'bg-gray-400'} flex items-center justify-center`}
                  >
                    <StatusIcon className="w-3 h-3 text-white" />
                  </div>
                  {source.is_system_managed && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  {source.name}
                </span>
                <Badge
                  variant={source.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1 text-xs"
                >
                  {statusLabels[source.status] || source.status}
                </Badge>
                {source.total_records_synced > 0 && (
                  <span className="mt-1 text-xs text-gray-500">
                    {source.total_records_synced.toLocaleString()}건
                  </span>
                )}
                {source.last_sync && (
                  <span className="mt-0.5 text-xs text-gray-400">
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

// ============================================================================
// 통합 데이터 소스 카드 (비즈니스 + 컨텍스트)
// ============================================================================

interface UnifiedDataSourceCardsProps {
  businessSources: Record<string, DataSourceStatus>;
  contextSources: ContextDataSource[];
  isContextLoading?: boolean;
}

export function UnifiedDataSourceCards({
  businessSources,
  contextSources,
  isContextLoading,
}: UnifiedDataSourceCardsProps) {
  return (
    <div className="space-y-4">
      {/* 비즈니스 데이터 소스 */}
      <DataSourceCards dataSources={businessSources} />

      {/* 컨텍스트 데이터 소스 */}
      <ContextDataSourceCards sources={contextSources} isLoading={isContextLoading} />
    </div>
  );
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

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
