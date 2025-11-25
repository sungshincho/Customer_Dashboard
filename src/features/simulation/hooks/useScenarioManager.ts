import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Scenario, ScenarioType, ScenarioParams, KpiSnapshot } from '../types/scenario.types';
import { toast } from 'sonner';

// DB 타입을 앱 타입으로 변환
function dbToScenario(dbScenario: any): Scenario {
  return {
    id: dbScenario.id,
    userId: dbScenario.user_id,
    storeId: dbScenario.store_id,
    scenarioType: dbScenario.scenario_type as ScenarioType,
    name: dbScenario.name,
    description: dbScenario.description,
    params: dbScenario.params,
    baselineKpi: dbScenario.baseline_kpi,
    predictedKpi: dbScenario.predicted_kpi,
    confidenceScore: dbScenario.confidence_score,
    aiInsights: dbScenario.ai_insights,
    status: dbScenario.status,
    createdAt: dbScenario.created_at,
    updatedAt: dbScenario.updated_at,
  };
}

export function useScenarioManager(storeId?: string) {
  const queryClient = useQueryClient();

  // 시나리오 목록 조회
  const { data: scenarios, isLoading } = useQuery({
    queryKey: ['scenarios', storeId],
    queryFn: async () => {
      let query = supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data?.map(dbToScenario) || [];
    },
  });

  // 시나리오 생성
  const createScenarioMutation = useMutation({
    mutationFn: async ({
      scenarioType,
      name,
      description,
      params,
      storeId,
    }: {
      scenarioType: ScenarioType;
      name: string;
      description?: string;
      params: ScenarioParams;
      storeId?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('scenarios')
        .insert({
          user_id: user.user.id,
          store_id: storeId || null,
          scenario_type: scenarioType,
          scenario_name: name,
          parameters: params as any,
        })
        .select()
        .single();

      if (error) throw error;
      return dbToScenario(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('시나리오가 생성되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`시나리오 생성 실패: ${error.message}`);
    },
  });

  // 시나리오 업데이트
  const updateScenarioMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Scenario>;
    }) => {
      const { data, error } = await supabase
        .from('scenarios')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return dbToScenario(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('시나리오가 업데이트되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`시나리오 업데이트 실패: ${error.message}`);
    },
  });

  // 시나리오 삭제
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('시나리오가 삭제되었습니다');
    },
    onError: (error: Error) => {
      toast.error(`시나리오 삭제 실패: ${error.message}`);
    },
  });

  // 예측 결과 업데이트
  const updatePredictionMutation = useMutation({
    mutationFn: async ({
      id,
      predictedKpi,
      confidenceScore,
      aiInsights,
    }: {
      id: string;
      predictedKpi: KpiSnapshot;
      confidenceScore: number;
      aiInsights: string;
    }) => {
      const { data, error } = await supabase
        .from('scenarios')
        .update({
          predicted_kpi: predictedKpi as any,
          confidence_score: confidenceScore,
          ai_insights: aiInsights,
          status: 'completed',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return dbToScenario(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });

  const createScenario = useCallback(
    (params: Parameters<typeof createScenarioMutation.mutate>[0]) => {
      return createScenarioMutation.mutateAsync(params);
    },
    [createScenarioMutation]
  );

  const updateScenario = useCallback(
    (params: Parameters<typeof updateScenarioMutation.mutate>[0]) => {
      return updateScenarioMutation.mutateAsync(params);
    },
    [updateScenarioMutation]
  );

  const deleteScenario = useCallback(
    (id: string) => {
      return deleteScenarioMutation.mutateAsync(id);
    },
    [deleteScenarioMutation]
  );

  const updatePrediction = useCallback(
    (params: Parameters<typeof updatePredictionMutation.mutate>[0]) => {
      return updatePredictionMutation.mutateAsync(params);
    },
    [updatePredictionMutation]
  );

  return {
    scenarios,
    isLoading,
    createScenario,
    updateScenario,
    deleteScenario,
    updatePrediction,
    isCreating: createScenarioMutation.isPending,
    isUpdating: updateScenarioMutation.isPending,
    isDeleting: deleteScenarioMutation.isPending,
  };
}
