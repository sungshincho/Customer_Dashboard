import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { verifyAndCleanupModelUrls } from "../utils/verifyAndCleanupModelUrls";
import { toast } from "sonner";
import { Loader2, Upload, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ModelUploader } from "../components/ModelUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function Setup3DDataPage() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [dataStats, setDataStats] = useState({
    entityTypes: 0,
    entities: 0,
    modelFiles: 0
  });

  useEffect(() => {
    loadDataStats();
  }, [user, selectedStore]);

  const loadDataStats = async () => {
    if (!user) return;

    try {
      // Count entity types
      const { count: entityTypesCount } = await supabase
        .from('ontology_entity_types')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count entities
      let entitiesQuery = supabase
        .from('graph_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (selectedStore) {
        entitiesQuery = entitiesQuery.eq('store_id', selectedStore.id);
      }

      const { count: entitiesCount } = await entitiesQuery;

      // Count model files
      const { data: files } = await supabase.storage
        .from('3d-models')
        .list(`${user.id}/${selectedStore?.id || 'global'}`);

      setDataStats({
        entityTypes: entityTypesCount || 0,
        entities: entitiesCount || 0,
        modelFiles: files?.length || 0
      });
    } catch (error) {
      console.error('Load stats error:', error);
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">3D 데이터 설정</h1>
          <p className="text-muted-foreground mt-2">
            3D 모델 업로드 및 온톨로지 엔티티 타입 연결
          </p>
        </div>

        {!selectedStore && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>매장을 선택해주세요</AlertTitle>
            <AlertDescription>
              사이드바에서 매장을 선택하면 해당 매장에 3D 데이터를 추가할 수 있습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 데이터 현황 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">엔티티 타입</div>
            <div className="text-3xl font-bold">{dataStats.entityTypes}</div>
            <p className="text-xs text-muted-foreground mt-1">생성된 타입</p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">그래프 엔티티</div>
            <div className="text-3xl font-bold">{dataStats.entities}</div>
            <p className="text-xs text-muted-foreground mt-1">배치된 객체</p>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-muted-foreground mb-2">3D 모델 파일</div>
            <div className="text-3xl font-bold">{dataStats.modelFiles}</div>
            <p className="text-xs text-muted-foreground mt-1">업로드된 모델</p>
          </Card>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              모델 업로드
            </TabsTrigger>
            <TabsTrigger value="sync">
              <RefreshCw className="w-4 h-4 mr-2" />
              스토리지 동기화
            </TabsTrigger>
          </TabsList>

          {/* 모델 업로드 탭 */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">3D 모델 업로드</h3>
              <p className="text-sm text-muted-foreground mb-6">
                GLB/GLTF 형식의 3D 모델을 업로드하세요. 파일명에 엔티티 타입을 포함하면 자동으로 매핑됩니다.
              </p>
              <ModelUploader />
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>파일명 규칙</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div>• <code>EntityType_description.glb</code> - 엔티티 타입과 자동 연결</div>
                  <div>• 예: <code>Shelf_wall-mounted.glb</code></div>
                  <div>• 업로드 후 "데이터 임포트" 페이지에서 온톨로지로 변환하세요</div>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* 스토리지 동기화 탭 */}
          <TabsContent value="sync" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">스토리지 동기화</h3>
              <p className="text-sm text-muted-foreground mb-6">
                스토리지에 없는 3D 모델을 참조하는 엔티티 타입과 그래프 엔티티를 정리합니다.
              </p>

              <Button 
                onClick={handleSyncStorage}
                disabled={syncing}
                size="lg"
                className="w-full"
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

              {syncResult && (
                <Alert className="mt-4">
                  <AlertTitle>동기화 결과</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>✅ 총 확인: 엔티티 타입 {syncResult.total}개, 그래프 엔티티 {syncResult.totalEntities}개</div>
                      <div>🔍 유효한 모델: {syncResult.verified}개</div>
                      <div>🗑️ 정리된 엔티티 타입: {syncResult.cleaned}개</div>
                      <div>🗑️ 정리된 그래프 엔티티: {syncResult.cleanedEntities}개</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>주의사항</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <div>• 스토리지에 실제로 존재하지 않는 3D 모델 URL이 정리됩니다</div>
                  <div>• 모델 파일이 삭제되면 관련 엔티티도 함께 정리됩니다</div>
                  <div>• 작업 전 중요한 데이터는 백업하세요</div>
                </div>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            다음 단계
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-medium">3D 모델 업로드</div>
                <div className="text-muted-foreground">
                  GLB/GLTF 파일을 업로드하고 엔티티 타입과 연결하세요
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-medium">온톨로지 변환</div>
                <div className="text-muted-foreground">
                  "데이터 임포트" 페이지에서 업로드된 모델을 온톨로지 엔티티로 변환하세요
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-medium">3D 씬 구성</div>
                <div className="text-muted-foreground">
                  "Digital Twin 3D" 페이지에서 매장 씬을 구성하고 시각화하세요
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
