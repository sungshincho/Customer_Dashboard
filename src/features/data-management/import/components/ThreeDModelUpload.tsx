import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModelUploader } from "@/features/digital-twin/components/ModelUploader";
import { insertSample3DData, checkSampleDataExists, deleteSampleData } from "@/features/digital-twin/utils/sampleDataGenerator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Database, Check, Loader2, Trash2, Box, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThreeDModelUploadProps {
  storeId?: string;
}

export function ThreeDModelUpload({ storeId }: ThreeDModelUploadProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkData = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const exists = await checkSampleDataExists(user.id, storeId);
      setDataExists(exists);
    } catch (error) {
      console.error('Check data error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleInsertSampleData = async () => {
    if (!user) return;
    if (!storeId) {
      toast.error('먼저 매장을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await insertSample3DData(user.id, storeId);
      toast.success(
        `샘플 데이터가 추가되었습니다: ${result.entityTypes}개 타입, ${result.entities}개 엔티티`
      );
      await checkData();
    } catch (error: any) {
      console.error('Insert sample data error:', error);
      
      if (error.message.includes('이미 존재') || error.message.includes('duplicate key')) {
        toast.info('샘플 데이터가 이미 존재합니다');
        await checkData();
      } else {
        toast.error(`데이터 추가 실패: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSampleData = async () => {
    if (!user || !storeId) return;

    setLoading(true);
    try {
      await deleteSampleData(user.id, storeId);
      toast.success('샘플 데이터가 삭제되었습니다');
      await checkData();
    } catch (error: any) {
      console.error('Delete sample data error:', error);
      toast.error(`데이터 삭제 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!storeId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            3D 모델과 데이터를 업로드하려면 먼저 사이드바에서 매장을 선택하세요
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            3D 모델 업로드
          </TabsTrigger>
          <TabsTrigger value="sample">
            <Database className="w-4 h-4 mr-2" />
            샘플 데이터
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>3D 모델 업로드</CardTitle>
              <CardDescription>
                매장의 3D 모델(.glb 또는 .gltf)을 업로드하여 디지털 트윈을 구축하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storeId ? (
                <ModelUploader />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  매장을 선택하면 3D 모델을 업로드할 수 있습니다
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D 모델 제작 가이드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📐 좌표계 및 스케일</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Y-up, Right-handed 좌표계 사용</li>
                  <li>1 unit = 1 meter (실제 크기 그대로)</li>
                  <li>매장 입구를 (0, 0, 0)으로 설정 권장</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">📦 파일 포맷</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>.glb (권장) - Binary glTF, 단일 파일</li>
                  <li>.gltf - Text glTF + 별도 리소스</li>
                  <li>파일 크기: 20MB 이하</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚡ 최적화</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>폴리곤 수 최소화 (10만 이하 권장)</li>
                  <li>텍스처 압축 (1024x1024 이하)</li>
                  <li>불필요한 노드 제거</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sample">
          <Card>
            <CardHeader>
              <CardTitle>샘플 온톨로지 데이터</CardTitle>
              <CardDescription>
                테스트용 샘플 데이터를 생성하여 시스템을 빠르게 체험해보세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checking ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">데이터 확인 중...</p>
                </div>
              ) : dataExists ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      샘플 데이터가 이미 생성되어 있습니다
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteSampleData}
                    disabled={loading || !storeId}
                    className="w-full"
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
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">다음 샘플 데이터가 생성됩니다:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Entity Types: StoreSpace, Shelf, DisplayTable, Product</li>
                      <li>샘플 진열대 및 제품 배치</li>
                      <li>3D 좌표 및 관계 정보</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleInsertSampleData}
                    disabled={loading || !storeId}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        샘플 데이터 생성
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
