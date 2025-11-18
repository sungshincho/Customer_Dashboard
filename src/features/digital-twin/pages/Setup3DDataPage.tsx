import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { insertSample3DData, checkSampleDataExists, deleteSampleData } from "../utils/sampleDataGenerator";
import { verifyAndCleanupModelUrls } from "../utils/verifyAndCleanupModelUrls";
import { toast } from "sonner";
import { Database, Check, Loader2, Upload, ArrowRight, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ModelUploader } from "../components/ModelUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Setup3DDataPage() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dataExists, setDataExists] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    checkData();
  }, [user, selectedStore]);

  const checkData = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const exists = await checkSampleDataExists(user.id, selectedStore?.id);
      setDataExists(exists);
    } catch (error) {
      console.error('Check data error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleInsertData = async () => {
    if (!user) return;
    if (!selectedStore) {
      toast.error('먼저 매장을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await insertSample3DData(user.id, selectedStore.id);
      toast.success(
        `샘플 데이터가 추가되었습니다: ${result.entityTypes}개 타입, ${result.entities}개 엔티티`
      );
      await checkData();
    } catch (error: any) {
      console.error('Insert sample data error:', error);
      
      if (error.message.includes('이미 존재') || error.message.includes('duplicate key')) {
        toast.info('샘플 데이터가 이미 존재합니다');
        await checkData();
      } else if (error.message.includes('unique constraint')) {
        toast.error('중복 데이터가 감지되었습니다. 기존 데이터를 먼저 삭제해주세요.');
        await checkData();
      } else {
        toast.error(`데이터 추가 실패: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!user) return;
    if (!selectedStore) {
      toast.error('먼저 매장을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      await deleteSampleData(user.id, selectedStore.id);
      toast.success('샘플 데이터가 삭제되었습니다');
      await checkData();
    } catch (error: any) {
      console.error('Delete sample data error:', error);
      toast.error(`데이터 삭제 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStorage = async () => {
    if (!user) return;

    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await verifyAndCleanupModelUrls(user.id, selectedStore?.id);
      
      if (result.success) {
        setSyncResult(result);
        
        if (result.cleaned === 0 && result.cleanedEntities === 0) {
          toast.success('모든 데이터가 스토리지와 동기화되어 있습니다');
        } else {
          toast.success(
            `스토리지 동기화 완료: 엔티티 타입 ${result.cleaned}개, 그래프 엔티티 ${result.cleanedEntities}개 정리됨`
          );
        }
      } else {
        throw new Error(result.error || '동기화 실패');
      }
    } catch (error: any) {
      console.error('Storage sync error:', error);
      toast.error(`스토리지 동기화 실패: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold gradient-text">3D 디지털 트윈 설정</h1>
          <p className="text-muted-foreground mt-2">
            온톨로지 기반 3D 시각화를 위한 샘플 데이터 및 3D 모델을 관리합니다
          </p>
        </div>

        <Tabs defaultValue="sample-data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sample-data">
              <Database className="w-4 h-4 mr-2" />
              샘플 데이터
            </TabsTrigger>
            <TabsTrigger value="3d-models">
              <Upload className="w-4 h-4 mr-2" />
              3D 모델 업로드
            </TabsTrigger>
            <TabsTrigger value="storage-sync">
              <RefreshCw className="w-4 h-4 mr-2" />
              스토리지 동기화
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sample-data">
            {!selectedStore && (
              <Alert className="mb-4">
                <AlertDescription>
                  샘플 데이터를 추가하려면 먼저 사이드바에서 매장을 선택해주세요. 샘플 데이터는 선택한 매장에만 저장됩니다.
                </AlertDescription>
              </Alert>
            )}
            
            <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">추가될 데이터</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">온톨로지 엔티티 타입 (4개)</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• StoreSpace (매장 공간) - 20x15m</li>
                    <li>• Shelf (선반) - 2x2x0.5m</li>
                    <li>• DisplayTable (테이블) - 1.5x0.8x1.5m</li>
                    <li>• Product (제품) - 0.3x0.4x0.2m</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">그래프 엔티티 (7개)</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 강남점 매장 (1개)</li>
                    <li>• 선반 (2개 - 좌우)</li>
                    <li>• 디스플레이 테이블 (1개)</li>
                    <li>• 제품 (3개 - 스마트폰, 이어폰)</li>
                  </ul>
                </div>
              </div>
            </div>

            {checking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">데이터 확인 중...</span>
              </div>
            ) : dataExists ? (
              <div className="space-y-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    샘플 데이터가 이미 존재합니다. 바로 3D 뷰를 생성하거나, 데이터를 삭제하고 다시 추가할 수 있습니다.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleDeleteData}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        샘플 데이터 삭제
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <Button
                  onClick={handleInsertData}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      데이터 추가 중...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      샘플 데이터 추가
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  온톨로지 기반 3D 시각화를 테스트할 수 있는 샘플 데이터를 추가합니다
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                테스트 방법
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>샘플 데이터 추가</strong> 버튼 클릭</li>
                <li>(선택) "3D 모델 업로드" 탭에서 .glb 파일 업로드</li>
                <li><strong>분석 페이지</strong>로 이동 (방문자 현황, 동선 히트맵, 고객 여정, 레이아웃 시뮬레이터)</li>
                <li><strong>"3D 뷰"</strong> 탭에서 "3D 매장 생성" 클릭</li>
                <li>온톨로지 기반으로 자동 조합된 3D 씬 확인</li>
              </ol>
              
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>참고:</strong> 3D 모델 파일이 없어도 색상이 있는 placeholder 박스로 표시됩니다. 
                  실제 3D 모델을 사용하려면 "3D 모델 업로드" 탭에서 .glb 파일을 업로드한 후 
                  스키마 빌더에서 엔티티 타입에 할당하세요.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </Card>
          </TabsContent>

          <TabsContent value="3d-models">
            <div className="space-y-6">
              <ModelUploader />
              
              <Card className="p-6">
                <h3 className="font-semibold mb-4">3D 모델 사용 방법</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
                  <li>
                    <strong>.glb 또는 .gltf 파일</strong>을 위 업로더에서 업로드
                  </li>
                  <li>
                    업로드된 파일의 URL이 자동으로 복사됩니다
                  </li>
                  <li>
                    <strong>스키마 빌더</strong> 페이지로 이동하여 엔티티 타입 편집
                  </li>
                  <li>
                    "3D Model URL" 필드에 복사한 URL을 붙여넣기
                  </li>
                  <li>
                    이후 생성되는 모든 3D 씬에서 실제 모델이 표시됩니다
                  </li>
                </ol>

                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>추천 3D 모델 소스:</strong><br/>
                    • <a href="https://sketchfab.com" target="_blank" rel="noopener" className="text-primary hover:underline">Sketchfab</a> - 무료 3D 모델 다운로드<br/>
                    • <a href="https://poly.pizza" target="_blank" rel="noopener" className="text-primary hover:underline">Poly Pizza</a> - 저용량 3D 에셋<br/>
                    • GLB 포맷 권장 (최적화된 바이너리 GLTF)
                  </AlertDescription>
                </Alert>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="storage-sync">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">스토리지 동기화</h2>
                  <p className="text-sm text-muted-foreground">
                    스토리지에서 삭제된 3D 모델 파일을 참조하는 엔티티 타입과 그래프 엔티티를 자동으로 정리합니다.
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>동기화 작업 내용</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>스토리지에 없는 3D 모델을 참조하는 엔티티 타입의 model_3d_url 제거</li>
                      <li>해당 엔티티 타입을 사용하는 그래프 엔티티의 3D 정보(위치, 회전, 스케일) 제거</li>
                      <li>참조되지 않는 스토리지 파일 목록 표시</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  <Button
                    onClick={handleSyncStorage}
                    disabled={syncing}
                    size="lg"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        동기화 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        스토리지 동기화 실행
                      </>
                    )}
                  </Button>
                </div>

                {syncResult && (
                  <div className="space-y-4 mt-6 border-t pt-6">
                    <h3 className="font-semibold">동기화 결과</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="text-2xl font-bold text-primary">{syncResult.checked}</div>
                        <div className="text-sm text-muted-foreground">검사한 엔티티 타입</div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="text-2xl font-bold text-destructive">{syncResult.cleaned}</div>
                        <div className="text-sm text-muted-foreground">정리된 엔티티 타입</div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="text-2xl font-bold text-destructive">{syncResult.cleanedEntities}</div>
                        <div className="text-sm text-muted-foreground">정리된 그래프 엔티티</div>
                      </div>
                    </div>

                    {syncResult.orphanedFiles > 0 && (
                      <Alert>
                        <AlertDescription>
                          ℹ️ 스토리지에 {syncResult.orphanedFiles}개의 참조되지 않는 파일이 있습니다. 
                          필요 없는 파일은 수동으로 삭제할 수 있습니다.
                        </AlertDescription>
                      </Alert>
                    )}

                    {syncResult.invalidUrls && syncResult.invalidUrls.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">정리된 엔티티 타입:</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {syncResult.invalidUrls.map((item: any, idx: number) => (
                            <li key={idx}>• {item.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
