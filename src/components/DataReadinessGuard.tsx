import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Database, Building2, Network } from 'lucide-react';
import { useDataReadiness } from '@/hooks/useDataReadiness';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataReadinessGuardProps {
  children: ReactNode;
  requireWifiData?: boolean;
}

export function DataReadinessGuard({ children, requireWifiData = false }: DataReadinessGuardProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    isReady,
    isLoading,
    hasStore,
    hasImportedData,
    hasOntologySchema,
    hasWifiData,
    importCount,
    dataTypesSummary,
    getStatusMessage
  } = useDataReadiness();

  useEffect(() => {
    if (!isLoading && !isReady) {
      setOpen(true);
    } else if (!isLoading && requireWifiData && !hasWifiData) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLoading, isReady, requireWifiData, hasWifiData]);

  const handleAction = () => {
    const status = getStatusMessage();
    if (status.actionPath) {
      navigate(status.actionPath);
    }
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">데이터 준비 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (isReady && (!requireWifiData || hasWifiData)) {
    return <>{children}</>;
  }

  const status = getStatusMessage();
  const isWifiIssue = requireWifiData && !hasWifiData;

  return (
    <>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <AlertDialogTitle className="text-xl">
                {isWifiIssue ? 'WiFi 트래킹 데이터가 필요합니다' : status.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              {isWifiIssue 
                ? '이 기능을 사용하려면 WiFi 트래킹 데이터를 먼저 임포트해야 합니다.'
                : '분석 기능을 사용하려면 데이터를 업로드해야 합니다. 아래 단계를 완료해주세요.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Building2 className={`w-5 h-5 ${hasStore ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">1. 매장 등록</p>
                  <p className="text-xs text-muted-foreground">
                    {hasStore ? '✓ 완료' : '매장을 먼저 등록해주세요'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Database className={`w-5 h-5 ${hasImportedData ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">2. 데이터 임포트</p>
                  <p className="text-xs text-muted-foreground">
                    {hasImportedData 
                      ? `✓ ${importCount}개 파일 임포트됨` 
                      : 'CSV/Excel 파일을 업로드해주세요'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Network className={`w-5 h-5 ${hasOntologySchema ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">3. 온톨로지 스키마 설정</p>
                  <p className="text-xs text-muted-foreground">
                    {hasOntologySchema ? '✓ 완료' : '데이터 구조를 정의해주세요'}
                  </p>
                </div>
              </div>

              {requireWifiData && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Network className={`w-5 h-5 ${hasWifiData ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">4. WiFi 트래킹 데이터</p>
                    <p className="text-xs text-muted-foreground">
                      {hasWifiData ? '✓ 완료' : 'WiFi 데이터를 업로드해주세요'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={handleAction}>
              {status.action || '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}