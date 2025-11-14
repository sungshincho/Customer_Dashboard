import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EntityTypeManager } from "@/features/data-management/ontology/components/EntityTypeManager";
import { RelationTypeManager } from "@/features/data-management/ontology/components/RelationTypeManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface OntologyDataManagementProps {
  storeId?: string;
}

export function OntologyDataManagement({ storeId }: OntologyDataManagementProps) {
  const [entityTypeCount, setEntityTypeCount] = useState(0);
  const [entityCount, setEntityCount] = useState(0);
  const [relationTypeCount, setRelationTypeCount] = useState(0);
  const [relationCount, setRelationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [storeId]);

  const loadStatistics = async () => {
    try {
      // Entity Types
      const { count: etCount } = await supabase
        .from('ontology_entity_types')
        .select('id', { count: 'exact', head: true });
      
      setEntityTypeCount(etCount || 0);

      // Entities
      let entityQuery = supabase
        .from('graph_entities')
        .select('id', { count: 'exact', head: true });
      
      if (storeId) entityQuery = entityQuery.eq('store_id', storeId);
      const { count: eCount } = await entityQuery;
      setEntityCount(eCount || 0);

      // Relation Types
      const { count: rtCount } = await supabase
        .from('ontology_relation_types')
        .select('id', { count: 'exact', head: true });
      
      setRelationTypeCount(rtCount || 0);

      // Relations
      let relationQuery = supabase
        .from('graph_relations')
        .select('id', { count: 'exact', head: true });
      
      if (storeId) relationQuery = relationQuery.eq('store_id', storeId);
      const { count: rCount } = await relationQuery;
      setRelationCount(rCount || 0);

    } catch (error) {
      console.error('Failed to load ontology statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : entityTypeCount}
            </div>
            <p className="text-xs text-muted-foreground">정의된 타입 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : entityCount}
            </div>
            <p className="text-xs text-muted-foreground">생성된 엔티티</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relation Types</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : relationTypeCount}
            </div>
            <p className="text-xs text-muted-foreground">정의된 관계 타입</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relations</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : relationCount}
            </div>
            <p className="text-xs text-muted-foreground">생성된 관계</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>온톨로지 스키마 관리</CardTitle>
          <CardDescription>
            Entity Type과 Relation Type을 정의하여 지식 그래프를 구축하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entity-types" className="space-y-4">
            <TabsList>
              <TabsTrigger value="entity-types">Entity Types</TabsTrigger>
              <TabsTrigger value="relation-types">Relation Types</TabsTrigger>
              <TabsTrigger value="guide">사용 가이드</TabsTrigger>
            </TabsList>

            <TabsContent value="entity-types">
              <EntityTypeManager />
            </TabsContent>

            <TabsContent value="relation-types">
              <RelationTypeManager />
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  온톨로지는 매장의 모든 구성 요소와 관계를 정의하는 스키마입니다
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">1</Badge>
                    Entity Type 정의
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    매장의 구성 요소 타입을 정의합니다 (예: StoreSpace, Shelf, Product)
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>3D 모델 타입 선택 (GLTF 또는 Primitive)</li>
                    <li>속성(Properties) 정의 (이름, 타입, 필수 여부)</li>
                    <li>3D 시각화용 크기 설정</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">2</Badge>
                    Relation Type 정의
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    Entity 간의 관계 타입을 정의합니다 (예: contains, purchased_by)
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>Source와 Target Entity Type 지정</li>
                    <li>방향성 설정 (directed/undirected)</li>
                    <li>관계 속성 정의</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">3</Badge>
                    Entity 생성
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    정의된 타입을 기반으로 실제 인스턴스를 생성합니다
                  </p>
                  <ul className="text-sm text-muted-foreground ml-12 mt-2 space-y-1 list-disc">
                    <li>3D 좌표 설정 (x, y, z)</li>
                    <li>회전 및 스케일 조정</li>
                    <li>속성 값 입력</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Badge variant="outline" className="mr-2">4</Badge>
                    시각화
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    "디지털 트윈 3D" 페이지에서 생성된 온톨로지를 3D로 시각화합니다
                  </p>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    <strong>💡 Tip:</strong> "3D 모델" 탭에서 샘플 데이터를 생성하면 
                    기본적인 온톨로지 구조를 바로 체험할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
