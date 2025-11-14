import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Database, Building2, Network } from 'lucide-react';
import { useDataReadiness } from '@/hooks/useDataReadiness';

interface DataReadinessGuardProps {
  children: ReactNode;
  requireWifiData?: boolean; // WiFi 데이터가 필수인 기능인 경우
}

/**
 * 데모 프로세스 가드 컴포넌트
 * 매장 선택, 데이터 임포트, 온톨로지 스키마 조건을 확인하여
 * 조건이 충족되지 않으면 안내 메시지를 표시합니다.
 */
export function DataReadinessGuard({ children, requireWifiData = false }: DataReadinessGuardProps) {
  const navigate = useNavigate();
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

  // WiFi 데이터가 필수인데 없는 경우
  if (requireWifiData && !hasWifiData) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-warning">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-warning" />
              <div>
                <CardTitle>WiFi 트래킹 데이터가 필요합니다</CardTitle>
                <CardDescription>
                  이 기능을 사용하려면 WiFi 트래킹 데이터를 먼저 임포트해야 합니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Network className="w-4 h-4" />
              <AlertDescription>
                통합 데이터 관리 페이지에서 WiFi 트래킹 데이터를 업로드하거나,
                NeuralSense 설정 페이지에서 실시간 WiFi 센서를 연결하세요.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={() => navigate('/data-import')}>
                데이터 임포트
              </Button>
              <Button variant="outline" onClick={() => navigate('/neuralsense-settings')}>
                NeuralSense 설정
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 기본 조건이 충족되지 않은 경우
  if (!isReady) {
    const status = getStatusMessage();
    
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div>
                <CardTitle>{status.title}</CardTitle>
                <CardDescription>{status.message}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 진행 상태 표시 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className={`w-5 h-5 ${hasStore ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">매장 등록</p>
                  <p className="text-xs text-muted-foreground">
                    {hasStore ? '✓ 완료' : '○ 미완료'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Database className={`w-5 h-5 ${hasImportedData ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">데이터 임포트</p>
                  <p className="text-xs text-muted-foreground">
                    {hasImportedData ? `✓ ${importCount}개 데이터셋 임포트됨` : '○ 미완료'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Network className={`w-5 h-5 ${hasOntologySchema ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">온톨로지 스키마</p>
                  <p className="text-xs text-muted-foreground">
                    {hasOntologySchema ? '✓ 설정됨' : '○ 미설정'}
                  </p>
                </div>
              </div>
            </div>

            {/* 임포트된 데이터 타입 요약 */}
            {hasImportedData && Object.keys(dataTypesSummary).length > 0 && (
              <Alert>
                <Database className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">임포트된 데이터:</p>
                  <div className="text-xs space-y-1">
                    {Object.entries(dataTypesSummary).map(([type, count]) => (
                      <p key={type}>• {type}: {count}개</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* 다음 단계 안내 */}
            {status.action && status.actionPath && (
              <Button 
                onClick={() => navigate(status.actionPath!)}
                className="w-full"
              >
                {status.action}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 모든 조건이 충족된 경우 children 렌더링
  return <>{children}</>;
}
