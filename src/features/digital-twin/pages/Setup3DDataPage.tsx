import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { insertSample3DData, checkSampleDataExists } from "../utils/sampleDataGenerator";
import { toast } from "sonner";
import { Database, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Setup3DDataPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dataExists, setDataExists] = useState(false);

  useEffect(() => {
    checkData();
  }, [user]);

  const checkData = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      const exists = await checkSampleDataExists(user.id);
      setDataExists(exists);
    } catch (error) {
      console.error('Check data error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleInsertData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await insertSample3DData(user.id);
      toast.success(
        `샘플 데이터가 추가되었습니다: ${result.entityTypes}개 타입, ${result.entities}개 엔티티`
      );
      setDataExists(true);
    } catch (error: any) {
      console.error('Insert sample data error:', error);
      toast.error(`데이터 추가 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">3D 샘플 데이터 설정</h1>
          <p className="text-muted-foreground mt-2">
            디지털 트윈 3D 시각화를 위한 온톨로지 샘플 데이터를 추가합니다
          </p>
        </div>

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
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  샘플 데이터가 이미 존재합니다. 레이아웃 시뮬레이터에서 3D 뷰를 생성해보세요!
                </AlertDescription>
              </Alert>
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
              <h3 className="font-semibold mb-3">다음 단계</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>샘플 데이터 추가 버튼 클릭</li>
                <li>레이아웃 시뮬레이터 페이지로 이동</li>
                <li>"3D 뷰" 탭에서 "3D 레이아웃 생성" 클릭</li>
                <li>온톨로지 기반으로 자동 조합된 3D 씬 확인</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
