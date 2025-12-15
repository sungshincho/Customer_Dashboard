import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Database, User, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export const MasterSchemaSync = () => {
  const { user } = useAuth();

  // 마스터 스키마 정보 조회 (org_id IS NULL AND user_id IS NULL)
  const { data: masterSchema, isLoading: masterLoading } = useQuery({
    queryKey: ['master-schema-info'],
    queryFn: async () => {
      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .is('org_id', null)
          .is('user_id', null),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .is('org_id', null)
          .is('user_id', null)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    }
  });

  // 현재 사용자의 커스텀 스키마 정보 조회 (user_id = 현재 사용자)
  const { data: userSchema, isLoading: userLoading } = useQuery({
    queryKey: ['user-custom-schema-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return { entityCount: 0, relationCount: 0 };

      const [entitiesResult, relationsResult] = await Promise.all([
        supabase
          .from('ontology_entity_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ontology_relation_types')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      return {
        entityCount: entitiesResult.count || 0,
        relationCount: relationsResult.count || 0
      };
    },
    enabled: !!user?.id
  });

  // 총 사용 가능한 스키마 (마스터 + 사용자 커스텀)
  const totalEntityCount = (masterSchema?.entityCount || 0) + (userSchema?.entityCount || 0);
  const totalRelationCount = (masterSchema?.relationCount || 0) + (userSchema?.relationCount || 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              온톨로지 스키마 현황
            </CardTitle>
            <CardDescription>
              마스터 스키마는 모든 사용자가 공유하며, 커스텀 타입을 추가할 수 있습니다
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>자동 적용:</strong> 마스터 스키마(161개 엔티티, 110개 관계)는 모든 사용자에게 자동으로 제공됩니다.
            별도의 동기화 없이 바로 사용할 수 있습니다.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-4">
          {/* 마스터 스키마 */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Layers className="w-4 h-4" />
              마스터 스키마 (v1.0)
            </div>
            <div className="text-2xl font-bold text-primary">
              {masterLoading ? '...' : masterSchema?.entityCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">엔티티</span>
            </div>
            <div className="text-lg font-semibold text-secondary mt-1">
              {masterLoading ? '...' : masterSchema?.relationCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">관계</span>
            </div>
          </div>

          {/* 사용자 커스텀 스키마 */}
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              내 커스텀 타입
            </div>
            <div className="text-2xl font-bold text-primary">
              {userLoading ? '...' : userSchema?.entityCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">엔티티</span>
            </div>
            <div className="text-lg font-semibold text-secondary mt-1">
              {userLoading ? '...' : userSchema?.relationCount || 0}
              <span className="text-sm font-normal text-muted-foreground ml-2">관계</span>
            </div>
          </div>

          {/* 총 사용 가능 */}
          <div className="p-4 rounded-lg border border-primary/50 bg-primary/10">
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <CheckCircle className="w-4 h-4" />
              총 사용 가능
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalEntityCount}
              <span className="text-sm font-normal text-muted-foreground ml-2">엔티티</span>
            </div>
            <div className="text-lg font-semibold text-secondary mt-1">
              {totalRelationCount}
              <span className="text-sm font-normal text-muted-foreground ml-2">관계</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/20 rounded">
          <strong>참고:</strong> 동일한 이름의 타입이 있으면 내 커스텀 타입이 우선 적용됩니다.
          마스터 스키마는 읽기 전용이며, 필요시 커스텀 타입을 추가하여 확장할 수 있습니다.
        </div>
      </CardContent>
    </Card>
  );
};
