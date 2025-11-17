import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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
  const hasShownToast = useRef(false);
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
    if (hasShownToast.current) return;

    if (!isLoading && !isReady) {
      hasShownToast.current = true;
      const status = getStatusMessage();
      toast({
        description: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-base">{status.title}</span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">{status.message}</p>
            {status.actionPath && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate(status.actionPath!)}
                className="w-full group animate-fade-in ml-7"
              >
                <span>{status.action}</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        ),
        duration: 8000,
      });
    } else if (!isLoading && requireWifiData && !hasWifiData) {
      hasShownToast.current = true;
      toast({
        description: (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-base">WiFi 트래킹 데이터가 필요합니다</span>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              이 기능을 사용하려면 WiFi 트래킹 데이터를 먼저 임포트해야 합니다.
            </p>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => navigate('/data-import')}
              className="w-full group animate-fade-in ml-7"
            >
              <span>데이터 관리로 이동</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        ),
        duration: 8000,
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