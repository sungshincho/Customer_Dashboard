import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OntologyGraph3D } from "@/features/data-management/ontology/components/OntologyGraph3D";
import { Badge } from "@/components/ui/badge";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

const SchemaBuilder = () => {
  const { logActivity } = useActivityLogger();
  const location = useLocation();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Schema Viewer',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">온톨로지 스키마 뷰어</h1>
          <p className="text-muted-foreground">
            리테일 비즈니스 도메인의 엔티티와 관계를 3D 그래프로 시각화합니다
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>온톨로지 스키마 v3.0</CardTitle>
                <CardDescription>
                  62개 엔티티와 99개 관계로 구성된 리테일 비즈니스 도메인 모델
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10">
                리테일 전문
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[800px] bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 p-4">
              <OntologyGraph3D />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchemaBuilder;
