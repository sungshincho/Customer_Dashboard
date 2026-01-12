/**
 * 적용 이력 테이블 컴포넌트
 * 3D Glassmorphism + Monochrome Design
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppliedStrategy, StrategyStatus, StrategyResult } from '../types/roi.types';
import { getModuleConfig, STATUS_CONFIG, RESULT_CONFIG } from '../utils/moduleConfig';

// ============================================================================
// 3D 스타일 시스템
// ============================================================================
const getText3D = (isDark: boolean) => ({
  number: isDark ? {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  } as React.CSSProperties : {
    fontWeight: 800, letterSpacing: '-0.03em', color: '#0a0a0c',
  } as React.CSSProperties,
  body: isDark ? {
    fontWeight: 500, color: 'rgba(255,255,255,0.6)',
  } as React.CSSProperties : {
    fontWeight: 500, color: '#515158',
  } as React.CSSProperties,
});

const GlassCard = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{ perspective: '1200px' }}>
    <div style={{
      borderRadius: '20px', padding: '1.5px',
      background: dark
        ? 'linear-gradient(145deg, rgba(75,75,85,0.9) 0%, rgba(50,50,60,0.8) 50%, rgba(65,65,75,0.9) 100%)'
        : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.6) 50%, rgba(255,255,255,0.93) 100%)',
      boxShadow: dark
        ? '0 2px 4px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.25)'
        : '0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.02), 0 4px 4px rgba(0,0,0,0.02), 0 8px 8px rgba(0,0,0,0.02)',
    }}>
      <div style={{
        background: dark
          ? 'linear-gradient(165deg, rgba(48,48,58,0.98) 0%, rgba(32,32,40,0.97) 30%, rgba(42,42,52,0.98) 60%, rgba(35,35,45,0.97) 100%)'
          : 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(253,253,255,0.88) 25%, rgba(255,255,255,0.92) 50%, rgba(251,251,254,0.85) 75%, rgba(255,255,255,0.94) 100%)',
        backdropFilter: 'blur(80px) saturate(200%)', borderRadius: '19px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: dark
            ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 80%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 10%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 90%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
      </div>
    </div>
  </div>
);

const Icon3D = ({ children, size = 24, dark = false }: { children: React.ReactNode; size?: number; dark?: boolean }) => (
  <div style={{
    width: size, height: size,
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.09) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(230,230,238,0.95) 40%, rgba(245,245,250,0.98) 100%)',
    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.95)',
    boxShadow: dark
      ? 'inset 0 1px 2px rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.2)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,1)',
    fontSize: '12px',
  }}>
    {children}
  </div>
);

const Badge3D = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
    background: dark
      ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%)'
      : 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(240,240,245,0.95) 40%, rgba(250,250,252,0.98) 100%)',
    borderRadius: '6px',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
    boxShadow: dark
      ? 'inset 0 1px 1px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.15)'
      : '0 1px 2px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,1)',
    fontSize: '11px', fontWeight: 500,
  }}>
    {children}
  </div>
);

interface AppliedStrategyTableProps {
  data: AppliedStrategy[] | undefined;
  isLoading: boolean;
  onRowClick: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

const formatPercent = (value: number | null): string => {
  if (value === null) return '-';
  return `${value.toFixed(0)}%`;
};

const getStatusLabel = (status: StrategyStatus): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'cancelled': return '취소됨';
    case 'completed': return '완료';
    default: return '-';
  }
};

const getResultLabel = (result: StrategyResult): string => {
  switch (result) {
    case 'success': return '목표 달성';
    case 'partial': return '부분 달성';
    case 'failed': return '미달성';
    default: return '-';
  }
};

export const AppliedStrategyTable: React.FC<AppliedStrategyTableProps> = ({
  data,
  isLoading,
  onRowClick,
}) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const text3D = getText3D(isDark);

  // 필터링
  const filteredData = (data || []).filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
    return true;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    const headers = ['날짜', '유형', '전략명', '예상ROI', '실제ROI', '상태'];
    const rows = filteredData.map((item) => [
      formatDate(item.createdAt),
      getModuleConfig(item.sourceModule).shortName,
      item.name,
      formatPercent(item.expectedRoi),
      formatPercent(item.currentRoi || item.finalRoi),
      item.status,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roi_strategies_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <GlassCard dark={isDark}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="animate-pulse" style={{ height: '20px', width: '100px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
            <div className="animate-pulse" style={{ height: '32px', width: '120px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: '48px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard dark={isDark}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, ...text3D.number }}>📋 적용 이력</h3>
            <Badge3D dark={isDark}>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>{filteredData.length}건</span>
            </Badge3D>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger style={{
                width: '110px', height: '32px', fontSize: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '8px',
              }}>
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger style={{
                width: '110px', height: '32px', fontSize: '12px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '8px',
              }}>
                <SelectValue placeholder="출처" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 출처</SelectItem>
                <SelectItem value="2d_simulation">2D 시뮬</SelectItem>
                <SelectItem value="3d_simulation">3D 시뮬</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)',
                borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                color: isDark ? '#fff' : '#1a1a1f', cursor: 'pointer',
              }}
            >
              <Download className="w-3.5 h-3.5" /> 내보내기
            </button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', ...text3D.body }}>적용된 전략이 없습니다</p>
            <p style={{ fontSize: '12px', marginTop: '4px', color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
              인사이트 허브나 디지털트윈에서 전략을 적용해보세요
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>날짜</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>유형</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>전략명</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>예상</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>실제</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const config = getModuleConfig(item.sourceModule);
                    const actualRoi = item.finalRoi || item.currentRoi;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onRowClick(item.id)}
                        style={{
                          borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.04)',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 8px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>
                          {formatDate(item.createdAt)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon3D size={24} dark={isDark}>{config.icon}</Icon3D>
                            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.7)' : '#515158' }}>{config.shortName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <p style={{ fontWeight: 600, margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? '#fff' : '#1a1a1f' }}>
                            {item.name}
                          </p>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 8px', color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280' }}>
                          {formatPercent(item.expectedRoi)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1f' }}>
                          {formatPercent(actualRoi)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1f' }}>
                          {item.status === 'completed' ? getResultLabel(item.result) : getStatusLabel(item.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px', borderRadius: '6px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: isDark ? '#fff' : '#374151' }} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center' }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af', padding: '0 4px' }}>...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: page === p
                              ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)')
                              : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                            border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: page === p ? 600 : 400,
                            color: isDark ? '#fff' : '#1a1a1f',
                          }}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px', borderRadius: '6px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    border: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1,
                  }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: isDark ? '#fff' : '#374151' }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
};

export default AppliedStrategyTable;
