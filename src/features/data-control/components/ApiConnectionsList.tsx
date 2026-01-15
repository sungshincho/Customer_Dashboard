// ============================================================================
// Phase 7: API Connections List Component
// ============================================================================

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plug,
  MoreVertical,
  PlayCircle,
  TestTube,
  Settings,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  useApiConnections,
  useTestConnection,
  useSyncConnection,
  useDeleteConnection,
  useToggleConnectionStatus,
} from '../hooks/useApiConnector';
import {
  ApiConnection,
  ConnectionStatus,
  DATA_CATEGORIES,
} from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// ============================================================================
// 상태 배지 컴포넌트
// ============================================================================

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const variants: Record<ConnectionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
    active: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, label: '활성' },
    inactive: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: '비활성' },
    error: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: '오류' },
    testing: { variant: 'outline', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: '테스트 중' },
  };

  const config = variants[status] || variants.inactive;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// 카테고리 아이콘
// ============================================================================

function getCategoryIcon(category?: string) {
  const cat = DATA_CATEGORIES.find(c => c.value === category);
  return cat?.label || category || '알 수 없음';
}

// ============================================================================
// 연결 카드 컴포넌트
// ============================================================================

interface ConnectionCardProps {
  connection: ApiConnection;
  onEdit?: (id: string) => void;
}

function ConnectionCard({ connection, onEdit }: ConnectionCardProps) {
  const testMutation = useTestConnection();
  const syncMutation = useSyncConnection();
  const deleteMutation = useDeleteConnection();
  const toggleMutation = useToggleConnectionStatus();

  // 시스템 관리 컨텍스트 데이터 소스 여부 (날씨, 공휴일 등)
  const isSystemContext = connection.is_system_managed || connection.connection_category === 'context';

  const handleTest = () => {
    testMutation.mutate({ connectionId: connection.id });
  };

  const handleSync = () => {
    syncMutation.mutate(connection.id);
  };

  const handleDelete = () => {
    if (confirm('이 연결을 삭제하시겠습니까?')) {
      deleteMutation.mutate(connection.id);
    }
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id: connection.id, isActive: !connection.is_active });
  };

  const isLoading = testMutation.isPending || syncMutation.isPending;

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">{connection.name}</CardTitle>
              <CardDescription className="text-xs">
                {connection.provider && `${connection.provider} / `}
                {getCategoryIcon(connection.data_category)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 시스템 컨텍스트는 항상 활성으로 표시 */}
            <StatusBadge status={isSystemContext ? 'active' : connection.status} />
            {isSystemContext && (
              <Badge variant="outline" className="text-xs">
                시스템
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isSystemContext ? (
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    자동 동기화 (Edge Function)
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleTest} disabled={isLoading}>
                      <TestTube className="h-4 w-4 mr-2" />
                      연결 테스트
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSync} disabled={isLoading || connection.status === 'error'}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      지금 동기화
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(connection.id)}>
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggle}>
                  {connection.is_active ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      비활성화
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      활성화
                    </>
                  )}
                </DropdownMenuItem>
                {!isSystemContext && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {/* 시스템 컨텍스트는 자동 연결 메시지만 표시 */}
          {isSystemContext ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>자동 연결됨 (Edge Function 경유)</span>
            </div>
          ) : (
            <>
              {/* 마지막 동기화 */}
              {connection.last_sync && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    마지막 동기화:{' '}
                    {formatDistanceToNow(new Date(connection.last_sync), { addSuffix: true, locale: ko })}
                  </span>
                </div>
              )}

              {/* 총 동기화 레코드 */}
              {connection.total_records_synced !== undefined && connection.total_records_synced > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  <span>{connection.total_records_synced.toLocaleString()}개 레코드 동기화됨</span>
                </div>
              )}

              {/* 오류 메시지 */}
              {connection.status === 'error' && connection.last_error && (
                <div className="flex items-start gap-2 text-destructive bg-destructive/10 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{connection.last_error}</span>
                </div>
              )}
            </>
          )}

          {/* 테스트/동기화 결과 */}
          {testMutation.isSuccess && (
            <div className={`flex items-center gap-2 p-2 rounded text-xs ${
              testMutation.data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {testMutation.data.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  테스트 성공 ({testMutation.data.response_time_ms}ms)
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  테스트 실패: {testMutation.data.error || testMutation.data.message}
                </>
              )}
            </div>
          )}

          {syncMutation.isSuccess && (
            <div className={`flex items-center gap-2 p-2 rounded text-xs ${
              syncMutation.data.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {syncMutation.data.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  동기화 완료: {syncMutation.data.records_created}개 생성
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  동기화 실패: {syncMutation.data.error}
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// API Connections List 메인 컴포넌트
// ============================================================================

interface ApiConnectionsListProps {
  orgId?: string;
  storeId?: string;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
}

export function ApiConnectionsList({ orgId, storeId, onEdit, onAdd }: ApiConnectionsListProps) {
  const { data: connections, isLoading, isFetching, error, refetch } = useApiConnections({ orgId, storeId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>연결 목록을 불러오는 중 오류가 발생했습니다.</span>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">API 연결 없음</h3>
            <p className="text-muted-foreground mb-4">
              외부 시스템에서 데이터를 자동으로 가져오려면 API 연결을 추가하세요.
            </p>
            {onAdd && (
              <Button onClick={onAdd}>
                <Plug className="h-4 w-4 mr-2" />
                새 연결 추가
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">API 연결 ({connections.length})</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              console.log('API 연결 새로고침 버튼 클릭됨');
              refetch();
            }}
            disabled={isFetching}
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plug className="h-4 w-4 mr-2" />
              새 연결 추가
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

export default ApiConnectionsList;
