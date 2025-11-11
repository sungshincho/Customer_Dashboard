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
import { Layers, Link2, History, ShieldCheck, Network } from "lucide-react";

const SchemaBuilder = () => {
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
