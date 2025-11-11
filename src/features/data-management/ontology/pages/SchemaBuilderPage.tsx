import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityTypeManager } from "@/features/data-management/ontology/components/EntityTypeManager";
import { RelationTypeManager } from "@/features/data-management/ontology/components/RelationTypeManager";
import { SchemaVersionManager } from "@/features/data-management/ontology/components/SchemaVersionManager";
import { SchemaValidator } from "@/features/data-management/ontology/components/SchemaValidator";
import { SchemaGraphVisualization } from "@/features/data-management/ontology/components/SchemaGraphVisualization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Layers, Link2, History, ShieldCheck, Network, Download, Loader2 } from "lucide-react";

const SchemaBuilder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  // 저장된 스키마 버전 목록 가져오기
  const { data: schemaVersions, isLoading: versionsLoading } = useQuery({
    queryKey: ["schema-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_schema_versions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 선택한 스키마 버전 불러오기
  const loadSchemaMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { data: version, error } = await supabase
        .from("ontology_schema_versions")
        .select("*")
        .eq("id", versionId)
        .single();

      if (error) throw error;

      const schemaData = version.schema_data as any;
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // 엔티티 타입 생성
      if (schemaData.entities && schemaData.entities.length > 0) {
        const { error: entityError } = await supabase
          .from("ontology_entity_types")
          .insert(
            schemaData.entities.map((entity: any) => ({
              ...entity,
              user_id: userId,
              id: undefined, // 새 ID 생성
            }))
          );

        if (entityError) throw entityError;
      }

      // 관계 타입 생성
      if (schemaData.relations && schemaData.relations.length > 0) {
        const { error: relationError } = await supabase
          .from("ontology_relation_types")
          .insert(
            schemaData.relations.map((relation: any) => ({
              ...relation,
              user_id: userId,
              id: undefined, // 새 ID 생성
            }))
          );

        if (relationError) throw relationError;
      }

      return version;
    },
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      queryClient.invalidateQueries({ queryKey: ["relation-types"] });
      setSelectedVersion("");
      toast({
        title: "스키마 불러오기 완료",
        description: `버전 ${version.version_number} 스키마가 적용되었습니다.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "스키마 불러오기 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">온톨로지 스키마 빌더</h1>
          <p className="text-muted-foreground">
            리테일 비즈니스 도메인의 엔티티와 관계를 정의하고 관리합니다
          </p>
        </div>

        {/* 검증 결과 */}
        <SchemaValidator />

        {/* 스키마 불러오기 UI */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>저장된 스키마 불러오기</CardTitle>
            <CardDescription>
              이전에 저장한 스키마 버전을 선택하여 현재 작업 공간에 불러옵니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">스키마 버전 선택</label>
                <Select
                  value={selectedVersion}
                  onValueChange={setSelectedVersion}
                  disabled={versionsLoading || !schemaVersions || schemaVersions.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      versionsLoading
                        ? "로딩 중..."
                        : !schemaVersions || schemaVersions.length === 0
                        ? "저장된 스키마가 없습니다"
                        : "스키마 버전 선택"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {schemaVersions?.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">v{version.version_number}</Badge>
                          <span>{version.description || "설명 없음"}</span>
                          <span className="text-xs text-muted-foreground">
                            ({new Date(version.created_at).toLocaleDateString()})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => selectedVersion && loadSchemaMutation.mutate(selectedVersion)}
                disabled={!selectedVersion || loadSchemaMutation.isPending}
              >
                {loadSchemaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    불러오는 중...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    스키마 불러오기
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>스키마 설계 도구</CardTitle>
                <CardDescription>
                  매장, 상품, 고객, 거래 등 비즈니스 개체와 관계를 시각적으로 모델링
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                리테일 전문
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="graph" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="graph" className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  그래프 뷰
                </TabsTrigger>
                <TabsTrigger value="entities" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  엔티티
                </TabsTrigger>
                <TabsTrigger value="relations" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  관계
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  버전
                </TabsTrigger>
                <TabsTrigger value="validation" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  검증
                </TabsTrigger>
              </TabsList>

              <TabsContent value="graph" className="space-y-4 mt-6">
                <SchemaGraphVisualization />
              </TabsContent>

              <TabsContent value="entities" className="space-y-4 mt-6">
                <EntityTypeManager />
              </TabsContent>

              <TabsContent value="relations" className="space-y-4 mt-6">
                <RelationTypeManager />
              </TabsContent>

              <TabsContent value="versions" className="space-y-4 mt-6">
                <SchemaVersionManager />
              </TabsContent>

              <TabsContent value="validation" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">스키마 검증</h3>
                    <p className="text-sm text-muted-foreground">
                      온톨로지의 무결성을 자동으로 검사하고 문제를 발견합니다
                    </p>
                  </div>
                  <SchemaValidator />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchemaBuilder;
