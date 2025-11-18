import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, Link2, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IntegratedImportStatusProps {
  storeId?: string;
}

interface IntegrationStats {
  totalImports: number;
  importsWithEntities: number;
  orphanedImports: number; // 엔티티 없는 임포트
  orphanedEntities: number; // 임포트 없는 엔티티
  models3D: number;
  modelsLinkedToTypes: number;
  orphanedModels: number; // 엔티티 타입에 연결 안된 모델
}

export function IntegratedImportStatus({ storeId }: IntegratedImportStatusProps) {
  const [stats, setStats] = useState<IntegrationStats>({
    totalImports: 0,
    importsWithEntities: 0,
    orphanedImports: 0,
    orphanedEntities: 0,
    models3D: 0,
    modelsLinkedToTypes: 0,
    orphanedModels: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationStats();
  }, [storeId]);

  const loadIntegrationStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 전체 임포트 수
      let importQuery = supabase
        .from('user_data_imports')
        .select('id, file_path', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (storeId) importQuery = importQuery.eq('store_id', storeId);
      
      const { count: totalImports, data: imports } = await importQuery;

      // 2. 엔티티가 있는 임포트 수 (source_import_id로 연결)
      let entityQuery = supabase
        .from('graph_entities')
        .select('properties', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (storeId) entityQuery = entityQuery.eq('store_id', storeId);
      
      const { data: entities } = await entityQuery;

      // source_import_id가 있는 엔티티만
      const entitiesWithImport = entities?.filter(e => 
        (e.properties as any)?.source_import_id
      ) || [];

      // 고유한 import_id들
      const uniqueImportIds = new Set(
        entitiesWithImport.map(e => (e.properties as any).source_import_id)
      );

      const importsWithEntities = uniqueImportIds.size;
      const orphanedImports = (totalImports || 0) - importsWithEntities;

      // 3. 임포트 없는 엔티티 (수동 생성)
      const orphanedEntities = (entities?.length || 0) - entitiesWithImport.length;

      // 4. 3D 모델 통계
      const { count: models3D } = await supabase
        .from('user_data_imports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('data_type', '3d_model');

      // 5. 엔티티 타입에 연결된 3D 모델
      const { data: entityTypes } = await supabase
        .from('ontology_entity_types')
        .select('model_3d_url')
        .eq('user_id', user.id)
        .not('model_3d_url', 'is', null);

      const modelsLinkedToTypes = entityTypes?.length || 0;
      const orphanedModels = (models3D || 0) - modelsLinkedToTypes;

      setStats({
        totalImports: totalImports || 0,
        importsWithEntities,
        orphanedImports,
        orphanedEntities,
        models3D: models3D || 0,
        modelsLinkedToTypes,
        orphanedModels
      });

    } catch (error) {
      console.error('Error loading integration stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const integrationHealth = stats.totalImports > 0 
    ? ((stats.importsWithEntities / stats.totalImports) * 100).toFixed(0)
    : '0';

  const hasIssues = stats.orphanedImports > 0 || stats.orphanedModels > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          데이터 통합 상태
        </CardTitle>
        <CardDescription>
          스토리지와 온톨로지 데이터베이스 연동 현황
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 통합 건강도 */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">통합 연동률</span>
            <span className={`text-2xl font-bold ${hasIssues ? 'text-orange-500' : 'text-green-500'}`}>
              {integrationHealth}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${hasIssues ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${integrationHealth}%` }}
            />
          </div>
        </div>

        {/* CSV 임포트 상태 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" />
            CSV 임포트
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-muted-foreground">전체</div>
              <div className="text-lg font-bold">{stats.totalImports}</div>
            </div>
            <div className="p-2 bg-green-500/10 rounded">
              <div className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                연동됨
              </div>
              <div className="text-lg font-bold text-green-600">{stats.importsWithEntities}</div>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <div className="text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                미연동
              </div>
              <div className="text-lg font-bold text-orange-600">{stats.orphanedImports}</div>
            </div>
          </div>
        </div>

        {/* 3D 모델 상태 */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4" />
            3D 모델
          </h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-muted-foreground">전체</div>
              <div className="text-lg font-bold">{stats.models3D}</div>
            </div>
            <div className="p-2 bg-green-500/10 rounded">
              <div className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                연결됨
              </div>
              <div className="text-lg font-bold text-green-600">{stats.modelsLinkedToTypes}</div>
            </div>
            <div className="p-2 bg-orange-500/10 rounded">
              <div className="text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                미연결
              </div>
              <div className="text-lg font-bold text-orange-600">{stats.orphanedModels}</div>
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        {hasIssues && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {stats.orphanedImports > 0 && (
                <div>• {stats.orphanedImports}개의 CSV 파일이 온톨로지 엔티티로 변환되지 않았습니다.</div>
              )}
              {stats.orphanedModels > 0 && (
                <div>• {stats.orphanedModels}개의 3D 모델이 엔티티 타입에 연결되지 않았습니다.</div>
              )}
              {stats.orphanedEntities > 0 && (
                <div>• {stats.orphanedEntities}개의 엔티티가 수동으로 생성되었습니다.</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !hasIssues && stats.totalImports > 0 && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              모든 데이터가 온톨로지 시스템과 완벽하게 연동되었습니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
