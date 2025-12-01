import React, { useState } from "react";
import { SchemaGraph3D, GraphNode, GraphLink } from "@/features/data-management/ontology/components/SchemaGraph3D";
import { buildRetailOntologyGraphData } from "@/features/data-management/ontology/utils/buildRetailOntologyGraph";

type LayoutType = "force" | "radial" | "hierarchical" | "layered";

export function OntologyGraph3D() {
  const { nodes, links } = buildRetailOntologyGraphData();
  const [layoutType, setLayoutType] = useState<LayoutType>("layered");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="flex gap-4 w-full h-full">
      {/* 좌측 3D 그래프 영역 */}
      <div className="flex-1 min-h-[650px]">
        {/* 레이아웃 타입 선택 UI (예시, shadcn 없이 기본 select 사용) */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-400">
            Layout:
            <select
              className="ml-2 border rounded px-2 py-1 text-xs bg-black/40 text-white"
              value={layoutType}
              onChange={(e) =>
                setLayoutType(e.target.value as LayoutType)
              }
            >
              <option value="force">Force</option>
              <option value="layered">Layered (Entity / Property / Relation)</option>
              <option value="radial">Radial</option>
              <option value="hierarchical">Hierarchical</option>
            </select>
          </div>
          {selectedNode && (
            <div className="text-xs text-gray-300">
              Selected: <span className="font-semibold">{selectedNode.label}</span>
            </div>
          )}
        </div>

        <SchemaGraph3D
          nodes={nodes}
          links={links}
          layoutType={layoutType}
          onNodeClick={(node) => setSelectedNode(node)}
        />
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
