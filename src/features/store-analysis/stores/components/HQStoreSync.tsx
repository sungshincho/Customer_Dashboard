import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Store, 
  AlertCircle,
  ArrowRight,
  Link2
} from "lucide-react";
import { useHQStoreMaster, useStoreMappings, useHQSyncLogs, useSyncHQStores, useMapStore } from "@/hooks/useHQSync";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const HQStoreSync = () => {
  const { user } = useAuth();
  const [selectedHQStore, setSelectedHQStore] = useState<string>("");
  const [selectedLocalStore, setSelectedLocalStore] = useState<string>("");

  const { data: hqStores = [], isLoading: hqLoading } = useHQStoreMaster();
  const { data: mappings = [], isLoading: mappingsLoading } = useStoreMappings();
  const { data: syncLogs = [], isLoading: logsLoading } = useHQSyncLogs(5);
  const syncHQStores = useSyncHQStores();
  const mapStore = useMapStore();

  // 로컬 매장 목록 가져오기
  const { data: localStores = [] } = useQuery({
    queryKey: ['stores', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('store_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSync = () => {
    syncHQStores.mutate({ external_system_id: 'demo' });
  };

  const handleMapStores = () => {
    if (!selectedHQStore || !selectedLocalStore) {
      return;
    }
    mapStore.mutate({
      hq_store_id: selectedHQStore,
      local_store_id: selectedLocalStore,
      sync_enabled: true,
    });
    setSelectedHQStore("");
    setSelectedLocalStore("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            진행중
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/50">
            <CheckCircle2 className="w-3 h-3" />
            완료
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            실패
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const unmappedHQStores = hqStores.filter(
    hq => !mappings.some((m: any) => m.hq_store_id === hq.id)
  );

  const unmappedLocalStores = localStores.filter(
    local => !mappings.some((m: any) => m.local_store_id === local.id)
  );

  return (
    <div className="space-y-6">
      {/* 동기화 상태 요약 */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">HQ 매장</p>
                <p className="text-2xl font-bold">{hqStores.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">로컬 매장</p>
                <p className="text-2xl font-bold">{localStores.length}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">매핑됨</p>
                <p className="text-2xl font-bold">{mappings.length}</p>
              </div>
              <Link2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">미매핑</p>
                <p className="text-2xl font-bold">{unmappedHQStores.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* HQ 동기화 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>본사 매장 마스터</CardTitle>
                <CardDescription>외부 시스템에서 매장 정보 동기화</CardDescription>
              </div>
              <Button 
                onClick={handleSync} 
                disabled={syncHQStores.isPending}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncHQStores.isPending ? 'animate-spin' : ''}`} />
                동기화
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {hqStores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">{store.hq_store_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.hq_store_code} • {store.region} {store.district}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {store.store_format || '표준'}
                  </Badge>
                </div>
              ))}
              {hqStores.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>HQ 매장이 없습니다</p>
                  <p className="text-sm">동기화 버튼을 눌러 데이터를 가져오세요</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 매장 매핑 */}
        <Card>
          <CardHeader>
            <CardTitle>매장 매핑</CardTitle>
            <CardDescription>HQ 매장과 로컬 매장 연결</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={selectedHQStore} onValueChange={setSelectedHQStore}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="HQ 매장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedHQStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.hq_store_name} ({store.hq_store_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ArrowRight className="w-4 h-4 text-muted-foreground" />

                <Select value={selectedLocalStore} onValueChange={setSelectedLocalStore}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="로컬 매장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedLocalStores.map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name} ({store.store_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleMapStores} 
                disabled={!selectedHQStore || !selectedLocalStore || mapStore.isPending}
                className="w-full"
              >
                <Link2 className="w-4 h-4 mr-2" />
                매장 연결
              </Button>

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">매핑된 매장</p>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {mappings.map((mapping: any) => (
                    <div
                      key={mapping.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-card text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-primary" />
                        <span className="font-medium">{mapping.hq_store_master.hq_store_name}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <Store className="w-3 h-3 text-blue-500" />
                        <span>{mapping.stores.store_name}</span>
                      </div>
                    </div>
                  ))}
                  {mappings.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      매핑된 매장이 없습니다
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 동기화 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>동기화 이력</CardTitle>
          <CardDescription>최근 동기화 작업 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  {getStatusBadge(log.status)}
                  <div>
                    <p className="font-medium">{log.sync_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.started_at), 'PPp', { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {log.records_synced}/{log.records_processed}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.records_failed > 0 && `${log.records_failed}건 실패`}
                  </p>
                </div>
              </div>
            ))}
            {syncLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>동기화 이력이 없습니다</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
