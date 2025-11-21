import React, { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ForceGraph2D from "react-force-graph-2d";
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface EntityType {
  id: string;
  name: string;
  label: string;
  color: string | null;
  properties: PropertyField[];
}

interface RelationType {
  id: string;
  name: string;
  label: string;
  source_entity_type: string;
  target_entity_type: string;
  directionality: string | null;
  properties: PropertyField[];
  weight?: number;
}

interface GraphNode {
  id: string;
  name: string;
  label: string;
  color: string;
  properties: PropertyField[];
  val: number;
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
  const graphRef = useRef<any>();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [layoutType, setLayoutType] = useState<"force" | "radial" | "hierarchical">("force");

  const { data: entities } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*");

      if (error) throw error;
      return (data || []).map(item => {
        let properties: PropertyField[] = [];
        
        if (typeof item.properties === 'string') {
          try {
            properties = JSON.parse(item.properties);
          } catch (e) {
            console.error('Failed to parse properties:', e);
          }
        } else if (Array.isArray(item.properties)) {
          properties = item.properties as unknown as PropertyField[];
        }
        
        return {
          ...item,
          properties
        };
      }) as EntityType[];
    },
  });

  const { data: relations } = useQuery({
    queryKey: ["relation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_relation_types")
        .select("*");

      if (error) throw error;
      return (data || []).map(item => {
        let properties: PropertyField[] = [];
        
        if (typeof item.properties === 'string') {
          try {
            properties = JSON.parse(item.properties);
          } catch (e) {
            console.error('Failed to parse properties:', e);
          }
        } else if (Array.isArray(item.properties)) {
          properties = item.properties as unknown as PropertyField[];
        }
        
        return {
          ...item,
          properties
        };
      }) as RelationType[];
    },
  });

  useEffect(() => {
    if (!entities || !relations) return;

    // 먼저 노드 생성 (엔티티 이름을 ID로 사용)
    const nodes: GraphNode[] = entities.map(entity => {
      return {
        id: entity.name,
        name: entity.name,
        label: entity.label,
        color: entity.color || "#3b82f6",
        properties: entity.properties,
        val: 20 + (entity.properties.length * 2), // 임시 크기
      };
    });

    // 존재하는 노드 이름 집합
    const existingNodeNames = new Set(nodes.map(n => n.id));

    // links 생성 시 존재하는 노드만 참조하도록 필터링
    const links: GraphLink[] = relations
      .filter(relation => {
        // source와 target이 모두 존재하는 노드인지 확인
        const sourceExists = existingNodeNames.has(relation.source_entity_type);
        const targetExists = existingNodeNames.has(relation.target_entity_type);
        
        if (!sourceExists || !targetExists) {
          console.warn(`⚠️ Skipping relation "${relation.label}": missing node`, {
            source: relation.source_entity_type,
            target: relation.target_entity_type,
            sourceExists,
            targetExists
          });
          return false;
        }
        return true;
      })
      .map(relation => {
        // weight 속성 추출 (properties에서 찾거나 기본값 1.0)
        const weightProp = relation.properties.find(p => p.name === 'weight');
        const weight = relation.weight || (weightProp ? 1.0 : 0.5);
        
        return {
          source: relation.source_entity_type,
          target: relation.target_entity_type,
          label: relation.label,
          color: "#6366f1",
          properties: relation.properties,
          directionality: relation.directionality || "directed",
          weight,
        };
      });

    // 노드별 연결된 관계의 총 weight 계산 (중심성)
    const nodeWeights = new Map<string, number>();
    links.forEach(link => {
      nodeWeights.set(
        link.source,
        (nodeWeights.get(link.source) || 0) + link.weight
      );
      nodeWeights.set(
        link.target,
        (nodeWeights.get(link.target) || 0) + link.weight
      );
    });

    // 노드 크기 재계산 (연결 가중치 반영)
    nodes.forEach(node => {
      const connectionWeight = nodeWeights.get(node.id) || 0;
      const baseSize = 20 + (node.properties.length * 2);
      const sizeBonus = connectionWeight * 3;
      node.val = Math.min(baseSize + sizeBonus, 60); // 최대 크기 제한
    });

    setGraphData({ nodes, links });
  }, [entities, relations]);

  useEffect(() => {
    if (!graphRef.current || graphData.nodes.length === 0) return;

    // 레이아웃 타입에 따라 다른 force 설정
    const fg = graphRef.current;

    if (layoutType === "radial") {
      // 방사형 레이아웃
      const centerNode = graphData.nodes[0];
      graphData.nodes.forEach((node, i) => {
        const angle = (i / graphData.nodes.length) * 2 * Math.PI;
        const radius = 200;
        fg.d3Force('x').x(radius * Math.cos(angle));
        fg.d3Force('y').y(radius * Math.sin(angle));
      });
    } else if (layoutType === "hierarchical") {
      // 계층형 레이아웃
      fg.d3Force('x').strength(0.2);
      fg.d3Force('y').strength(0.8);
    } else {
      // 기본 force 레이아웃
      fg.d3Force('charge').strength(-300);
      fg.d3Force('link').distance(100);
    }
  }, [layoutType, graphData]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.2, 300);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 0.8, 300);
    }
  };

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>스키마 그래프 시각화</CardTitle>
              <CardDescription>
                온톨로지 구조를 인터랙티브 그래프로 탐색
              </CardDescription>
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
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleFitView}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background overflow-hidden" style={{ height: "600px" }}>
            {graphData.nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    엔티티와 관계를 추가하여 그래프를 확인하세요
                  </p>
                </div>
              </div>
            ) : (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="label"
                nodeColor="color"
                nodeVal="val"
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.label;
                  const fontSize = 12 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                  // 노드 그리기
                  ctx.fillStyle = node.color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
                  ctx.fill();

                  // 테두리
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2 / globalScale;
                  ctx.stroke();

                  // 라벨 배경
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2,
                    node.y + node.val / 2 + 2,
                    bckgDimensions[0],
                    bckgDimensions[1]
                  );

                  // 라벨 텍스트
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#000';
                  ctx.fillText(label, node.x, node.y + node.val / 2 + 2 + fontSize * 0.2);

                  // 속성 개수 표시
                  if (node.properties && node.properties.length > 0) {
                    const propText = `${node.properties.length} props`;
                    const propFontSize = 10 / globalScale;
                    ctx.font = `${propFontSize}px Sans-Serif`;
                    ctx.fillStyle = '#666';
                    ctx.fillText(propText, node.x, node.y + node.val / 2 + 2 + fontSize + propFontSize);
                  }
                }}
                linkLabel="label"
                linkColor={(link: any) => {
                  // weight에 따라 색상 변화 (약한 관계 -> 강한 관계)
                  const weight = link.weight || 0.5;
                  const intensity = Math.min(weight, 1.0);
                  // HSL 색상으로 강도 표현 (파란색 계열)
                  return `hsla(239, 84%, ${70 - intensity * 20}%, ${0.5 + intensity * 0.5})`;
                }}
                linkWidth={(link: any) => {
                  // weight에 따라 선 두께 조절
                  const weight = link.weight || 0.5;
                  return 1 + (weight * 4); // 1px ~ 5px
                }}
                linkDirectionalArrowLength={(link: any) => {
                  const weight = link.weight || 0.5;
                  return 4 + (weight * 6); // 4 ~ 10
                }}
                linkDirectionalArrowRelPos={1}
                linkCanvasObjectMode={() => "after"}
                linkCanvasObject={(link: any, ctx, globalScale) => {
                  const label = link.label;
                  const weight = link.weight || 0.5;
                  const fontSize = 10 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  
                  const start = link.source;
                  const end = link.target;
                  
                  // 라벨 위치 (링크 중간)
                  const textPos = {
                    x: start.x + (end.x - start.x) / 2,
                    y: start.y + (end.y - start.y) / 2
                  };

                  // Weight 표시 추가
                  const weightText = `${label} [${weight.toFixed(1)}]`;
                  const textWidth = ctx.measureText(weightText).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

                  // 가중치에 따라 배경 색상 변경
                  const intensity = Math.min(weight, 1.0);
                  ctx.fillStyle = `rgba(99, 102, 241, ${0.7 + intensity * 0.3})`;
                  ctx.fillRect(
                    textPos.x - bckgDimensions[0] / 2,
                    textPos.y - bckgDimensions[1] / 2,
                    bckgDimensions[0],
                    bckgDimensions[1]
                  );

                  // 라벨 텍스트
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#fff';
                  ctx.fillText(weightText, textPos.x, textPos.y);
                  
                  // 방향 표시 강화 (양방향일 경우 양쪽 화살표)
                  if (link.directionality === 'bidirectional') {
                    const angle = Math.atan2(end.y - start.y, end.x - start.x);
                    const arrowSize = (2 + weight * 2) / globalScale;
                    
                    // 시작점 화살표
                    ctx.save();
                    ctx.translate(start.x, start.y);
                    ctx.rotate(angle + Math.PI);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-arrowSize, arrowSize);
                    ctx.lineTo(-arrowSize, -arrowSize);
                    ctx.closePath();
                    ctx.fillStyle = link.color;
                    ctx.fill();
                    ctx.restore();
                  }
                }}
                onNodeClick={handleNodeClick}
                onNodeDragEnd={(node: any) => {
                  node.fx = node.x;
                  node.fy = node.y;
                }}
                cooldownTicks={100}
                onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
              />
            )}
          </div>

          {/* 범례 */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="text-sm text-muted-foreground">범례:</div>
            {entities?.slice(0, 5).map((entity) => (
              <div key={entity.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: entity.color || "#3b82f6" }}
                />
                <span className="text-sm">{entity.label}</span>
              </div>
            ))}
            {entities && entities.length > 5 && (
              <span className="text-sm text-muted-foreground">
                +{entities.length - 5} more
              </span>
            )}
          </div>

          {/* 통계 */}
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{graphData.nodes.length}</div>
                <div className="text-xs text-muted-foreground">노드 (엔티티)</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{graphData.links.length}</div>
                <div className="text-xs text-muted-foreground">엣지 (관계)</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {graphData.nodes.reduce((sum, node) => sum + node.properties.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">총 속성</div>
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
