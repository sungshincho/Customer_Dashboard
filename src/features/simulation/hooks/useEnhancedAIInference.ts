import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * 시뮬레이션 시나리오 타입
 */
export type SimulationScenario = 'demand' | 'inventory' | 'pricing' | 'layout' | 'marketing';

/**
 * 온톨로지 스키마 - 엔티티 타입 정의 (62개)
 */
export interface OntologyEntityType {
  id: string;
  name: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  priority?: string;
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

/**
 * 온톨로지 스키마 - 관계 타입 정의 (99개)
 */
export interface OntologyRelationType {
  id: string;
  name: string;
  label: string;
  description?: string;
  source_entity_type: string;
  target_entity_type: string;
  directionality: string;
  priority?: string;
  properties: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;
}

/**
 * 온톨로지 스키마 전체
 */
export interface OntologySchema {
  entityTypes: OntologyEntityType[];
  relationTypes: OntologyRelationType[];
  stats: {
    totalEntityTypes: number;
    totalRelationTypes: number;
    criticalEntities: number;
    criticalRelations: number;
  };
}

/**
 * 온톨로지 컨텍스트 - 지식 그래프 데이터 (인스턴스)
 */
export interface OntologyContext {
  // 스키마 정보 (62개 엔티티 타입, 99개 관계 타입)
  schema: OntologySchema;
  
  // 인스턴스 데이터
  entities: {
    total: number;
    byType: Record<string, number>;
    sample: Array<{
      id: string;
      label: string;
      type: string;
      properties: Record<string, any>;
    }>;
  };
  relations: {
    total: number;
    byType: Record<string, number>;
    sample: Array<{
      source: string;
      target: string;
      type: string;
      weight?: number;
    }>;
  };
  
  // 패턴 분석 결과
  patterns: {
    frequentPairs: Array<{ items: string[]; count: number }>;
    hubs: Array<{ entity: string; connections: number; type: string }>;
    isolated: Array<{ entity: string; type: string }>;
    relationChains: Array<{ chain: string[]; count: number }>;
  };
  
  // 통계
  stats: {
    avgDegree: number;
    density: number;
    schemaCoverage: number; // 스키마 중 실제 사용된 비율
  };
}

/**
 * 시뮬레이션 파라미터
 */
export interface SimulationParams {
  dataRange?: number;
  forecastPeriod?: number;
  confidenceLevel?: number;
  includeSeasonality?: boolean;
  includeExternalFactors?: boolean;
  useOntologyContext?: boolean;
  ontologyDepth?: number;
  relationTypes?: string[];
  [key: string]: any;
}

/**
 * AI 추론 결과
 */
export interface InferenceResult {
  type: string;
  timestamp: string;
  confidenceScore: number;
  aiInsights: string;
  predictedKpi?: Record<string, number>;
  recommendations?: string[];
  ontologyInsights?: {
    schemaUsed: boolean;
    entityTypesAnalyzed: string[];
    relationTypesAnalyzed: string[];
    patternsUsed: string[];
    confidence: number;
  };
  [key: string]: any;
}

/**
 * 온톨로지 추론 결과
 */
export interface OntologyInferenceResult {
  type: 'recommendation' | 'anomaly_detection' | 'pattern_analysis';
  timestamp: string;
  graphStats: {
    totalEntities: number;
    totalRelations: number;
    entityTypes: string[];
    relationTypes: string[];
  };
  schemaInfo: {
    entityTypesCount: number;
    relationTypesCount: number;
  };
  analysis: any;
}

interface UseEnhancedAIInferenceReturn {
  loading: boolean;
  error: Error | null;
  lastResult: InferenceResult | null;
  ontologyContext: OntologyContext | null;
  ontologySchema: OntologySchema | null;
  
  infer: (
    scenario: SimulationScenario,
    params?: SimulationParams,
    storeContext?: any
  ) => Promise<InferenceResult | null>;
  
  inferWithOntology: (
    scenario: SimulationScenario,
    params?: SimulationParams,
    storeContext?: any
  ) => Promise<InferenceResult | null>;
  
  runOntologyInference: (
    inferenceType: 'recommendation' | 'anomaly_detection' | 'pattern_analysis',
    entityId?: string,
    params?: Record<string, any>
  ) => Promise<OntologyInferenceResult | null>;
  
