import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Trash2, Edit, Loader2, Database } from "lucide-react";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { StoreForm } from "../components/StoreForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Stores = () => {
  const { user } = useAuth();
  const { stores, loading, refreshStores, selectedStore, setSelectedStore } = useSelectedStore();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerateAllData = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('인증이 필요합니다');
        return;
      }

      toast.loading('모든 매장의 샘플 데이터를 생성중입니다...', { id: 'generate-data' });

      const response = await supabase.functions.invoke('auto-generate-store-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) throw response.error;

      console.log('Generated data:', response.data);
      toast.success(`${stores.length}개 매장의 샘플 데이터가 생성되었습니다`, { id: 'generate-data' });
      
      // 각 매장별 생성된 데이터 상세 정보 표시
      if (response.data?.results) {
        response.data.results.forEach((result: any) => {
          console.log(`${result.store}: 고객 ${result.stats.customers}명, 상품 ${result.stats.products}개, 구매 ${result.stats.purchases}건`);
        });
      }
    } catch (error) {
      console.error('Generate data error:', error);
      toast.error('데이터 생성에 실패했습니다', { id: 'generate-data' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!user) return;

    setDeleting(storeId);
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('매장이 삭제되었습니다');
      
      // 선택된 매장이 삭제된 경우 선택 해제
      if (selectedStore?.id === storeId) {
        setSelectedStore(null);
      }
      
      await refreshStores();
    } catch (error) {
      console.error('Delete store error:', error);
      toast.error('매장 삭제에 실패했습니다');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text">매장 관리</h1>
            <p className="mt-2 text-muted-foreground">
              전체 매장 현황 및 관리 ({stores.length}개 매장)
            </p>
          </div>
          <div className="flex gap-2">
            {stores.length > 0 && (
              <Button 
                onClick={handleGenerateAllData}
                disabled={generating}
                variant="outline"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    데이터 생성 중...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    샘플 데이터 생성
                  </>
                )}
              </Button>
            )}
            <StoreForm onSuccess={refreshStores} />
          </div>
        </div>

        {/* Empty State */}
        {stores.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                등록된 매장이 없습니다. 첫 매장을 추가해보세요.
              </p>
              <StoreForm onSuccess={refreshStores} />
            </CardContent>
          </Card>
        )}

        {/* Stores Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store, index) => (
            <Card 
              key={store.id} 
              className={`hover-lift animate-fade-in cursor-pointer transition-all ${
                selectedStore?.id === store.id ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedStore(store)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{store.store_name}</CardTitle>
                    <CardDescription className="mt-1">
                      코드: {store.store_code}
                    </CardDescription>
                  </div>
                  {selectedStore?.id === store.id && (
                    <Badge variant="default">선택됨</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info */}
                {store.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {store.address}
                  </p>
                )}

                {(store.phone || store.manager_name) && (
                  <div className="space-y-2 pt-2 border-t">
                    {store.manager_name && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">매니저: </span>
                        <span className="font-medium">{store.manager_name}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <StoreForm
                    store={store}
                    onSuccess={refreshStores}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={deleting === store.id}
                      >
                        {deleting === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>매장을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {store.store_name} 매장을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(store.id)}>
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Stores;
