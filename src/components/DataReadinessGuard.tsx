import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useDataReadiness } from '@/hooks/useDataReadiness';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface DataReadinessGuardProps {
  children: ReactNode;
  requireWifiData?: boolean;
}

export function DataReadinessGuard({ children, requireWifiData = false }: DataReadinessGuardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isReady,
    isLoading,
    hasStore,
    hasImportedData,
    hasOntologySchema,
    hasWifiData,
    getStatusMessage
  } = useDataReadiness();

  useEffect(() => {
    if (!isLoading && !isReady) {
      const status = getStatusMessage();
      toast({
        title: status.title,
        description: (
          <div className="space-y-2">
            <p>{status.message}</p>
            {status.actionPath && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(status.actionPath!)}
                className="mt-2"
              >
                {status.action}
              </Button>
            )}
          </div>
        ),
        duration: 6000,
      });
    } else if (!isLoading && requireWifiData && !hasWifiData) {
      toast({
        title: 'WiFi 트래킹 데이터가 필요합니다',
        description: (
          <div className="space-y-2">
            <p>이 기능을 사용하려면 WiFi 트래킹 데이터를 먼저 임포트해야 합니다.</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/data-import')}
              className="mt-2"
            >
              데이터 관리로 이동
            </Button>
          </div>
        ),
        duration: 6000,
      });
    }
  }, [isLoading, isReady, requireWifiData, hasWifiData, toast, navigate, getStatusMessage]);

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

  return <>{children}</>;
}