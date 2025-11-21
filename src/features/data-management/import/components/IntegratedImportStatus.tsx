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

      // 1. CSV 임포트 수 (3D 모델 제외)
      let importQuery = supabase
        .from('user_data_imports')
        .select('id, file_path', { count: 'exact' })
        .eq('user_id', user.id)
        .neq('data_type', '3d_model');
      
      if (storeId) importQuery = importQuery.eq('store_id', storeId);
      
      const { count: totalImports, data: imports } = await importQuery;

      // 2. 엔티티가 있는 임포트 수 계산
      // 각 import의 엔티티 개수를 확인
      const importsWithEntitiesSet = new Set<string>();
      
      if (imports && imports.length > 0) {
        for (const imp of imports) {
          const { count } = await supabase
            .from('graph_entities')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('properties->>source_import_id', imp.id);
          
          if (count && count > 0) {
            importsWithEntitiesSet.add(imp.id);
          }
        }
      }

      const importsWithEntities = importsWithEntitiesSet.size;
      const orphanedImports = (totalImports || 0) - importsWithEntities;

      // 3. 임포트 없는 엔티티 (수동 생성)
      let orphanedEntityQuery = supabase
        .from('graph_entities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('properties->>source_import_id', null);
      
      if (storeId) orphanedEntityQuery = orphanedEntityQuery.eq('store_id', storeId);
      
      const { count: orphanedEntities } = await orphanedEntityQuery;

      // 4. 3D 모델 통계 (스토리지에서 직접 카운트)
      const modelPath = storeId ? `${user.id}/${storeId}` : user.id;
      let models3DCount = 0;

      // 3d-models 서브폴더 조회
      const modelSubPath = `${modelPath}/3d-models`;
      const { data: modelSubFiles, error: subError } = await supabase.storage
        .from('3d-models')
        .list(modelSubPath);

      if (modelSubFiles && !subError) {
        models3DCount += modelSubFiles.filter(f => f.id && (f.name.endsWith('.glb') || f.name.endsWith('.gltf'))).length;
      }
      
      // 루트 레벨의 .glb/.gltf 파일들도 확인
      const { data: modelRootFiles } = await supabase.storage
        .from('3d-models')
        .list(modelPath);

      if (modelRootFiles) {
        models3DCount += modelRootFiles.filter(f => 
          f.id && (f.name.endsWith('.glb') || f.name.endsWith('.gltf'))
        ).length;
      }

      // 5. 엔티티 타입에 연결된 3D 모델
      const { data: entityTypes } = await supabase
        .from('ontology_entity_types')
        .select('model_3d_url')
        .eq('user_id', user.id)
        .not('model_3d_url', 'is', null);

      const modelsLinkedToTypes = entityTypes?.length || 0;
      const orphanedModels = models3DCount - modelsLinkedToTypes;

      setStats({
        totalImports: totalImports || 0,
        importsWithEntities,
        orphanedImports,
        orphanedEntities,
        models3D: models3DCount,
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
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* 배경 장식 */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-green-500/10 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80">
            <Link2 className="w-5 h-5 text-primary-foreground" />
          </div>
          데이터 통합 상태
        </CardTitle>
        <CardDescription className="text-sm">
          스토리지와 온톨로지 데이터베이스 연동 현황
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 relative">
        {/* 통합 건강도 */}
        <div className="relative p-5 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
          
          <div className="relative flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground/80">통합 연동률</span>
            <span className={`text-3xl font-bold transition-colors ${
              hasIssues 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500'
            }`}>
              {integrationHealth}%
            </span>
          </div>
          
          <div className="relative w-full bg-muted/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ease-out relative ${
                hasIssues 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${integrationHealth}%` }}
            >
              {/* 진행바 글로우 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* CSV 임포트 상태 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500/20 to-blue-500/10">
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            CSV 임포트
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="group p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-lg hover:shadow-md transition-all duration-300 border border-border/50">
              <div className="text-muted-foreground text-xs mb-1">전체</div>
              <div className="text-2xl font-bold text-foreground group-hover:scale-110 transition-transform">{stats.totalImports}</div>
            </div>
            <div className="group p-3 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 border border-green-500/20">
              <div className="text-muted-foreground flex items-center gap-1 text-xs mb-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                연동됨
              </div>
              <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">{stats.importsWithEntities}</div>
            </div>
            <div className="group p-3 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 border border-orange-500/20">
              <div className="text-muted-foreground flex items-center gap-1 text-xs mb-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                미연동
              </div>
              <div className="text-2xl font-bold text-orange-600 group-hover:scale-110 transition-transform">{stats.orphanedImports}</div>
            </div>
          </div>
        </div>

        {/* 3D 모델 상태 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500/20 to-purple-500/10">
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            3D 모델
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="group p-3 bg-gradient-to-br from-muted/80 to-muted/40 rounded-lg hover:shadow-md transition-all duration-300 border border-border/50">
              <div className="text-muted-foreground text-xs mb-1">전체</div>
              <div className="text-2xl font-bold text-foreground group-hover:scale-110 transition-transform">{stats.models3D}</div>
            </div>
            <div className="group p-3 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-lg hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 border border-green-500/20">
              <div className="text-muted-foreground flex items-center gap-1 text-xs mb-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                연결됨
              </div>
              <div className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform">{stats.modelsLinkedToTypes}</div>
            </div>
            <div className="group p-3 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 border border-orange-500/20">
              <div className="text-muted-foreground flex items-center gap-1 text-xs mb-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                미연결
              </div>
              <div className="text-2xl font-bold text-orange-600 group-hover:scale-110 transition-transform">{stats.orphanedModels}</div>
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        {hasIssues && (
          <Alert className="border-0 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm">
            <div className="p-1.5 rounded-lg bg-orange-500/20">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
            <AlertDescription className="ml-2 space-y-1">
              {stats.orphanedImports > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>{stats.orphanedImports}개의 CSV 파일이 온톨로지 엔티티로 변환되지 않았습니다.</span>
                </div>
              )}
              {stats.orphanedModels > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>{stats.orphanedModels}개의 3D 모델이 엔티티 타입에 연결되지 않았습니다.</span>
                </div>
              )}
              {stats.orphanedEntities > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>{stats.orphanedEntities}개의 엔티티가 수동으로 생성되었습니다.</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !hasIssues && stats.totalImports > 0 && (
          <Alert className="border-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-transparent backdrop-blur-sm">
            <div className="p-1.5 rounded-lg bg-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <AlertDescription className="ml-2 text-green-700 dark:text-green-400 font-medium">
              ✨ 모든 데이터가 온톨로지 시스템과 완벽하게 연동되었습니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
