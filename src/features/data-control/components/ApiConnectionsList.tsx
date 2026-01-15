// ============================================================================
// ApiConnectionsList.tsx - API 연결 목록 (3D Glassmorphism Design)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Link2,
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
// 3D 스타일 시스템
// ============================================================================

const getText3D = (isDark: boolean) => ({
  title: isDark ? {
    fontWeight: 600, fontSize: '15px', color: '#ffffff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 600, fontSize: '15px',
    background: 'linear-gradient(180deg, #1a1a1f 0%, #2a2a2f 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  subtitle: isDark ? {
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#6b7280',
  } as React.CSSProperties,
  label: isDark ? {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    fontSize: '10px',
    background: 'linear-gradient(180deg, #6b7280 0%, #9ca3af 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '13px', color: '#6b7280',
  } as React.CSSProperties,
  small: isDark ? {
    fontWeight: 500, fontSize: '12px', color: 'rgba(255,255,255,0.5)',
  } as React.CSSProperties : {
    fontWeight: 500, fontSize: '12px', color: '#9ca3af',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px', height: '100%' }}>
    <div style={{
      borderRadius: '20px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
      height: '100%',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '19px', height: '100%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10, height: '100%' }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 40, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.3)'
      : '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,1)',
    flexShrink: 0,
  }}>
    {!dark && <div style={{ position: 'absolute', top: '2px', left: '15%', right: '15%', height: '35%',
      background: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
      borderRadius: '40% 40% 50% 50%', pointerEvents: 'none',
    }} />}
    <span style={{ position: 'relative', zIndex: 10 }}>{children}</span>
  </div>
);

const Badge3D = ({ children, dark = false, variant = 'default' }: { children: React.ReactNode; dark?: boolean; variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const colors = {
    default: { bg: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', text: dark ? 'rgba(255,255,255,0.8)' : '#6b7280' },
    success: { bg: dark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)', text: '#22c55e' },
    warning: { bg: dark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.1)', text: '#eab308' },
    error: { bg: dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', text: '#ef4444' },
  };
  const color = colors[variant];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
      background: color.bg,
      borderRadius: '8px',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
      fontSize: '11px', fontWeight: 600, color: color.text,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// 상태 배지 컴포넌트
// ============================================================================

function StatusBadge({ status, isDark }: { status: ConnectionStatus; isDark: boolean }) {
  const variants: Record<ConnectionStatus, { variant: 'success' | 'default' | 'error' | 'warning'; icon: React.ReactNode; label: string }> = {
    active: { variant: 'success', icon: <CheckCircle2 className="h-3 w-3" />, label: '활성' },
    inactive: { variant: 'default', icon: <Clock className="h-3 w-3" />, label: '비활성' },
    error: { variant: 'error', icon: <XCircle className="h-3 w-3" />, label: '오류' },
    testing: { variant: 'warning', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: '테스트 중' },
  };

  const config = variants[status] || variants.inactive;

  return (
    <Badge3D variant={config.variant} dark={isDark}>
      {config.icon}
      {config.label}
    </Badge3D>
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
  isDark: boolean;
}

function ConnectionCard({ connection, onEdit, isDark }: ConnectionCardProps) {
  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const testMutation = useTestConnection();
  const syncMutation = useSyncConnection();
  const deleteMutation = useDeleteConnection();
  const toggleMutation = useToggleConnectionStatus();

  // 시스템 관리 컨텍스트 데이터 소스 여부 (날씨, 공휴일 등)
  // data_category가 weather/holidays이면 시스템 컨텍스트로 판별
  const isSystemContext =
    connection.is_system_managed ||
    connection.connection_category === 'context' ||
    connection.data_category === 'weather' ||
    connection.data_category === 'holidays';

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
    <GlassCard dark={isDark}>
      <div style={{ padding: '16px', position: 'relative' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon3D size={36} dark={isDark}>
              <Plug className="w-4 h-4" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <h4 style={{ margin: 0, ...text3D.title }}>{connection.name}</h4>
              <p style={{ margin: '2px 0 0 0', ...text3D.small }}>
                {connection.provider && `${connection.provider} / `}
                {getCategoryIcon(connection.data_category)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={connection.status} isDark={isDark} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    borderRadius: '8px',
                  }}
                >
                  <MoreVertical className="h-4 w-4" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
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

        {/* 콘텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 시스템 컨텍스트: 자동 연결 메시지 표시, URL/에러 숨김 */}
          {isSystemContext ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
              <CheckCircle2 className="h-3 w-3" style={{ color: '#22c55e' }} />
              <span style={{ color: isDark ? 'rgba(34,197,94,0.9)' : '#16a34a' }}>
                자동 연결됨 (Edge Function 경유)
              </span>
            </div>
          ) : (
            /* 일반 연결: URL 표시 */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
              <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ••••••••
              </span>
            </div>
          )}

          {/* 마지막 동기화 */}
          {connection.last_sync ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
              <Clock className="h-3 w-3" />
              <span>
                마지막 동기화:{' '}
                {formatDistanceToNow(new Date(connection.last_sync), { addSuffix: true, locale: ko })}
              </span>
            </div>
          ) : null}

          {/* 총 동기화 레코드 */}
          {connection.total_records_synced !== undefined && connection.total_records_synced > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', ...text3D.small }}>
              <RefreshCw className="h-3 w-3" />
              <span>{connection.total_records_synced.toLocaleString()}개 레코드 동기화됨</span>
            </div>
          )}

          {/* 오류 메시지 - 시스템 컨텍스트에서는 숨김 */}
          {!isSystemContext && connection.status === 'error' && connection.last_error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px',
              borderRadius: '10px',
              background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
              border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)',
            }}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '12px', color: '#ef4444' }}>{connection.last_error}</span>
            </div>
          )}

          {/* 테스트/동기화 결과 */}
          {testMutation.isSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
              borderRadius: '10px',
              background: testMutation.data.success
                ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)')
                : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'),
              border: testMutation.data.success
                ? (isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.2)')
                : (isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)'),
            }}>
              {testMutation.data.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>
                    테스트 성공 ({testMutation.data.response_time_ms}ms)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '12px', color: '#ef4444' }}>
                    테스트 실패: {testMutation.data.error || testMutation.data.message}
                  </span>
                </>
              )}
            </div>
          )}

          {syncMutation.isSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
              borderRadius: '10px',
              background: syncMutation.data.success
                ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)')
                : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'),
              border: syncMutation.data.success
                ? (isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.2)')
                : (isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)'),
            }}>
              {syncMutation.data.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3" style={{ color: '#22c55e' }} />
                  <span style={{ fontSize: '12px', color: '#22c55e' }}>
                    동기화 완료: {syncMutation.data.records_created}개 생성
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '12px', color: '#ef4444' }}>
                    동기화 실패: {syncMutation.data.error}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: isDark ? 'rgba(32,32,40,0.8)' : 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '19px',
          }}>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
          </div>
        )}
      </div>
    </GlassCard>
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);
  const iconColor = isDark ? 'rgba(255,255,255,0.7)' : '#374151';

  const { data: connections, isLoading, isFetching, error, refetch } = useApiConnections({ orgId, storeId });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0',
      }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af' }} />
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '16px',
            borderRadius: '12px',
            background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
            border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(239,68,68,0.2)',
          }}>
            <AlertTriangle className="h-5 w-5" style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444' }}>연결 목록을 불러오는 중 오류가 발생했습니다.</span>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            style={{
              marginTop: '16px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            다시 시도
          </Button>
        </div>
      </GlassCard>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plug className="h-7 w-7" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', ...text3D.title }}>API 연결 없음</h3>
            <p style={{ margin: '0 0 16px 0', ...text3D.body }}>
              외부 시스템에서 데이터를 자동으로 가져오려면 API 연결을 추가하세요.
            </p>
            {onAdd && (
              <Button onClick={onAdd}>
                <Plug className="h-4 w-4 mr-2" />
                새 연결 추가
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '20px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon3D size={40} dark={isDark}>
              <Link2 className="w-5 h-5" style={{ color: iconColor }} />
            </Icon3D>
            <div>
              <span style={text3D.label}>API Connections</span>
              <h3 style={{ margin: '4px 0 0 0', ...text3D.title }}>API 연결 ({connections.length})</h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280' }} />
            </Button>
            {onAdd && (
              <Button onClick={onAdd}>
                <Plug className="h-4 w-4 mr-2" />
                새 연결 추가
              </Button>
            )}
          </div>
        </div>

        {/* 연결 카드 그리드 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onEdit={onEdit}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

export default ApiConnectionsList;