  analyzeGoal: (goalText: string) => Promise<any[] | null>;
  loadOntologySchema: () => Promise<OntologySchema | null>;
  loadOntologyContext: () => Promise<OntologyContext | null>;
  clearError: () => void;
  clearLastResult: () => void;
}

/**
 * useEnhancedAIInference Hook v2
 * 
 * 62개 엔티티 타입, 99개 관계 타입의 온톨로지 스키마를 완전히 활용
 */
export function useEnhancedAIInference(): UseEnhancedAIInferenceReturn {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<InferenceResult | null>(null);
  const [ontologyContext, setOntologyContext] = useState<OntologyContext | null>(null);
  const [ontologySchema, setOntologySchema] = useState<OntologySchema | null>(null);
  
  const cache = useRef<Map<string, { result: any; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000;

  /**
   * 온톨로지 스키마 로드 (62개 엔티티 타입, 99개 관계 타입)
   */
  const loadOntologySchema = useCallback(async (): Promise<OntologySchema | null> => {
    if (!user?.id) return null;

    try {
      // 엔티티 타입 조회 (62개)
      const { data: entityTypes, error: entityError } = await supabase
        .from('ontology_entity_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (entityError) throw entityError;

      // 관계 타입 조회 (99개)
      const { data: relationTypes, error: relationError } = await supabase
        .from('ontology_relation_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (relationError) throw relationError;

      // 우선순위별 카운트
      const criticalEntities = (entityTypes || []).filter(
        (e: any) => e.properties?.find?.((p: any) => p.priority === 'critical') || 
                    e.name?.match(/^(Store|Product|Customer|Zone|Transaction|Inventory)$/)
      ).length;
      
      const criticalRelations = (relationTypes || []).filter(
        (r: any) => r.priority === 'critical' || r.priority === 'additional'
      ).length;

      const schema: OntologySchema = {
        entityTypes: (entityTypes || []).map((e: any) => ({
          id: e.id,
          name: e.name,
          label: e.label,
          description: e.description,
          icon: e.icon,
          color: e.color,
          priority: e.priority,
          properties: e.properties || [],
        })),
        relationTypes: (relationTypes || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          label: r.label,
          description: r.description,
          source_entity_type: r.source_entity_type,
          target_entity_type: r.target_entity_type,
          directionality: r.directionality,
          priority: r.priority,
          properties: r.properties || [],
        })),
        stats: {
          totalEntityTypes: entityTypes?.length || 0,
          totalRelationTypes: relationTypes?.length || 0,
          criticalEntities,
          criticalRelations,
        },
      };

      setOntologySchema(schema);
      console.log(`📊 온톨로지 스키마 로드: ${schema.stats.totalEntityTypes}개 엔티티 타입, ${schema.stats.totalRelationTypes}개 관계 타입`);
      
      return schema;
    } catch (e) {
      console.error('Failed to load ontology schema:', e);
      return null;
    }
  }, [user?.id]);

  /**
   * 온톨로지 컨텍스트 로드 (스키마 + 인스턴스)
   */
  const loadOntologyContext = useCallback(async (): Promise<OntologyContext | null> => {
    if (!selectedStore?.id || !user?.id) return null;

    try {
      // 1. 스키마 로드
      let schema = ontologySchema;
      if (!schema) {
        schema = await loadOntologySchema();
      }
      if (!schema) {
        throw new Error('Failed to load ontology schema');
      }

      // 2. 엔티티 인스턴스 조회
      const { data: entities, error: entitiesError } = await supabase
        .from('graph_entities')
        .select(`
          id,
          label,
          properties,
          entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(id, name, label)
        `)
        .eq('store_id', selectedStore.id)
        .eq('user_id', user.id)
        .limit(1000);

      if (entitiesError) throw entitiesError;

      // 3. 관계 인스턴스 조회
      const { data: relations, error: relationsError } = await supabase
        .from('graph_relations')
        .select(`
          id,
          weight,
          properties,
          source:graph_entities!graph_relations_source_entity_id_fkey(id, label, entity_type_id),
          target:graph_entities!graph_relations_target_entity_id_fkey(id, label, entity_type_id),
          relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(id, name, label)
        `)
        .eq('store_id', selectedStore.id)
        .eq('user_id', user.id)
        .limit(2000);

      if (relationsError) throw relationsError;

      // 4. 엔티티 타입별 카운트
      const entityByType: Record<string, number> = {};
      (entities || []).forEach((e: any) => {
        const typeName = e.entity_type?.name || 'unknown';
        entityByType[typeName] = (entityByType[typeName] || 0) + 1;
      });

      // 5. 관계 타입별 카운트
      const relationByType: Record<string, number> = {};
      (relations || []).forEach((r: any) => {
        const typeName = r.relation_type?.name || 'unknown';
        relationByType[typeName] = (relationByType[typeName] || 0) + 1;
      });

      // 6. 노드 연결 수 계산
      const nodeDegrees: Record<string, { count: number; type: string; label: string }> = {};
      (relations || []).forEach((r: any) => {
        const sourceId = r.source?.id;
        const targetId = r.target?.id;
        if (sourceId) {
          if (!nodeDegrees[sourceId]) {
            nodeDegrees[sourceId] = { count: 0, type: '', label: '' };
          }
          nodeDegrees[sourceId].count++;
          const sourceEntity = (entities || []).find((e: any) => e.id === sourceId);
          nodeDegrees[sourceId].type = sourceEntity?.entity_type?.name || 'unknown';
          nodeDegrees[sourceId].label = sourceEntity?.label || sourceId;
        }
        if (targetId) {
          if (!nodeDegrees[targetId]) {
            nodeDegrees[targetId] = { count: 0, type: '', label: '' };
          }
          nodeDegrees[targetId].count++;
          const targetEntity = (entities || []).find((e: any) => e.id === targetId);
          nodeDegrees[targetId].type = targetEntity?.entity_type?.name || 'unknown';
          nodeDegrees[targetId].label = targetEntity?.label || targetId;
        }
      });

      // 7. 허브 노드 (상위 15개)
      const hubs = Object.entries(nodeDegrees)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 15)
        .map(([id, info]) => ({
          entity: info.label,
          connections: info.count,
          type: info.type,
        }));

      // 8. 고립 노드
      const connectedIds = new Set(Object.keys(nodeDegrees));
      const isolated = (entities || [])
        .filter((e: any) => !connectedIds.has(e.id))
        .slice(0, 20)
        .map((e: any) => ({
          entity: e.label,
          type: e.entity_type?.name || 'unknown',
        }));

      // 9. 동시 발생 패턴
      const coOccurrences: Record<string, number> = {};
      const sourceToTargets: Record<string, Set<string>> = {};
      
      (relations || []).forEach((r: any) => {
        const sourceId = r.source?.id;
        const targetLabel = r.target?.label;
        if (sourceId && targetLabel) {
          if (!sourceToTargets[sourceId]) {
            sourceToTargets[sourceId] = new Set();
          }
          sourceToTargets[sourceId].add(targetLabel);
        }
      });

      Object.values(sourceToTargets).forEach(targets => {
        const targetList = Array.from(targets);
        for (let i = 0; i < targetList.length; i++) {
          for (let j = i + 1; j < targetList.length; j++) {
            const key = [targetList[i], targetList[j]].sort().join(' & ');
            coOccurrences[key] = (coOccurrences[key] || 0) + 1;
          }
        }
      });

      const frequentPairs = Object.entries(coOccurrences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([pair, count]) => ({ items: pair.split(' & '), count }));

      // 10. 관계 체인 패턴 (A→B→C)
      const relationChains: Record<string, number> = {};
      (relations || []).forEach((r1: any) => {
        const midId = r1.target?.id;
        const relatedRelations = (relations || []).filter((r2: any) => r2.source?.id === midId);
        relatedRelations.forEach((r2: any) => {
          const chain = `${r1.relation_type?.name || '?'}→${r2.relation_type?.name || '?'}`;
          relationChains[chain] = (relationChains[chain] || 0) + 1;
        });
      });

      const topChains = Object.entries(relationChains)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([chain, count]) => ({ chain: chain.split('→'), count }));

      // 11. 스키마 커버리지 계산
      const usedEntityTypes = new Set(Object.keys(entityByType));
      const usedRelationTypes = new Set(Object.keys(relationByType));
      const schemaCoverage = (
        (usedEntityTypes.size / schema.stats.totalEntityTypes) * 0.5 +
        (usedRelationTypes.size / schema.stats.totalRelationTypes) * 0.5
      ) * 100;

      // 12. 통계
      const totalNodes = (entities || []).length;
      const totalEdges = (relations || []).length;
      const degrees = Object.values(nodeDegrees).map(n => n.count);
      const avgDegree = degrees.length > 0 
        ? degrees.reduce((a, b) => a + b, 0) / degrees.length 
        : 0;
      const maxPossibleEdges = totalNodes * (totalNodes - 1) / 2;
      const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

      const context: OntologyContext = {
        schema,
        entities: {
          total: totalNodes,
          byType: entityByType,
          sample: (entities || []).slice(0, 100).map((e: any) => ({
            id: e.id,
            label: e.label,
            type: e.entity_type?.name || 'unknown',
            properties: e.properties || {},
          })),
        },
        relations: {
          total: totalEdges,
          byType: relationByType,
          sample: (relations || []).slice(0, 100).map((r: any) => ({
            source: r.source?.label || '',
            target: r.target?.label || '',
            type: r.relation_type?.name || 'unknown',
            weight: r.weight,
          })),
        },
        patterns: {
          frequentPairs,
          hubs,
          isolated,
          relationChains: topChains,
        },
        stats: {
          avgDegree,
          density,
          schemaCoverage,
        },
      };

      setOntologyContext(context);
      console.log(`🔗 온톨로지 컨텍스트 로드 완료:`);
      console.log(`   - 스키마: ${schema.stats.totalEntityTypes}개 엔티티 타입, ${schema.stats.totalRelationTypes}개 관계 타입`);
      console.log(`   - 인스턴스: ${totalNodes}개 엔티티, ${totalEdges}개 관계`);
      console.log(`   - 스키마 커버리지: ${schemaCoverage.toFixed(1)}%`);
      
      return context;
    } catch (e) {
      console.error('Failed to load ontology context:', e);
      return null;
    }
  }, [selectedStore?.id, user?.id, ontologySchema, loadOntologySchema]);

