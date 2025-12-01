import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MASTER_ACCOUNT_ID = 'af316ab2-ffb5-4509-bd37-13aa31feb5ad';

export const MasterSchemaSync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 마스터 계정의 스키마 정보 조회
  const { data: masterSchema } = useQuery({
    queryKey: ['master-schema-info'],
    queryFn: async () => {
      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', MASTER_ACCOUNT_ID),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', MASTER_ACCOUNT_ID)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    }
  });

  // 현재 사용자의 스키마 정보 조회
  const { data: currentSchema } = useQuery({
    queryKey: ['current-schema-info'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return { entityCount: 0, relationCount: 0 };

      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    }
  });

  // 마스터 스키마 불러오기 (덮어쓰기)
  const syncMasterSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const orgId = (await supabase.auth.getUser()).data.user?.user_metadata?.org_id;
      
      if (!userId) throw new Error("로그인이 필요합니다");

      // 1. 현재 사용자의 모든 relation types 삭제 (외래키 제약으로 먼저 삭제)
      const { error: deleteRelError } = await supabase
        .from('ontology_relation_types')
        .delete()
        .eq('user_id', userId);

      if (deleteRelError) throw deleteRelError;

      // 2. 현재 사용자의 모든 entity types 삭제
      const { error: deleteEntError } = await supabase
        .from('ontology_entity_types')
        .delete()
        .eq('user_id', userId);

      if (deleteEntError) throw deleteEntError;

      // 3. 마스터 계정의 모든 entity types 가져오기
      const { data: masterEntities, error: entError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', MASTER_ACCOUNT_ID);

      if (entError) throw entError;

      // 4. 마스터 entity types를 현재 사용자 계정으로 복사
      if (masterEntities && masterEntities.length > 0) {
        const { error: insertEntError } = await supabase
          .from('ontology_entity_types')
          .insert(
            masterEntities.map(e => ({
              user_id: userId,
              org_id: orgId,
              name: e.name,
              label: e.label,
              description: e.description,
              color: e.color,
              icon: e.icon,
              priority: e.priority,
              properties: e.properties,
              model_3d_type: e.model_3d_type,
              model_3d_url: e.model_3d_url,
              model_3d_dimensions: e.model_3d_dimensions,
              model_3d_metadata: e.model_3d_metadata
            }))
          );

        if (insertEntError) throw insertEntError;
      }

      // 5. 마스터 계정의 모든 relation types 가져오기
      const { data: masterRelations, error: relError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .eq('user_id', MASTER_ACCOUNT_ID);

      if (relError) throw relError;

      // 6. 마스터 relation types를 현재 사용자 계정으로 복사
      if (masterRelations && masterRelations.length > 0) {
        const { error: insertRelError } = await supabase
          .from('ontology_relation_types')
          .insert(
            masterRelations.map(r => ({
              user_id: userId,
              org_id: orgId,
              name: r.name,
              label: r.label,
              description: r.description,
              source_entity_type: r.source_entity_type,
              target_entity_type: r.target_entity_type,
              directionality: r.directionality,
              priority: r.priority,
              properties: r.properties
            }))
          );

        if (insertRelError) throw insertRelError;
      }

      return {
        entityCount: masterEntities?.length || 0,
        relationCount: masterRelations?.length || 0
      };
    },
    onSuccess: (result) => {
      toast({
        title: "마스터 스키마 불러오기 완료",
        description: `${result.entityCount}개의 엔티티 타입과 ${result.relationCount}개의 관계 타입이 적용되었습니다.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['ontology-entity-types'] });
      queryClient.invalidateQueries({ queryKey: ['ontology-relation-types'] });
      queryClient.invalidateQueries({ queryKey: ['current-schema-info'] });
    },
    onError: (error) => {
      console.error('마스터 스키마 동기화 오류:', error);
      toast({
        title: "동기화 실패",
        description: error instanceof Error ? error.message : "마스터 스키마를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              마스터 스키마 불러오기
            </CardTitle>
            <CardDescription>
              최신 온톨로지 스키마 v3.0으로 완전히 교체합니다
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>주의:</strong> 현재 계정의 모든 스키마가 삭제되고 마스터 스키마로 완전히 덮어씌워집니다.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="text-sm text-muted-foreground mb-1">마스터 스키마 (v3.0)</div>
            <div className="text-2xl font-bold text-primary">
              {masterSchema?.entityCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">엔티티</span>
            </div>
            <div className="text-2xl font-bold text-secondary mt-2">
              {masterSchema?.relationCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">관계</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="text-sm text-muted-foreground mb-1">현재 내 스키마</div>
            <div className="text-2xl font-bold text-primary">
              {currentSchema?.entityCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">엔티티</span>
            </div>
            <div className="text-2xl font-bold text-secondary mt-2">
              {currentSchema?.relationCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">관계</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => syncMasterSchemaMutation.mutate()}
          disabled={syncMasterSchemaMutation.isPending}
          className="w-full"
          size="lg"
        >
          {syncMasterSchemaMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              스키마 불러오는 중...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              최신 마스터 스키마 불러오기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
