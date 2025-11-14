import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileSpreadsheet, Box, Wifi, Network, Database } from "lucide-react";

interface DataStatisticsProps {
  storeId?: string;
}

interface Statistics {
  csvImports: number;
  models3D: number;
  wifiZones: number;
  wifiTracking: number;
  entityTypes: number;
  entities: number;
}

export function DataStatistics({ storeId }: DataStatisticsProps) {
  const [stats, setStats] = useState<Statistics>({
    csvImports: 0,
    models3D: 0,
    wifiZones: 0,
    wifiTracking: 0,
    entityTypes: 0,
    entities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [storeId]);

  const loadStatistics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CSV 임포트 수
      let csvQuery = supabase
        .from('user_data_imports')
        .select('id', { count: 'exact', head: true });
      
      if (storeId) csvQuery = csvQuery.eq('store_id', storeId);
      const { count: csvCount } = await csvQuery;

      // 3D 모델 수 (스토리지에서)
      const { data: modelFiles } = await supabase.storage
        .from('3d-models')
        .list(storeId ? `${user.id}/${storeId}` : user.id);

      // WiFi 존 수
      let zoneQuery = supabase
        .from('wifi_zones' as any)
        .select('id', { count: 'exact', head: true });
      
      if (storeId) zoneQuery = zoneQuery.eq('store_id', storeId);
      const { count: zoneCount } = await zoneQuery;

      // WiFi 트래킹 포인트 수
      let trackingQuery = supabase
        .from('wifi_tracking' as any)
        .select('id', { count: 'exact', head: true });
      
      if (storeId) trackingQuery = trackingQuery.eq('store_id', storeId);
      const { count: trackingCount } = await trackingQuery;

      // Entity Types 수
      const { count: entityTypeCount } = await supabase
        .from('ontology_entity_types')
        .select('id', { count: 'exact', head: true });

      // Entities 수
      let entityQuery = supabase
        .from('graph_entities')
        .select('id', { count: 'exact', head: true });
      
      if (storeId) entityQuery = entityQuery.eq('store_id', storeId);
      const { count: entityCount } = await entityQuery;

      setStats({
        csvImports: csvCount || 0,
        models3D: modelFiles?.length || 0,
        wifiZones: zoneCount || 0,
        wifiTracking: trackingCount || 0,
        entityTypes: entityTypeCount || 0,
        entities: entityCount || 0
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "CSV 데이터",
      value: stats.csvImports,
      icon: FileSpreadsheet,
      description: "임포트된 파일 수"
    },
    {
      title: "3D 모델",
      value: stats.models3D,
      icon: Box,
      description: "업로드된 모델 수"
    },
    {
      title: "WiFi 존",
      value: stats.wifiZones,
      icon: Wifi,
      description: "설정된 센서 수"
    },
    {
      title: "트래킹 포인트",
      value: stats.wifiTracking,
      icon: Database,
      description: "수집된 위치 데이터"
    },
    {
      title: "Entity Types",
      value: stats.entityTypes,
      icon: Network,
      description: "정의된 타입 수"
    },
    {
      title: "Graph Entities",
      value: stats.entities,
      icon: Network,
      description: "생성된 엔티티 수"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
