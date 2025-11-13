import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type AnalysisType = 'visitor' | 'heatmap' | 'journey' | 'inventory' | 'layout';

interface AnalysisResult {
  id: string;
  analysisType: AnalysisType;
  sceneData: any;
  insights: any;
  createdAt: string;
  updatedAt: string;
}

export function useAutoAnalysis(analysisType: AnalysisType, enabled: boolean = true) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // 온톨로지 변경 감지 및 자동 분석
  useEffect(() => {
    if (!user || !enabled) return;

    // 기존 분석 결과 로드
    loadLatestAnalysis();

    // Realtime 구독: 온톨로지 변경 감지
    const channel = supabase
      .channel('ontology-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'graph_entities'
        },
        (payload) => {
          console.log('Entity changed:', payload);
          handleOntologyChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ontology_entity_types'
        },
        (payload) => {
          console.log('Entity type changed:', payload);
          handleOntologyChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, enabled, analysisType]);

  const loadLatestAnalysis = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_scene_analysis')
        .select('*')
        .eq('user_id', user.id)
        .eq('analysis_type', analysisType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLatestAnalysis({
          id: data.id,
          analysisType: data.analysis_type as AnalysisType,
          sceneData: data.scene_data,
          insights: data.insights,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      }
    } catch (err) {
      console.error('분석 결과 로드 실패:', err);
    }
  };

  const handleOntologyChange = async () => {
    // 변경 감지 후 3초 대기 (debounce)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast({
      title: "온톨로지 변경 감지",
      description: "자동 분석을 시작합니다...",
    });

    await triggerAnalysis();
  };

  const triggerAnalysis = async () => {
    if (!user || analyzing) return;

    setAnalyzing(true);

    try {
      // 온톨로지 데이터 가져오기
      const { data: entities } = await supabase
        .from('graph_entities')
        .select('*')
        .eq('user_id', user.id);

      const { data: relations } = await supabase
        .from('graph_relations')
        .select('*')
        .eq('user_id', user.id);

      // AI 분석 호출
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-store-data',
        {
          body: {
            analysisType,
            ontologyData: {
              entities: entities || [],
              relations: relations || []
            }
          }
        }
      );

      if (analysisError) throw analysisError;

      // 결과 저장
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('ai_scene_analysis')
        .insert({
          user_id: user.id,
          analysis_type: analysisType,
          scene_data: analysisData.sceneData || {},
          insights: analysisData.insights || {}
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setLatestAnalysis({
        id: savedAnalysis.id,
        analysisType: savedAnalysis.analysis_type as AnalysisType,
        sceneData: savedAnalysis.scene_data,
        insights: savedAnalysis.insights,
        createdAt: savedAnalysis.created_at,
        updatedAt: savedAnalysis.updated_at
      });

      toast({
        title: "자동 분석 완료",
        description: "최신 인사이트가 반영되었습니다.",
      });
    } catch (err) {
      console.error('자동 분석 실패:', err);
      toast({
        title: "분석 실패",
        description: err instanceof Error ? err.message : "분석에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    latestAnalysis,
    analyzing,
    triggerAnalysis
  };
}
