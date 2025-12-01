// src/features/ontology/utils/buildRetailOntologyGraph.ts
import {
  COMPREHENSIVE_ENTITY_TYPES,
  COMPREHENSIVE_RELATION_TYPES,
} from "src/features/data-management/ontology/utils/comprehensiveRetailSchema.ts"; // 실제 경로에 맞게 수정

import type {
  GraphNode,
  GraphLink,
  PropertyField,
} from "src/features/data-management/ontology/components/SchemaGraph3D.tsx"; // SchemaGraph3D가 있는 경로에 맞게 수정

// NEURALTWIN 온톨로지 스키마 → 3D 그래프 데이터 변환
export function buildRetailOntologyGraphData(): {
  nodes: GraphNode[];
  links: GraphLink[];
} {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  /** 1) 엔티티 노드 생성 */
  const entityNodes: GraphNode[] = COMPREHENSIVE_ENTITY_TYPES.map(
    (entity): GraphNode => {
      const props: PropertyField[] = entity.properties.map((p: any) => ({
        id: `${entity.name}.${p.name}`,
        name: p.name,
        label: p.name,
        type: p.type,
        required: !!p.required,
      }));

      return {
        id: entity.name,
        name: entity.name,
        label: entity.label ?? entity.name,
        color: entity.color ?? "#3b82f6",
        properties: props,
        val: 10 + props.length * 0.8,
        nodeType: "entity",
      };
    },
  );

  /** 2) 속성 노드 생성 */
  const propertyNodes: GraphNode[] = COMPREHENSIVE_ENTITY_TYPES.flatMap(
    (entity): GraphNode[] => {
      const baseColor = entity.color ?? "#6b7280";

      return entity.properties.map((p: any) => {
        const id = `${entity.name}.${p.name}`;

        const fields: PropertyField[] = [
          {
            id,
            name: p.name,
            label: p.name,
            type: p.type,
            required: !!p.required,
          },
        ];

        return {
          id,
          name: p.name,
          label: p.name,
          color: baseColor,
          properties: fields,
          val: 5,
          nodeType: "property",
        };
      });
    },
  );

  /** 3) 관계 타입 노드 생성 */
  const relationNodes: GraphNode[] = COMPREHENSIVE_RELATION_TYPES.map(
    (relation): GraphNode => {
      const props: PropertyField[] = relation.properties.map((p: any) => ({
        id: `${relation.name}.${p.name}`,
        name: p.name,
        label: p.name,
        type: p.type,
        required: !!p.required,
      }));

      return {
        id: relation.name,
        name: relation.name,
        label: relation.label ?? relation.name,
        color: "#eab308",
        properties: props,
        val: 12 + props.length * 0.5,
        nodeType: "relation",
      };
    },
  );

  nodes.push(...entityNodes, ...propertyNodes, ...relationNodes);

  // ID → Node 빠른 lookup
  const nodeById = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeById.set(n.id, n));

  /** 4) 엔티티 → 속성 링크 생성 */
  COMPREHENSIVE_ENTITY_TYPES.forEach((entity) => {
    entity.properties.forEach((p: any) => {
      const sourceId = entity.name;
      const targetId = `${entity.name}.${p.name}`;

      if (!nodeById.has(sourceId) || !nodeById.has(targetId)) return;

      links.push({
        source: sourceId,
        target: targetId,
        label: "hasProperty",
        color: entity.color ?? "#9ca3af",
        properties: [],
        directionality: "directed",
        weight: 0.6,
      });
    });
  });

  /** 5) 관계 triad 링크 생성: sourceEntity → relationNode → targetEntity */
  COMPREHENSIVE_RELATION_TYPES.forEach((relation) => {
    const relId = relation.name;
    const srcId = relation.source_entity_type;
    const tgtId = relation.target_entity_type;

    const color = "#eab308";

    if (nodeById.has(srcId) && nodeById.has(relId)) {
      links.push({
        source: srcId,
        target: relId,
        label: relation.label ?? relation.name,
        color,
        properties: [],
        directionality: relation.directionality ?? "directed",
        weight: 1.0,
      });
    }

    if (nodeById.has(relId) && nodeById.has(tgtId)) {
      links.push({
        source: relId,
        target: tgtId,
        label: relation.label ?? relation.name,
        color,
        properties: [],
        directionality: relation.directionality ?? "directed",
        weight: 1.0,
      });
    }
  });

  return { nodes, links };
}
