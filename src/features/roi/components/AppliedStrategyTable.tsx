/**
 * 적용 이력 테이블 컴포넌트
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppliedStrategy, StrategyStatus, StrategyResult } from '../types/roi.types';
import { getModuleConfig, STATUS_CONFIG, RESULT_CONFIG } from '../utils/moduleConfig';
import { cn } from '@/lib/utils';

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

const getStatusIcon = (status: StrategyStatus): string => {
  return STATUS_CONFIG[status]?.icon || '❓';
};

const getResultIcon = (result: StrategyResult): string => {
  if (!result) return '🔄';
  return RESULT_CONFIG[result]?.icon || '❓';
};

export const AppliedStrategyTable: React.FC<AppliedStrategyTableProps> = ({
  data,
  isLoading,
  onRowClick,
}) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

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
    // CSV 내보내기 로직
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
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24 bg-white/10" />
            <Skeleton className="h-9 w-32 bg-white/10" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            📋 적용 이력
            <span className="text-sm font-normal text-white/50">({filteredData.length}건)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-sm">
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
              <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-sm">
                <SelectValue placeholder="출처" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 출처</SelectItem>
                <SelectItem value="2d_simulation">2D 시뮬</SelectItem>
                <SelectItem value="3d_simulation">3D 시뮬</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
              <Download className="w-4 h-4 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <p>적용된 전략이 없습니다</p>
            <p className="text-sm mt-1">인사이트 허브나 디지털트윈에서 전략을 적용해보세요</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-2 text-white/50 font-medium">날짜</th>
                    <th className="text-left py-2 px-2 text-white/50 font-medium">유형</th>
                    <th className="text-left py-2 px-2 text-white/50 font-medium">전략명</th>
                    <th className="text-center py-2 px-2 text-white/50 font-medium">예상</th>
                    <th className="text-center py-2 px-2 text-white/50 font-medium">실제</th>
                    <th className="text-center py-2 px-2 text-white/50 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const config = getModuleConfig(item.sourceModule);
                    const actualRoi = item.finalRoi || item.currentRoi;
                    const roiDiff = actualRoi !== null ? actualRoi - item.expectedRoi : null;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => onRowClick(item.id)}
                      >
                        <td className="py-3 px-2 text-white/60">{formatDate(item.createdAt)}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'w-6 h-6 rounded flex items-center justify-center text-xs',
                                config.bgColor
                              )}
                            >
                              {config.icon}
                            </span>
                            <span className={cn('text-xs', config.color)}>{config.shortName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <p className="text-white font-medium truncate max-w-[200px]">
                            {item.name}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-center text-white/60">
                          {formatPercent(item.expectedRoi)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              'font-medium',
                              actualRoi === null
                                ? 'text-white/40'
                                : roiDiff !== null && roiDiff >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                            )}
                          >
                            {formatPercent(actualRoi)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-lg">
                          {item.status === 'completed'
                            ? getResultIcon(item.result)
                            : getStatusIcon(item.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-white/30 px-1">...</span>
                        )}
                        <Button
                          variant={page === p ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setPage(p)}
                          className="h-8 w-8 p-0"
                        >
                          {p}
                        </Button>
                      </span>
                    ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AppliedStrategyTable;
