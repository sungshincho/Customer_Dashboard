import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PredictionRequest, PredictionResult } from '../types/prediction.types';
import { ScenarioType } from '../types/scenario.types';
import { toast } from 'sonner';

export function useAIInference() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const infer = async (
    scenarioType: ScenarioType,
    params: Record<string, any>,
    storeId?: string
  ): Promise<PredictionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const request: PredictionRequest = {
        scenarioType,
        params,
        storeId,
      };

      const { data, error: functionError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'predictive_modeling',
            data: [request],
            parameters: {
              scenario_type: scenarioType,
              ...params,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data) {
        throw new Error('No prediction result returned');
      }

      toast.success('시뮬레이션 예측 완료');
      return data as PredictionResult;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'AI 추론 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { infer, loading, error };
}
