// ============================================================================
// RecentImportsList.tsx - 최근 Import 목록
// ============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useReplayImport } from '../hooks/useDataControlTower';
import type { RawImport } from '../types';

interface RecentImportsListProps {
  imports: RawImport[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; variant: any }> = {
  completed: {
    label: '완료',
    icon: CheckCircle,
    variant: 'default' as const,
  },
  failed: {
    label: '실패',
    icon: XCircle,
    variant: 'destructive' as const,
  },
  processing: {
    label: '처리 중',
    icon: Loader2,
    variant: 'secondary' as const,
  },
  pending: {
    label: '대기',
    icon: Clock,
    variant: 'outline' as const,
  },
};

const dataTypeLabels: Record<string, string> = {
  purchases: '구매 데이터',
  customers: '고객 데이터',
  products: '상품 데이터',
  visits: '방문 데이터',
  wifi: 'WiFi 센서',
  ble: 'BLE 센서',
  staff: '직원 데이터',
  unknown: '기타',
};

export function RecentImportsList({
  imports,
  isLoading,
  onRefresh,
}: RecentImportsListProps) {
  const { replay, isReplaying } = useReplayImport();
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const handleReplay = async (importId: string) => {
    setReplayingId(importId);
    try {
      await replay(importId, true);
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">최근 데이터 Import</CardTitle>
        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('최근 Import 새로고침 버튼 클릭됨');
              onRefresh();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Import 기록이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>소스</TableHead>
                  <TableHead>데이터 유형</TableHead>
                  <TableHead className="text-right">레코드</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((item) => {
                  const status = statusConfig[item.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const isReplayable =
                    item.status === 'completed' || item.status === 'failed';
                  const isCurrentlyReplaying = replayingId === item.id;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.source_name || item.source_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.source_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {dataTypeLabels[item.data_type || 'unknown'] ||
                            item.data_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.row_count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon
                            className={`w-3 h-3 ${
                              item.status === 'processing' ? 'animate-spin' : ''
                            }`}
                          />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {isReplayable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplay(item.id)}
                            disabled={isReplaying}
                            title="재처리"
                          >
                            {isCurrentlyReplaying ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  }
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
