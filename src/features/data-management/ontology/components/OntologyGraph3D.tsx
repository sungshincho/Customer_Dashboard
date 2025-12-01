import React, { useState, useMemo } from "react";
import { SchemaGraph3D, GraphNode, GraphLink } from "@/features/data-management/ontology/components/SchemaGraph3D";
import { buildRetailOntologyGraphData } from "@/features/data-management/ontology/utils/buildRetailOntologyGraph";
import { COMPREHENSIVE_RELATION_TYPES } from "@/features/data-management/ontology/utils/comprehensiveRetailSchema";

type LayoutType = "layered" | "radial";
type NodeTypeFilter = "entity" | "property" | "relation" | "all";
type PriorityFilter = "critical" | "high" | "medium" | "low" | "additional" | "all";

export function OntologyGraph3D() {
  const { nodes, links } = buildRetailOntologyGraphData();
  const [layoutType, setLayoutType] = useState<LayoutType>("layered");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  // 필터링된 노드 계산
  const filteredData = useMemo(() => {
    let filteredNodes = nodes;
    
    // 노드 타입 필터
    if (nodeTypeFilter !== "all") {
      filteredNodes = filteredNodes.filter(n => n.nodeType === nodeTypeFilter);
    }
    
    // 중요도 필터
    if (priorityFilter !== "all") {
      filteredNodes = filteredNodes.filter(n => (n as any).priority === priorityFilter);
    }
    
    // 필터링된 노드 ID 세트
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    // 필터링된 노드에 연결된 링크만 포함
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, nodeTypeFilter, priorityFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const entityCount = nodes.filter(n => n.nodeType === "entity").length;
    const propertyCount = nodes.filter(n => n.nodeType === "property").length;
    const relationCount = nodes.filter(n => n.nodeType === "relation").length;
    const totalCount = nodes.length;
    
    return {
      entity: entityCount,
      property: propertyCount,
      relation: relationCount,
      total: totalCount,
      // 실제 관계 타입 수 (시각화 링크 수가 아님)
      linkCount: COMPREHENSIVE_RELATION_TYPES.length
    };
  }, [nodes]);

  return (
    <div className="flex gap-4 w-full h-full">
      {/* 좌측 3D 그래프 영역 */}
      <div className="flex-1 min-h-[650px] flex flex-col">
        {/* 필터 및 레이아웃 선택 UI */}
        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="flex items-center gap-4">
            {/* 레이아웃 선택 */}
            <div className="text-sm text-gray-400">
              Layout:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as LayoutType)}
              >
                <option value="layered">Layered (Property / Entity / Relation)</option>
                <option value="radial">Radial</option>
              </select>
            </div>

            {/* 노드 타입 필터 */}
            <div className="text-sm text-gray-400">
              Node Type:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={nodeTypeFilter}
                onChange={(e) => setNodeTypeFilter(e.target.value as NodeTypeFilter)}
              >
                <option value="all">All</option>
                <option value="entity" style={{ color: '#3b82f6' }}>엔티티 (파란색)</option>
                <option value="property" style={{ color: '#a855f7' }}>속성 (보라색)</option>
                <option value="relation" style={{ color: '#eab308' }}>관계 (노란색)</option>
              </select>
            </div>

            {/* 중요도 필터 */}
            <div className="text-sm text-gray-400">
              Priority:
              <select
                className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              >
                <option value="all">All</option>
                <option value="critical" style={{ color: '#ef4444' }}>Critical (빨간색)</option>
                <option value="high" style={{ color: '#f97316' }}>High (주황색)</option>
                <option value="medium" style={{ color: '#22c55e' }}>Medium (초록색)</option>
                <option value="low" style={{ color: '#3b82f6' }}>Low (파란색)</option>
                <option value="additional" style={{ color: '#6b7280' }}>Additional (회색)</option>
              </select>
            </div>
          </div>

          {selectedNode && (
            <div className="text-xs text-gray-300">
              Selected: <span className="font-semibold">{selectedNode.label}</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <SchemaGraph3D
            nodes={filteredData.nodes}
            links={filteredData.links}
            layoutType={layoutType}
            priorityFilter={priorityFilter}
            onNodeClick={(node) => setSelectedNode(node)}
          />
        </div>

        {/* 통계 정보 */}
        <div className="mt-4 grid grid-cols-5 gap-3 bg-black/60 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <div className="text-xs">
              <div className="text-gray-400">엔티티</div>
              <div className="text-white font-semibold">{stats.entity}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <div className="text-xs">
              <div className="text-gray-400">속성</div>
              <div className="text-white font-semibold">{stats.property}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="text-xs">
              <div className="text-gray-400">관계</div>
              <div className="text-white font-semibold">{stats.relation}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="text-xs">
              <div className="text-gray-400">총 노드</div>
              <div className="text-white font-semibold">{stats.total}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-400" />
            <div className="text-xs">
              <div className="text-gray-400">연결선</div>
              <div className="text-white font-semibold">{stats.linkCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 선택 노드 상세 패널 */}
      <div className="w-80 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-gray-200">
        <div className="font-semibold text-sm mb-2">Node Details</div>
        {selectedNode ? (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] text-gray-400">ID</div>
              <div className="break-all">{selectedNode.id}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Label</div>
              <div>{selectedNode.label}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Type</div>
              <div>{selectedNode.nodeType ?? "entity"}</div>
            </div>
            {selectedNode.properties?.length > 0 && (
              <div>
                <div className="text-[10px] text-gray-400 mb-1">
                  Properties ({selectedNode.properties.length})
                </div>
                <ul className="max-h-52 overflow-auto pr-1 space-y-0.5">
                  {selectedNode.properties.map((p) => (
                    <li key={p.id}>
                      <span className="font-mono text-[11px] text-emerald-300">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {" "}
                        : {p.type} {p.required ? "(required)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-[11px]">
            노드를 클릭하면 상세 정보가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
