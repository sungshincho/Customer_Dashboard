// ============================================================================
// ImportHistoryWidget.tsx
// 임포트 히스토리 위젯 - Phase 3
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  History,
  RefreshCw,
  Undo2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================

interface ImportRecord {
  id: string;
  session_id: string;
  user_id: string;
  org_id: string | null;
  store_id: string | null;
  import_type: string;
  target_table: string;
  file_name: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed' | 'rolled_back';
  started_at: string;
  completed_at: string | null;
  error_details: Array<{ batch_start: number; batch_end: number; error: string }> | null;
  created_at: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }
> = {
  pending: {
    label: '대기',
    variant: 'secondary',
    icon: <Loader2 className="w-3 h-3" />,
  },
  processing: {
    label: '처리중',
    variant: 'secondary',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  completed: {
    label: '완료',
    variant: 'default',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  partial: {
    label: '부분완료',
    variant: 'outline',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  failed: {
    label: '실패',
    variant: 'destructive',
    icon: <XCircle className="w-3 h-3" />,
  },
  rolled_back: {
    label: '롤백됨',
    variant: 'outline',
    icon: <Undo2 className="w-3 h-3" />,
  },
};

const IMPORT_TYPE_LABELS: Record<string, string> = {
  products: '상품',
  customers: '고객',
  transactions: '거래',
  staff: '직원',
  inventory: '재고',
};

// ============================================================================
// Component
// ============================================================================

interface ImportHistoryWidgetProps {
  onRollback?: (importId: string) => void;
  className?: string;
}

export function ImportHistoryWidget({ onRollback, className }: ImportHistoryWidgetProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_data_imports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setImports((data as unknown as ImportRecord[]) || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
      toast({
        title: '히스토리 로드 실패',
        description: '임포트 히스토리를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 롤백 핸들러
  const handleRollback = async (importRecord: ImportRecord) => {
    setIsRollingBack(importRecord.id);
    setShowRollbackDialog(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // rollback-import Edge Function 호출
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rollback-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            import_id: importRecord.id,
            session_id: importRecord.session_id,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '롤백에 실패했습니다.');
      }

      toast({
        title: '롤백 완료',
        description: `${data.rolled_back_rows}개 레코드가 롤백되었습니다.`,
      });

      // 히스토리 새로고침
      loadHistory();
      onRollback?.(importRecord.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '롤백 실패';
      toast({
        title: '롤백 실패',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsRollingBack(null);
      setSelectedImport(null);
    }
  };

  // 에러 리포트 다운로드
  const handleDownloadErrors = (importRecord: ImportRecord) => {
    if (!importRecord.error_details || importRecord.error_details.length === 0) {
      toast({
        title: '에러 없음',
        description: '해당 임포트에 에러가 없습니다.',
      });
      return;
    }

    const content = importRecord.error_details
      .map((err, i) => `${i + 1}. 행 ${err.batch_start}-${err.batch_end}: ${err.error}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${importRecord.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            임포트 히스토리
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && imports.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : imports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>임포트 기록이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead className="text-right">행</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="max-w-[150px] truncate font-medium">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{record.file_name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{record.file_name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {IMPORT_TYPE_LABELS[record.import_type] || record.import_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">{record.imported_rows}</span>
                        {record.failed_rows > 0 && (
                          <>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-red-600">{record.failed_rows}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="gap-1">
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(record.created_at), 'MM/dd HH:mm', { locale: ko })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* 에러 다운로드 */}
                          {record.error_details && record.error_details.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleDownloadErrors(record)}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>에러 리포트 다운로드</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {/* 롤백 버튼 */}
                          {(record.status === 'completed' || record.status === 'partial') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-orange-500 hover:text-orange-600"
                                    disabled={isRollingBack === record.id}
                                    onClick={() => {
                                      setSelectedImport(record);
                                      setShowRollbackDialog(true);
                                    }}
                                  >
                                    {isRollingBack === record.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>임포트 롤백</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* 롤백 확인 다이얼로그 */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-orange-500" />
              임포트 롤백
            </DialogTitle>
            <DialogDescription>
              이 작업은 임포트된 데이터를 삭제합니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {selectedImport && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">파일명:</span>
                <span className="font-medium">{selectedImport.file_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">타입:</span>
                <Badge variant="secondary">
                  {IMPORT_TYPE_LABELS[selectedImport.import_type] || selectedImport.import_type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">임포트 행:</span>
                <span className="text-green-600 font-medium">{selectedImport.imported_rows}행</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">일시:</span>
                <span>
                  {format(new Date(selectedImport.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedImport && handleRollback(selectedImport)}
              disabled={isRollingBack !== null}
            >
              {isRollingBack ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Undo2 className="w-4 h-4 mr-1" />
              )}
              롤백 실행
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ImportHistoryWidget;
