import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Network } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchemaGraph3D } from "./SchemaGraph3D";
import { buildRetailOntologyGraphData } from "./buildRetailOntologyGraph";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

type NodeType = "entity" | "property" | "relation" | "other";

interface GraphNode {
  id: string;
  name: string;
  label: string;
  color: string;
  properties: PropertyField[];
  val: number;
  nodeType?: NodeType;
}

interface GraphLink {
  source: string;
  target: string;
  label: string;
  color: string;
  properties: PropertyField[];
  directionality: string;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const SchemaGraphVisualization = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [layoutType, setLayoutType] = useState<"force" | "radial" | "hierarchical">("force");
  const [refreshKey, setRefreshKey] = useState(0);

  // buildRetailOntologyGraph()에서 직접 데이터 로드
  useEffect(() => {
    const data = buildRetailOntologyGraphData();
    setGraphData(data);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleReset = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>3D 스키마 그래프 시각화</CardTitle>
                <CardDescription>
                  온톨로지 구조를 3D 인터랙티브 그래프로 탐색
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={layoutType} onValueChange={(v: any) => setLayoutType(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="force">Force 레이아웃</SelectItem>
                  <SelectItem value="radial">방사형 레이아웃</SelectItem>
                  <SelectItem value="hierarchical">계층형 레이아웃</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleReset} title="레이아웃 리셋">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden" style={{ height: "600px" }}>
            {graphData.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center">
                  <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    엔티티와 관계를 추가하여 3D 그래프를 확인하세요
                  </p>
                </div>
              </div>
            ) : (
              <SchemaGraph3D
                key={refreshKey}
                nodes={graphData.nodes}
                links={graphData.links}
                onNodeClick={handleNodeClick}
                layoutType={layoutType}
              />
            )}
          </div>

          {/* 범례 - Entity 노드만 표시 */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="text-sm text-muted-foreground">범례:</div>
            {graphData.nodes
              .filter(node => node.nodeType === "entity")
              .slice(0, 5)
              .map((node) => (
                <div key={node.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="text-sm">{node.label}</span>
                </div>
              ))}
            {graphData.nodes.filter(n => n.nodeType === "entity").length > 5 && (
              <span className="text-sm text-muted-foreground">
                +{graphData.nodes.filter(n => n.nodeType === "entity").length - 5} more
              </span>
            )}
          </div>

          {/* 통계 */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {graphData.nodes.filter(n => n.nodeType === "entity").length}
                </div>
                <div className="text-xs text-muted-foreground">엔티티</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {graphData.nodes.filter(n => n.nodeType === "relation").length}
                </div>
                <div className="text-xs text-muted-foreground">관계</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {graphData.nodes.filter(n => n.nodeType === "property").length}
                </div>
                <div className="text-xs text-muted-foreground">속성</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{graphData.nodes.length}</div>
                <div className="text-xs text-muted-foreground">총 노드</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 노드 상세 정보 다이얼로그 */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNode?.color || "#3b82f6" }}
              />
              {selectedNode?.label}
            </DialogTitle>
            <DialogDescription>
              엔티티 타입: {selectedNode?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedNode && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">속성 목록</h4>
                {selectedNode.properties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">정의된 속성이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {selectedNode.properties.map((prop) => (
                      <Card key={prop.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{prop.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {prop.name}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              타입: {prop.type}
                            </p>
                          </div>
                          {prop.required && (
                            <Badge variant="destructive" className="text-xs">
                              필수
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* 관련 관계 표시 */}
              <div>
                <h4 className="text-sm font-semibold mb-2">관련 관계</h4>
                <div className="space-y-2">
                  {graphData.links
                    .filter(
                      (link) =>
                        link.source === selectedNode.name ||
                        link.target === selectedNode.name
                    )
                    .map((link, index) => {
                      const isOutgoing = link.source === selectedNode.name;
                      const arrow = link.directionality === 'bidirectional' ? '↔' : '→';
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm p-2 rounded bg-muted"
                        >
                          <Badge variant="outline">
                            {typeof link.source === 'string' ? link.source : link.source}
                          </Badge>
                          <span className="text-primary">{arrow}</span>
                          <div className="flex items-center gap-1">
                            <Badge className="bg-primary/10">{link.label}</Badge>
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{
                                backgroundColor: `hsla(239, 84%, ${70 - link.weight * 20}%, 0.3)`
                              }}
                            >
                              {link.weight.toFixed(1)}
                            </Badge>
                          </div>
                          <span className="text-primary">{arrow}</span>
                          <Badge variant="outline">
                            {typeof link.target === 'string' ? link.target : link.target}
                          </Badge>
                          {isOutgoing && (
                            <Badge variant="destructive" className="text-xs">원인</Badge>
                          )}
                          {!isOutgoing && (
                            <Badge variant="default" className="text-xs">결과</Badge>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