  /**
   * 기본 AI 추론 (기존 호환)
   */
  const infer = useCallback(async (
    scenario: SimulationScenario,
    params: SimulationParams = {},
    storeContext?: any
  ): Promise<InferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    const cacheKey = `${scenario}-${selectedStore.id}-${JSON.stringify(params)}`;
    const cached = cache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'prediction',
            data: [{ scenarioType: scenario, params, storeId: selectedStore.id }],
            parameters: {
              scenario_type: scenario,
              store_context: storeContext,
              ...params,
            },
          },
        }
      );

      if (fnError) throw fnError;

      const result = data as InferenceResult;
      setLastResult(result);
      
      cache.current.set(cacheKey, { result, timestamp: Date.now() });
      
      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      console.error('AI inference error:', e);
      toast.error(err.message || 'AI 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  /**
   * 온톨로지 강화 AI 추론 (62개 엔티티 타입, 99개 관계 타입 활용)
   */
  const inferWithOntology = useCallback(async (
    scenario: SimulationScenario,
    params: SimulationParams = {},
    storeContext?: any
  ): Promise<InferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 온톨로지 컨텍스트 로드 (스키마 + 인스턴스)
      let context = ontologyContext;
      if (!context) {
        context = await loadOntologyContext();
      }

      // 2. 스키마 정보 구성 (62개 엔티티, 99개 관계)
      const schemaInfo = context?.schema ? {
        entityTypes: context.schema.entityTypes.map(e => ({
          name: e.name,
          label: e.label,
          description: e.description,
          properties: e.properties.map(p => p.name),
        })),
        relationTypes: context.schema.relationTypes.map(r => ({
          name: r.name,
          label: r.label,
          source: r.source_entity_type,
          target: r.target_entity_type,
        })),
        stats: context.schema.stats,
      } : undefined;

      // 3. 온톨로지 컨텍스트를 포함하여 추론
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'prediction',
            data: [{ scenarioType: scenario, params, storeId: selectedStore.id }],
            graph_data: context ? {
              nodes: context.entities.sample,
              edges: context.relations.sample,
              patterns: context.patterns,
              stats: context.stats,
            } : undefined,
            parameters: {
              scenario_type: scenario,
              store_context: storeContext,
              use_ontology: true,
              // 스키마 정보 전달 (핵심!)
              ontology_schema: schemaInfo,
              ontology_summary: context ? {
                totalEntityTypes: context.schema.stats.totalEntityTypes,
                totalRelationTypes: context.schema.stats.totalRelationTypes,
                totalEntities: context.entities.total,
                totalRelations: context.relations.total,
                entityTypeDistribution: context.entities.byType,
                relationTypeDistribution: context.relations.byType,
                schemaCoverage: context.stats.schemaCoverage,
                topPatterns: context.patterns.frequentPairs.slice(0, 5),
                hubEntities: context.patterns.hubs.slice(0, 5),
                relationChains: context.patterns.relationChains.slice(0, 5),
              } : undefined,
              ...params,
            },
          },
        }
      );

      if (fnError) throw fnError;

      const result = {
        ...data,
        ontologyInsights: context ? {
          schemaUsed: true,
          entityTypesAnalyzed: Object.keys(context.entities.byType),
          relationTypesAnalyzed: Object.keys(context.relations.byType),
          patternsUsed: context.patterns.frequentPairs.slice(0, 5).map(p => p.items.join(' & ')),
          confidence: context.stats.schemaCoverage > 50 ? 0.85 : 0.7,
        } : undefined,
      } as InferenceResult;

      setLastResult(result);
      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      console.error('Ontology-enhanced inference error:', e);
      toast.error(err.message || '온톨로지 기반 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, ontologyContext, loadOntologyContext]);

  /**
   * 온톨로지 전용 추론
   */
  const runOntologyInference = useCallback(async (
    inferenceType: 'recommendation' | 'anomaly_detection' | 'pattern_analysis',
    entityId?: string,
    params: Record<string, any> = {}
  ): Promise<OntologyInferenceResult | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 스키마 정보도 함께 전달
      const schema = ontologySchema || await loadOntologySchema();

      const { data, error: fnError } = await supabase.functions.invoke(
        'ontology-ai-inference',
        {
          body: {
            inference_type: inferenceType,
            store_id: selectedStore.id,
            entity_id: entityId,
            parameters: {
              ...params,
              schema_info: schema ? {
                entityTypesCount: schema.stats.totalEntityTypes,
                relationTypesCount: schema.stats.totalRelationTypes,
                entityTypes: schema.entityTypes.map(e => e.name),
                relationTypes: schema.relationTypes.map(r => r.name),
              } : undefined,
            },
          },
        }
      );

      if (fnError) throw fnError;

      const result: OntologyInferenceResult = {
        type: inferenceType,
        timestamp: data.timestamp,
        graphStats: data.graph_stats,
        schemaInfo: {
          entityTypesCount: schema?.stats.totalEntityTypes || 0,
          relationTypesCount: schema?.stats.totalRelationTypes || 0,
        },
        analysis: data,
      };

      toast.success(`${getInferenceTypeLabel(inferenceType)} 완료`);
      return result;
    } catch (e) {
      const err = e as Error;
      setError(err);
      console.error('Ontology inference error:', e);
      toast.error(err.message || '온톨로지 추론 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, ontologySchema, loadOntologySchema]);

  /**
   * 비즈니스 목표 분석
   */
  const analyzeGoal = useCallback(async (goalText: string): Promise<any[] | null> => {
    if (!selectedStore?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'pattern',
            data: [{ goal: goalText, storeId: selectedStore.id }],
            parameters: {
              analysis_type: 'business_goal_analysis',
              goal_text: goalText,
            },
          },
        }
      );

      if (fnError) throw fnError;

      return data?.recommendations || [];
    } catch (e) {
      const err = e as Error;
      setError(err);
      console.error('Goal analysis error:', e);
      toast.error(err.message || '목표 분석 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  const clearError = useCallback(() => setError(null), []);
  const clearLastResult = useCallback(() => setLastResult(null), []);

  return {
    loading,
    error,
    lastResult,
    ontologyContext,
    ontologySchema,
    infer,
    inferWithOntology,
    runOntologyInference,
    analyzeGoal,
    loadOntologySchema,
    loadOntologyContext,
    clearError,
    clearLastResult,
  };
}

function getInferenceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    recommendation: '추천 분석',
    anomaly_detection: '이상 탐지',
    pattern_analysis: '패턴 분석',
  };
  return labels[type] || type;
}

export default useEnhancedAIInference;
