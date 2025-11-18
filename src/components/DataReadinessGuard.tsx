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

  // 데이터가 없을 때는 무조건 가이드 표시 (dismissed 무시)
  if (!isReady || (requireWifiData && !hasWifiData)) {
    const status = getStatusMessage();
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <div>
                <CardTitle className="text-2xl">{status.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {status.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 단계별 가이드 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">시작하기 위한 단계</h3>
              
              <div className="space-y-3">
                {/* Step 1: 매장 등록 */}
                <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                  !hasStore ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                }`}>
                  <div className={`rounded-full p-2 ${
                    !hasStore ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">1. 매장 등록</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      분석할 매장을 먼저 등록하고 선택해야 합니다.
                    </p>
                    {!hasStore && (
                      <Button onClick={() => navigate('/stores')} size="sm">
                        매장 등록하기 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {hasStore && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ 완료됨
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 2: 데이터 임포트 */}
                <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                  hasStore && !hasImportedData ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                }`}>
                  <div className={`rounded-full p-2 ${
                    hasStore && !hasImportedData ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">2. 데이터 임포트</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      분석할 고객, 상품, 구매 데이터를 업로드합니다.
                    </p>
                    {hasStore && !hasImportedData && (
                      <Button onClick={() => navigate('/data-import')} size="sm">
                        데이터 업로드하기 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {hasImportedData && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ 완료됨
                      </p>
                    )}
                    {!hasStore && (
                      <p className="text-sm text-muted-foreground italic">
                        이전 단계를 먼저 완료해주세요
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3: 온톨로지 스키마 */}
                <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                  hasStore && hasImportedData && !hasOntologySchema ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                }`}>
                  <div className={`rounded-full p-2 ${
                    hasStore && hasImportedData && !hasOntologySchema ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">3. 온톨로지 스키마 설정</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      데이터 분석을 위한 스키마를 설정합니다.
                    </p>
                    {hasStore && hasImportedData && !hasOntologySchema && (
                      <Button onClick={() => navigate('/schema-builder')} size="sm">
                        스키마 설정하기 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {hasOntologySchema && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ 완료됨
                      </p>
                    )}
                    {(!hasStore || !hasImportedData) && (
                      <p className="text-sm text-muted-foreground italic">
                        이전 단계를 먼저 완료해주세요
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional: WiFi 데이터 */}
                {requireWifiData && (
                  <div className={`flex items-start gap-4 p-4 rounded-lg border ${
                    isReady && !hasWifiData ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
                  }`}>
                    <div className={`rounded-full p-2 ${
                      isReady && !hasWifiData ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">4. WiFi 트래킹 데이터 (선택)</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        이 기능을 사용하려면 WiFi 트래킹 데이터가 필요합니다.
                      </p>
                      {isReady && !hasWifiData && (
                        <Button onClick={() => navigate('/data-import')} size="sm">
                          WiFi 데이터 업로드하기 <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                      {hasWifiData && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ 완료됨
                        </p>
                      )}
                      {!isReady && (
                        <p className="text-sm text-muted-foreground italic">
                          이전 단계를 먼저 완료해주세요
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 다음 단계 액션 버튼 */}
            {status.actionPath && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => navigate(status.actionPath!)}
                  size="lg"
                  className="w-full"
                >
                  {status.action} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}