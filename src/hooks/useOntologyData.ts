import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * 온톨로지 기반 엔티티 데이터를 가져오는 Hook
 */
export function useOntologyEntities(entityTypeName?: string) {
  return useQuery({
    queryKey: ['ontology-entities', entityTypeName],
    queryFn: async () => {
      let query = supabase
        .from('graph_entities')
        .select(`
          *,
          entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      // 특정 엔티티 타입 필터링
      if (entityTypeName) {
        const { data: entityType } = await supabase
          .from('ontology_entity_types')
          .select('id')
          .eq('name', entityTypeName)
          .single();
        
        if (entityType) {
          query = query.eq('entity_type_id', entityType.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * 온톨로지 기반 관계 데이터를 가져오는 Hook
 */
export function useOntologyRelations(sourceEntityTypeName?: string, targetEntityTypeName?: string) {
  return useQuery({
    queryKey: ['ontology-relations', sourceEntityTypeName, targetEntityTypeName],
    queryFn: async () => {
      const query = supabase
        .from('graph_relations')
        .select(`
          *,
          source:graph_entities!graph_relations_source_entity_id_fkey(*),
          target:graph_entities!graph_relations_target_entity_id_fkey(*),
          relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * 그래프 쿼리: N-hop 탐색
 */
export function useGraphNHop(startEntityId: string, maxHops: number = 2) {
  return useQuery({
    queryKey: ['graph-n-hop', startEntityId, maxHops],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('graph_n_hop_query', {
        p_user_id: user.user.id,
        p_start_entity_id: startEntityId,
        p_max_hops: maxHops,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!startEntityId,
  });
}

/**
 * 온톨로지 데이터를 AI 추론용으로 변환
 */
export function transformToGraphData(entities: any[], relations: any[]) {
  return {
    nodes: entities.map(entity => ({
      id: entity.id,
      label: entity.label,
      type: entity.entity_type?.name || 'unknown',
      properties: entity.properties,
    })),
    edges: relations.map(relation => ({
      id: relation.id,
      source: relation.source_entity_id,
      target: relation.target_entity_id,
      type: relation.relation_type?.name || 'unknown',
      weight: relation.weight,
      properties: relation.properties,
    })),
  };
}

/**
 * 엔티티 타입별 집계 데이터
 */
export function useEntityAggregation(entityTypeName: string, aggregateField: string) {
  return useQuery({
    queryKey: ['entity-aggregation', entityTypeName, aggregateField],
    queryFn: async () => {
      const { data: entityType } = await supabase
        .from('ontology_entity_types')
        .select('id')
        .eq('name', entityTypeName)
        .single();
      
      if (!entityType) return [];

      const { data: entities, error } = await supabase
        .from('graph_entities')
        .select('label, properties')
        .eq('entity_type_id', entityType.id);

      if (error) throw error;

      // 집계 로직
      return entities?.map(e => ({
        label: e.label,
        value: e.properties?.[aggregateField] || 0,
      })) || [];
    },
  });
}

/**
 * 관계 기반 추론: 특정 엔티티와 연결된 다른 엔티티 찾기
 */
export function useRelatedEntities(entityId: string, relationTypeName?: string) {
  return useQuery({
    queryKey: ['related-entities', entityId, relationTypeName],
    queryFn: async () => {
      let query = supabase
        .from('graph_relations')
        .select(`
          target:graph_entities!graph_relations_target_entity_id_fkey(*),
          relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
        `)
        .eq('source_entity_id', entityId);

      if (relationTypeName) {
        const { data: relationType } = await supabase
          .from('ontology_relation_types')
          .select('id')
          .eq('name', relationTypeName)
          .single();
        
        if (relationType) {
          query = query.eq('relation_type_id', relationType.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });
}
