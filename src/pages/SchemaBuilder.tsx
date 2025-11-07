import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityTypeManager } from "@/components/schema/EntityTypeManager";
import { RelationTypeManager } from "@/components/schema/RelationTypeManager";
import { SchemaVersionManager } from "@/components/schema/SchemaVersionManager";
import { Badge } from "@/components/ui/badge";
import { Layers, Link2, History } from "lucide-react";

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
            <Tabs defaultValue="entities" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entities" className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  엔티티 타입
                </TabsTrigger>
                <TabsTrigger value="relations" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  관계 타입
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  버전 관리
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entities" className="space-y-4 mt-6">
                <EntityTypeManager />
              </TabsContent>

              <TabsContent value="relations" className="space-y-4 mt-6">
                <RelationTypeManager />
              </TabsContent>

              <TabsContent value="versions" className="space-y-4 mt-6">
                <SchemaVersionManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchemaBuilder;
