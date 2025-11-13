import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Loader2, Sparkles, AlertTriangle, CheckCircle, Plus, RefreshCw } from "lucide-react";
import { insertComprehensiveSchema } from "../utils/comprehensiveRetailSchema";

type SchemaMode = 'merge' | 'replace';

export const RetailSchemaPreset = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [schemaMode, setSchemaMode] = useState<SchemaMode>('merge');

  // 현재 스키마를 버전으로 백업
  const backupCurrentSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      // 현재 엔티티 타입 가져오기
      const { data: entities, error: entError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', userId);

      if (entError) throw entError;

      // 현재 관계 타입 가져오기
      const { data: relations, error: relError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .eq('user_id', userId);

      if (relError) throw relError;

      // 스키마가 비어있으면 백업 불필요
      if (!entities || entities.length === 0) {
        return null;
      }

      // 가장 높은 버전 번호 가져오기
      const { data: versions, error: versionError } = await supabase
        .from('ontology_schema_versions')
        .select('version_number')
        .eq('user_id', userId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (versionError) throw versionError;

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      // 현재 스키마를 버전으로 저장
      const { error: saveError } = await supabase
        .from('ontology_schema_versions')
        .insert({
          user_id: userId,
          version_number: nextVersion,
          description: `프리셋 적용 전 자동 백업 (${new Date().toLocaleString('ko-KR')})`,
          schema_data: {
            entities: entities.map(e => ({
              name: e.name,
              label: e.label,
              description: e.description,
              color: e.color,
              icon: e.icon,
              properties: e.properties
            })),
            relations: relations?.map(r => ({
              name: r.name,
              label: r.label,
              description: r.description,
              source_entity_type: r.source_entity_type,
              target_entity_type: r.target_entity_type,
              directionality: r.directionality,
              properties: r.properties
            })) || []
          }
        });

      if (saveError) throw saveError;

      return nextVersion;
    },
  });

  // 기존 스키마 삭제
  const clearSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      // 관계 타입 먼저 삭제
      const { error: relError } = await supabase
        .from('ontology_relation_types')
        .delete()
        .eq('user_id', userId);

      if (relError) throw relError;

      // 엔티티 타입 삭제
      const { error: entError } = await supabase
        .from('ontology_entity_types')
        .delete()
        .eq('user_id', userId);

      if (entError) throw entError;
    },
  });

  // 정교한 디지털 트윈 스키마 생성
  const createRetailSchemaMutation = useMutation({
    mutationFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("로그인이 필요합니다");

      let backupVersion = null;

      // 프리셋으로 초기화 모드인 경우 먼저 백업 후 삭제
      if (schemaMode === 'replace') {
        // 1. 현재 스키마를 버전으로 백업
        backupVersion = await backupCurrentSchemaMutation.mutateAsync();
        
        // 2. 기존 스키마 삭제
        await clearSchemaMutation.mutateAsync();
      }
      
      // 정교한 디지털 트윈 스키마 적용
      const result = await insertComprehensiveSchema(userId);
      
      return { backupVersion, ...result };
    },
    onSuccess: ({ backupVersion, entityTypesCount, relationTypesCount }) => {
      queryClient.invalidateQueries({ queryKey: ['entity-types'] });
      queryClient.invalidateQueries({ queryKey: ['relation-types'] });
      queryClient.invalidateQueries({ queryKey: ['schema-versions'] });
      
      const message = schemaMode === 'merge' 
        ? "기존 스키마에 정교한 디지털 트윈 스키마가 추가되었습니다."
        : "이전 스키마는 버전으로 안전하게 백업되었습니다. '스키마 불러오기'에서 복원할 수 있습니다.";
      
      toast({
        title: "정교한 디지털 트윈 스키마 적용 완료",
        description: `${entityTypesCount}개 엔티티 타입과 ${relationTypesCount}개 관계 타입이 추가되었습니다. ${message}`,
      });
    },
    onError: (error: any) => {
      console.error("스키마 생성 오류:", error);
      toast({
        title: "스키마 생성 실패",
        description: error.message || "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const isLoading = createRetailSchemaMutation.isPending || clearSchemaMutation.isPending || backupCurrentSchemaMutation.isPending;

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              정교한 디지털 트윈 스키마
              <Badge variant="default" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Ultimate
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1.5">
              오프라인 매장의 모든 구성요소를 포함한 완벽한 디지털 트윈 온톨로지
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">공간 구조</span>
            </div>
            <p className="text-xs text-muted-foreground pl-4">
              Zone, Shelf, DisplayTable, Rack, Wall, Entrance, CheckoutCounter, Aisle, FittingRoom, StorageRoom, Window (11개)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">IoT & 디지털 장비</span>
            </div>
            <p className="text-xs text-muted-foreground pl-4">
              Sensor, Camera, Beacon, WiFiProbe, DigitalSignage, POS, Kiosk, SmartMirror (9개)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">환경 시스템</span>
            </div>
            <p className="text-xs text-muted-foreground pl-4">
              Lighting, HVAC, AudioSystem, MusicPlaylist, ScentDiffuser (5개)
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">상품 & 인력</span>
            </div>
            <p className="text-xs text-muted-foreground pl-4">
              ProductPlacement, Display, StaffZone, CustomerJourney (4개)
            </p>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">스키마 적용 방식 선택</p>
              <div className="text-sm space-y-1">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span><strong>병합 모드:</strong> 기존 스키마를 유지하면서 새로운 엔티티와 관계를 추가합니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                  <span><strong>교체 모드:</strong> 현재 스키마를 자동 백업한 후 새로운 스키마로 전환합니다.</span>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <RadioGroup value={schemaMode} onValueChange={(value) => setSchemaMode(value as SchemaMode)} className="space-y-3">
          <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-primary/20 bg-card hover:border-primary/40 transition-colors">
            <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="merge" className="text-base font-medium cursor-pointer flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                기존 스키마에 추가 (병합)
              </Label>
              <p className="text-sm text-muted-foreground">
                현재 작업 중인 스키마를 유지하고 정교한 디지털 트윈 엔티티와 관계를 추가합니다.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary/40 transition-colors">
            <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="replace" className="text-base font-medium cursor-pointer flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                새로 시작 (자동 백업)
              </Label>
              <p className="text-sm text-muted-foreground">
                현재 스키마를 버전으로 자동 백업한 후 정교한 디지털 트윈 스키마로 전환합니다.
              </p>
              {schemaMode === 'replace' && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded bg-primary/10 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">현재 스키마는 자동으로 백업되어 안전합니다</span>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>

        <Button
          className="w-full"
          size="lg"
          onClick={() => createRetailSchemaMutation.mutate()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {backupCurrentSchemaMutation.isPending ? '스키마 백업 중...' : 
               schemaMode === 'replace' ? '스키마 생성 중...' : '추가 중...'}
            </>
          ) : (
            <>
              {schemaMode === 'replace' ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  백업 후 스키마로 전환
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  정교한 디지털 트윈 스키마 추가
                </>
              )}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
