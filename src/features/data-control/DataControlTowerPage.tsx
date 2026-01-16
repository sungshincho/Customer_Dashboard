// ============================================================================
// DataControlTowerPage.tsx
// 데이터 컨트롤타워 - 통합 데이터 관리 대시보드
// ============================================================================

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Database,
  RefreshCw,
  ExternalLink,
  Activity,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useDataControlTowerStatus, useContextDataSources, useWeatherDataStatus, useEventsDataStatus } from './hooks/useDataControlTower';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { fetchHolidayData } from '@/features/studio/services/environmentDataService';
import {
  UnifiedDataSourceCards,
  PipelineTimeline,
  RecentImportsList,
  DataQualityScoreCard,
  AddConnectorDialog,
  ApiConnectionsList,
  DataImportWidget,
} from './components';

export default function DataControlTowerPage() {
  const [isDark, setIsDark] = useState(false);
  const [showAddConnector, setShowAddConnector] = useState(false);
  const [holidayCount, setHolidayCount] = useState<number>(0);
  const { data: status, isLoading, isFetching, error, refetch } = useDataControlTowerStatus();
  const { data: contextSources, isLoading: isContextLoading } = useContextDataSources();
  const { data: weatherStatus } = useWeatherDataStatus();
  const { data: eventsStatus } = useEventsDataStatus();
  const { orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const navigate = useNavigate();

  // 컨텍스트 데이터 상태 구성 (holidayCount는 API에서 직접 가져온 실제 건수 사용)
  const contextDataStatus = weatherStatus || holidayCount > 0
    ? {
        weather: weatherStatus
          ? {
              record_count: weatherStatus.record_count,
              has_recent: weatherStatus.latest_date
                ? new Date(weatherStatus.latest_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                : false,
            }
          : undefined,
        events: holidayCount > 0
          ? {
              record_count: holidayCount,
              upcoming_count: eventsStatus?.upcoming_count || 0,
            }
          : undefined,
      }
    : undefined;

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // 컨텍스트 데이터(공휴일) 자동 동기화 - 페이지 로드 시 1회
  useEffect(() => {
    const syncHolidays = async () => {
      console.log('[DataControlTower] 공휴일 데이터 자동 동기화 시작...');
      const result = await fetchHolidayData();
      if (result.data.length > 0) {
        console.log(`[DataControlTower] 공휴일 데이터 동기화 완료: ${result.data.length}건`);
        setHolidayCount(result.data.length);
      }
    };
    syncHolidays();
  }, []);

  const getHealthStatus = () => {
    if (!status?.quality_score) return { label: 'Unknown', color: 'bg-gray-500' };
    const score = status.quality_score.overall_score;
    if (score >= 80) return { label: 'Healthy', color: 'bg-green-500' };
    if (score >= 50) return { label: 'Warning', color: 'bg-yellow-500' };
    return { label: 'Critical', color: 'bg-red-500' };
  };

  const healthStatus = getHealthStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background:
                  'linear-gradient(145deg, #2f2f38 0%, #1c1c22 35%, #282830 65%, #1e1e26 100%)',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="absolute"
                style={{
                  top: '2px',
                  left: '18%',
                  right: '18%',
                  height: '1px',
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                }}
              />
              <Database
                className="h-5 w-5"
                style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            {/* Title */}
            <div>
              <h1
                className="text-2xl"
                style={{
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  ...(isDark
                    ? {
                        color: '#ffffff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }
                    : {
                        background:
                          'linear-gradient(180deg, #1a1a1f 0%, #0a0a0c 35%, #1a1a1f 70%, #0c0c0e 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
                      }),
                }}
              >
                데이터 컨트롤타워
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{
                  fontWeight: 500,
                  color: isDark ? 'rgba(255,255,255,0.6)' : '#515158',
                  textShadow: isDark ? 'none' : '0 1px 0 rgba(255,255,255,0.5)',
                }}
              >
                Data Aggregator Hub - 단일 진실 소스
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Badge */}
            <Badge
              className={`${healthStatus.color} text-white border-0 gap-1`}
            >
              <Activity className="w-3 h-3" />
              Health: {healthStatus.label}
              {status?.quality_score && ` (${status.quality_score.overall_score}%)`}
            </Badge>

            {/* Refresh Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('새로고침 버튼 클릭됨');
                refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>

            {/* Add Connector Button */}
            <Button
              size="sm"
              onClick={() => setShowAddConnector(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              커넥터 추가
            </Button>

            {/* Lineage Link */}
            <Button variant="outline" size="sm" asChild>
              <Link to="/data/lineage">
                <ExternalLink className="w-4 h-4 mr-2" />
                Lineage 탐색
              </Link>
            </Button>
          </div>
        </div>

        {/* Add Connector Dialog */}
        <AddConnectorDialog
          open={showAddConnector}
          onOpenChange={setShowAddConnector}
          orgId={orgId}
          storeId={selectedStore?.id}
        />

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>데이터를 불러오는 중 오류가 발생했습니다: {error.message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !status && (
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Content */}
        {status && (
          <div className="space-y-6">
            {/* Row 1: Data Quality Score + Data Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DataQualityScoreCard score={status.quality_score} contextData={contextDataStatus} />
              <div className="lg:col-span-2">
                {/* 통합 데이터 소스 (비즈니스 + 컨텍스트) */}
                <UnifiedDataSourceCards
                  businessSources={status.data_sources}
                  contextSources={contextSources || []}
                  isContextLoading={isContextLoading}
                />
              </div>
            </div>

            {/* Row 2: Data Import Widget + API Connections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Import Widget - 파일 임포트 */}
              <DataImportWidget
                onImportComplete={(result) => {
                  console.log('Import completed:', result);
                  refetch();
                }}
              />

              {/* API Connections */}
              <ApiConnectionsList
                orgId={orgId}
                storeId={selectedStore?.id}
                onAdd={() => setShowAddConnector(true)}
                onEdit={(id) => navigate(`/data/connectors/${id}`)}
              />
            </div>

            {/* Row 3: Pipeline Timeline */}
            <PipelineTimeline stats={status.pipeline_stats} />

            {/* Row 3: Recent Imports */}
            <RecentImportsList
              imports={status.recent_imports}
              isLoading={isFetching}
              onRefresh={() => refetch()}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
