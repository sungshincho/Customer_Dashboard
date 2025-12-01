import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GraphNode, GraphLink } from '@/features/data-management/ontology/components/SchemaGraph3D';

/**
 * 현재 로그인한 사용자의 온톨로지 스키마 정의를 가져오는 Hook
 * (entity types와 relation types)
 */
export function useOntologySchema() {
  return useQuery({
    queryKey: ['ontology-schema'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // 엔티티 타입 가져오기
      const { data: entityTypes, error: entityError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', user.user.id)
        .order('name');

      if (entityError) throw entityError;

      // 관계 타입 가져오기
      const { data: relationTypes, error: relationError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .eq('user_id', user.user.id)
        .order('name');

      if (relationError) throw relationError;

      return {
        entityTypes: entityTypes || [],
        relationTypes: relationTypes || []
      };
    }
  });
}

/**
 * 온톨로지 스키마를 3D 그래프 형식으로 변환
 */
export function transformSchemaToGraphData(entityTypes: any[], relationTypes: any[]): { nodes: GraphNode[], links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // 엔티티 타입 → 노드 변환
  entityTypes.forEach(entityType => {
    // 엔티티 노드 추가
    nodes.push({
      id: `entity-${entityType.name}`,
      name: entityType.label || entityType.name,
      label: entityType.label || entityType.name,
      nodeType: 'entity',
      color: '#3b82f6', // 블루
      val: 8,
      properties: [],
    });

    // 속성(properties) 노드 추가
    if (entityType.properties && typeof entityType.properties === 'object') {
      const properties = Array.isArray(entityType.properties) 
        ? entityType.properties 
        : Object.keys(entityType.properties);
      
      properties.forEach((prop: any) => {
        const propName = typeof prop === 'string' ? prop : prop.name;
        const propId = `prop-${entityType.name}-${propName}`;
        
        nodes.push({
          id: propId,
          name: propName,
          label: propName,
          nodeType: 'property',
          color: '#a855f7', // 퍼플
          val: 4,
          properties: [],
        });

        // 엔티티 → 속성 링크
        links.push({
          source: `entity-${entityType.name}`,
          target: propId,
          label: 'has_property',
          color: '#6b7280',
          properties: [],
          directionality: 'unidirectional',
          weight: 1,
        });
      });
    }
  });

  // 관계 타입 → 노드 및 링크 변환
  relationTypes.forEach(relationType => {
    const relationId = `relation-${relationType.name}-${relationType.source_entity_type}-${relationType.target_entity_type}`;
    
    // 관계 노드 추가
    nodes.push({
      id: relationId,
      name: relationType.label || relationType.name,
      label: relationType.label || relationType.name,
      nodeType: 'relation',
      color: '#eab308', // 옐로우
      val: 6,
      properties: [],
    });

    // source 엔티티 → 관계 링크
    const sourceEntityId = `entity-${relationType.source_entity_type}`;
    if (nodes.some(n => n.id === sourceEntityId)) {
      links.push({
        source: sourceEntityId,
        target: relationId,
        label: 'source',
        color: '#9ca3af',
        properties: [],
        directionality: relationType.directionality || 'unidirectional',
        weight: 1,
      });
    }

    // 관계 → target 엔티티 링크
    const targetEntityId = `entity-${relationType.target_entity_type}`;
    if (nodes.some(n => n.id === targetEntityId)) {
      links.push({
        source: relationId,
        target: targetEntityId,
        label: 'target',
        color: '#9ca3af',
        properties: [],
        directionality: relationType.directionality || 'unidirectional',
        weight: 1,
      });
    }
  });

  return { nodes, links };
}
