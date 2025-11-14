import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelUploader } from "@/features/digital-twin/components/ModelUploader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Download, Box, Loader2, Database, Check, AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertSample3DData, checkSampleDataExists, deleteSampleData } from "@/features/digital-twin/utils/sampleDataGenerator";
import { useAuth } from "@/hooks/useAuth";
import { toast as sonnerToast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ThreeDModelUploadProps {
  storeId?: string;
}

interface StorageFile {
  name: string;
  path: string;
  size: number;
  created_at: string;
  url: string;
}

export function ThreeDModelUpload({ storeId }: ThreeDModelUploadProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadedModels, setUploadedModels] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadModels();
      checkData();
    }
  }, [storeId]);

  const loadModels = async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // 실제 스토리지 구조: {user_id}/{store_id}/3d-models/
      const basePath = `${currentUser.id}/${storeId}`;
      
      // 먼저 루트 레벨 확인
      const { data: rootItems, error: listError } = await supabase.storage
        .from('3d-models')
        .list(basePath);

      if (listError) throw listError;

      let allFiles: StorageFile[] = [];

      // 3d-models 서브폴더가 있는지 확인
      const has3DModelsFolder = rootItems?.some(item => item.name === '3d-models');
      
      if (has3DModelsFolder) {
        // 3d-models 서브폴더 안의 파일들 가져오기
        const { data: files, error } = await supabase.storage
          .from('3d-models')
          .list(`${basePath}/3d-models`, {
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) throw error;

        allFiles = (files || [])
          .filter(f => f.id) // 폴더 제외, 파일만
          .map((file) => {
            const filePath = `${basePath}/3d-models/${file.name}`;
            const { data: { publicUrl } } = supabase.storage
              .from('3d-models')
              .getPublicUrl(filePath);

            return {
              name: file.name,
              path: filePath,
              size: file.metadata?.size || 0,
              created_at: file.created_at,
              url: publicUrl
            };
          });
      }

      // 루트 레벨의 .glb/.gltf 파일도 확인 (이전 버전 호환성)
      const rootFiles = (rootItems || [])
        .filter(item => item.id && (item.name.endsWith('.glb') || item.name.endsWith('.gltf')))
        .map((file) => {
          const filePath = `${basePath}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('3d-models')
            .getPublicUrl(filePath);

          return {
            name: file.name,
            path: filePath,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
            url: publicUrl
          };
        });

      setUploadedModels([...allFiles, ...rootFiles]);
    } catch (error: any) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      sonnerToast.error('먼저 매장을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await insertSample3DData(user.id, storeId);
      sonnerToast.success(
        `샘플 데이터가 추가되었습니다: ${result.entityTypes}개 타입, ${result.entities}개 엔티티`
      );
      await checkData();
    } catch (error: any) {
      console.error('Insert sample data error:', error);
      
      if (error.message.includes('이미 존재') || error.message.includes('duplicate key')) {
        sonnerToast.info('샘플 데이터가 이미 존재합니다');
        await checkData();
      } else {
        sonnerToast.error(`데이터 추가 실패: ${error.message}`);
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
      sonnerToast.success('샘플 데이터가 삭제되었습니다');
      await checkData();
    } catch (error: any) {
      console.error('Delete sample data error:', error);
      sonnerToast.error(`데이터 삭제 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (filePath: string, fileName: string) => {
    if (!confirm(`"${fileName}" 모델을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase.storage
        .from('3d-models')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "모델 삭제 완료",
        description: `${fileName}이 삭제되었습니다`,
      });

      loadModels();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
            3D 모델 관리
          </TabsTrigger>
          <TabsTrigger value="sample">
            <Database className="w-4 h-4 mr-2" />
            샘플 데이터
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
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
              <CardTitle>업로드된 3D 모델</CardTitle>
              <CardDescription>
                {storeId ? '현재 매장의 3D 모델들' : '매장을 선택하면 모델 목록을 확인할 수 있습니다'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!storeId ? (
                <Alert>
                  <AlertDescription>
                    사이드바에서 매장을 먼저 선택하세요
                  </AlertDescription>
                </Alert>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : uploadedModels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  업로드된 3D 모델이 없습니다
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>파일명</TableHead>
                      <TableHead>크기</TableHead>
                      <TableHead>업로드 일시</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedModels.map((model) => (
                      <TableRow key={model.path}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Box className="w-4 h-4 text-primary" />
                            {model.name}
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(model.size)}</TableCell>
                        <TableCell>
                          {new Date(model.created_at).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(model.url, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteModel(model.path, model.name)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <li>3D 좌표 및 회전 정보</li>
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
