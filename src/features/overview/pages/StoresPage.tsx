import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Trash2, Edit, Loader2 } from "lucide-react";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { StoreForm } from "../components/StoreForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";
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
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { stores, loading, refreshStores, selectedStore, setSelectedStore } = useSelectedStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Stores',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  const handleDelete = async (storeId: string) => {
    if (!user) return;

    setDeleting(storeId);
    try {
      const storeToDelete = stores?.find(s => s.id === storeId);
      
      // CASCADE 삭제: store_id를 참조하는 모든 테이블에서 데이터 삭제
      const tablesToClear = [
        'daily_sales',
        'dashboard_kpis',
        'funnel_metrics',
        'daily_kpis_agg',
        'hourly_metrics',
        'zone_daily_metrics',
        'customer_segments_agg',
        'customer_segments',
        'product_performance_agg',
        'line_items',
        'funnel_events',
        'zone_events',
        'visit_zone_events',
        'ai_recommendations',
        'ai_scene_analysis',
        'ai_insights',
        'analysis_history',
        'alerts',
        'purchases',
        'visits',
        'wifi_tracking',
        'wifi_heatmap_cache',
        'wifi_raw_signals',
        'customers',
        'products',
        'inventory_levels',
        'store_scenes',
        'graph_relations',
        'graph_entities',
        'user_data_imports',
      ];

      // 각 테이블에서 store_id 기준으로 삭제
      for (const table of tablesToClear) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq('store_id', storeId);
        
        if (error) {
          console.warn(`Failed to delete from ${table}:`, error.message);
          // 테이블이 없거나 컬럼이 없는 경우 무시하고 계속 진행
        }
      }

      // 마지막으로 매장 삭제
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('매장 및 연관 데이터가 삭제되었습니다');
      
      // Activity logging
      logActivity('feature_use', {
        feature: 'store_delete',
        store_id: storeId,
        store_name: storeToDelete?.store_name,
        timestamp: new Date().toISOString()
      });
      
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
          <StoreForm onSuccess={refreshStores} />
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
                          {store.store_name} 매장과 모든 연관 데이터(매출, KPI, 고객, 상품, 방문 기록 등)가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
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
