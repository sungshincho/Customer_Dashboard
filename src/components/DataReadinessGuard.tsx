import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowRight, Database, Building2, FileText, Wifi, X } from 'lucide-react';
import { useDataReadiness } from '@/hooks/useDataReadiness';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DataReadinessGuardProps {
  children: ReactNode;
  requireWifiData?: boolean;
}

export function DataReadinessGuard({ children, requireWifiData = false }: DataReadinessGuardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasShownToast = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const {
    isReady,
    isLoading,
    hasStore,
    hasImportedData,
    hasOntologySchema,
    hasWifiData,
    getStatusMessage
  } = useDataReadiness();

  // 알림 제거: 토스트 알림을 표시하지 않음
  useEffect(() => {
    // 알림 기능 비활성화
  }, []);

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

  // 가이드 UI 제거: 데이터가 없어도 컨텐츠를 바로 표시
  return <>{children}</>;
}