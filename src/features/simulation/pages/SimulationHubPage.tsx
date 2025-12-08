import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Grid3x3, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Package, 
  Info,
  Brain,
  Network,
  History,
  BarChart3,
  Save,
  AlertTriangle,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { DemandForecastResult } from '../components/DemandForecastResult';
import { InventoryOptimizationResult } from '../components/InventoryOptimizationResult';
import { PricingOptimizationResult } from '../components/PricingOptimizationResult';
import { RecommendationStrategyResult } from '../components/RecommendationStrategyResult';
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

// v2 컴포넌트들
import { DataSourceMappingCard } from '../components/DataSourceMappingCard';
import { 
  AIModelSelector, 
  defaultScenarios, 
  defaultParameters,
  type SimulationScenario,
  type SimulationParameters,
  type SimulationScenarioConfig
} from '../components/AIModelSelector';
import { 
  SimulationResultCard, 
  SimulationResultGrid,
  type SimulationResultMeta
} from '../components/SimulationResultCard';

// Phase 2: 데이터 소스 매핑 Hook
import { useDataSourceMapping } from '../hooks/useDataSourceMapping';

// Phase 3: 온톨로지 강화 AI 추론 Hook
import { useEnhancedAIInference } from '../hooks/useEnhancedAIInference';

// ✅ 실제 데이터를 가져오는 Hook 추가
import { useStoreContext } from '../hooks/useStoreContext';

// Phase 4: 내보내기, 히스토리, 시각화
import { exportSimulationResult } from '../utils/simulationExporter';
import { useSimulationHistory } from '../hooks/useSimulationHistory';
import { OntologyInsightChart } from '../components/OntologyInsightChart';
import { SimulationHistoryPanel } from '../components/SimulationHistoryPanel';

// 레이아웃 비교 및 적용
import { LayoutComparisonView } from '../components/LayoutComparisonView';
import { useLayoutApply } from '../hooks/useLayoutApply';

// 기존 imports 아래에 추가:
import { IntegratedDataAnalysis } from '../components/IntegratedDataAnalysis';

// 🆕 추가
import { ROIResultCard, ROISummaryCard } from '../components/ROIResultCard';

/**
 * 데이터 품질 상태 타입
 */
interface DataQualityStatus {
  hasProducts: boolean;
  hasInventory: boolean;
  hasKpis: boolean;
  hasEntities: boolean;
  productCount: number;
  inventoryCount: number;
  kpiDays: number;
  entityCount: number;
  overallScore: number;
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  message: string;
  canRunSimulation: boolean;
  recommendations: string[];
}

/**
 * 시나리오별 최소 데이터 요구사항
 */
const SCENARIO_REQUIREMENTS: Record<SimulationScenario, {
  minProducts?: number;
  minInventory?: number;
  minKpiDays?: number;
  minEntities?: number;
  description: string;
}> = {
  demand: {
    minProducts: 5,
    minKpiDays: 7,
    description: '수요 예측을 위해 최소 5개 상품과 7일 이상의 KPI 데이터가 필요합니다.',
  },
  inventory: {
    minInventory: 5,
    minProducts: 5,
    description: '재고 최적화를 위해 최소 5개 상품과 재고 데이터가 필요합니다.',
  },
  pricing: {
    minProducts: 5,
    description: '가격 최적화를 위해 최소 5개 상품 데이터(원가, 판매가)가 필요합니다.',
  },
  layout: {
    minEntities: 3,
    description: '레이아웃 최적화를 위해 최소 3개 이상의 매장 엔티티가 필요합니다.',
  },
  marketing: {
    minProducts: 5,
    minKpiDays: 7,
    description: '마케팅 전략 수립을 위해 상품 및 고객 행동 데이터가 필요합니다.',
  },
};

/**
 * SimulationHubPage v2.5
 * 
 * 주요 업데이트:
 * - 실제 백엔드 데이터 연동 (useStoreContext)
 * - 데이터 품질 평가 및 피드백
 * - 시나리오별 데이터 요구사항 검증
 * - 레이아웃 As-Is/To-Be 비교 및 DB 저장
 */
export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();

  // ✅ 실제 데이터를 가져오는 Hook
  const { 
    contextData, 
    loading: contextLoading, 
    error: contextError,
  } = useStoreContext(selectedStore?.id);

  // Phase 2: 데이터 소스 매핑
  const {
    importedData,
    presetApis,
    customApis,
    mappingStatus,
    loading: dataSourcesLoading,
    refreshMapping,
    connectApi,
    disconnectApi,
    configurePresetApi,
    isAdmin,
  } = useDataSourceMapping();

  // Phase 3: 온톨로지 강화 AI 추론
  const {
    loading: isInferring,
    lastResult,
    ontologyContext,
    infer,
    inferWithOntology,
    loadOntologyContext,
  } = useEnhancedAIInference();

  // Phase 4: 히스토리
  const {
    history,
    saveToHistory,
  } = useSimulationHistory();

  // ✅ 레이아웃 적용 Hook
  const { 
    isApplying, 
    applyLayoutChanges, 
    revertLayoutChanges 
  } = useLayoutApply();

  // 상태
  const [useOntologyMode, setUseOntologyMode] = useState(true);
  const [ontologyLoaded, setOntologyLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'history' | 'insights'>('simulation');
  const [autoSave, setAutoSave] = useState(true);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Simulation Hub v2.5',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  // 온톨로지 컨텍스트 자동 로드
  useEffect(() => {
    if (selectedStore?.id && useOntologyMode && !ontologyLoaded) {
      loadOntologyContext().then((context) => {
        if (context) {
          setOntologyLoaded(true);
          toast.success(`온톨로지: ${context.entities.total}개 엔티티, ${context.relations.total}개 관계`);
        }
      });
    }
  }, [selectedStore?.id, useOntologyMode, ontologyLoaded, loadOntologyContext]);

  useEffect(() => {
    setOntologyLoaded(false);
  }, [selectedStore?.id]);

  // ✅ 데이터 품질 평가 함수
  const evaluateDataQuality = useCallback((): DataQualityStatus => {
    if (!contextData) {
      return {
        hasProducts: false,
        hasInventory: false,
        hasKpis: false,
        hasEntities: false,
        productCount: 0,
        inventoryCount: 0,
        kpiDays: 0,
        entityCount: 0,
        overallScore: 0,
        level: 'none',
        message: '매장을 선택하면 데이터를 분석합니다.',
        canRunSimulation: false,
        recommendations: ['매장을 선택해주세요.'],
      };
    }

    const productCount = contextData.products?.length || 0;
    const inventoryCount = contextData.inventory?.length || 0;
    const kpiDays = contextData.recentKpis?.length || 0;
    const entityCount = contextData.entities?.length || 0;

    const hasProducts = productCount >= 5;
    const hasInventory = inventoryCount >= 5;
    const hasKpis = kpiDays >= 7;
    const hasEntities = entityCount >= 3;

    let score = 0;
    if (productCount >= 10) score += 25;
    else if (productCount >= 5) score += 15;
    else if (productCount >= 1) score += 5;

    if (inventoryCount >= 10) score += 25;
    else if (inventoryCount >= 5) score += 15;
    else if (inventoryCount >= 1) score += 5;

    if (kpiDays >= 30) score += 25;
    else if (kpiDays >= 14) score += 20;
    else if (kpiDays >= 7) score += 15;
    else if (kpiDays >= 1) score += 5;

    if (entityCount >= 10) score += 25;
    else if (entityCount >= 5) score += 15;
    else if (entityCount >= 3) score += 10;
    else if (entityCount >= 1) score += 5;

    let level: DataQualityStatus['level'];
    let message: string;
    
    if (score >= 80) {
      level = 'excellent';
      message = '데이터가 충분합니다. 모든 시뮬레이션을 실행할 수 있습니다.';
    } else if (score >= 60) {
      level = 'good';
      message = '대부분의 시뮬레이션을 실행할 수 있습니다.';
    } else if (score >= 40) {
      level = 'fair';
      message = '일부 시뮬레이션은 제한된 결과를 제공할 수 있습니다.';
    } else if (score >= 20) {
      level = 'poor';
      message = '데이터가 부족합니다. 더 많은 데이터를 추가해주세요.';
    } else {
      level = 'none';
      message = '시뮬레이션을 위한 데이터가 거의 없습니다.';
    }

    const recommendations: string[] = [];
    if (!hasProducts) recommendations.push(`상품 데이터를 추가해주세요 (현재 ${productCount}개, 최소 5개 필요)`);
    if (!hasInventory) recommendations.push(`재고 데이터를 추가해주세요 (현재 ${inventoryCount}개, 최소 5개 필요)`);
    if (!hasKpis) recommendations.push(`KPI 데이터를 추가해주세요 (현재 ${kpiDays}일, 최소 7일 필요)`);
    if (!hasEntities) recommendations.push(`매장 엔티티를 추가해주세요 (현재 ${entityCount}개, 최소 3개 필요)`);

    return {
      hasProducts,
      hasInventory,
      hasKpis,
      hasEntities,
      productCount,
      inventoryCount,
      kpiDays,
      entityCount,
      overallScore: score,
      level,
      message,
      canRunSimulation: score >= 20,
      recommendations,
    };
  }, [contextData]);

  // ✅ 시나리오별 실행 가능 여부 확인
  const canRunScenario = useCallback((scenario: SimulationScenario): { canRun: boolean; reason?: string } => {
    const dataQuality = evaluateDataQuality();
    const requirements = SCENARIO_REQUIREMENTS[scenario];

    if (!dataQuality.canRunSimulation) {
      return { canRun: false, reason: '데이터가 부족합니다.' };
    }

    if (requirements.minProducts && dataQuality.productCount < requirements.minProducts) {
      return { canRun: false, reason: `최소 ${requirements.minProducts}개의 상품 데이터가 필요합니다.` };
    }

    if (requirements.minInventory && dataQuality.inventoryCount < requirements.minInventory) {
      return { canRun: false, reason: `최소 ${requirements.minInventory}개의 재고 데이터가 필요합니다.` };
    }

    if (requirements.minKpiDays && dataQuality.kpiDays < requirements.minKpiDays) {
      return { canRun: false, reason: `최소 ${requirements.minKpiDays}일의 KPI 데이터가 필요합니다.` };
    }

    if (requirements.minEntities && dataQuality.entityCount < requirements.minEntities) {
      return { canRun: false, reason: `최소 ${requirements.minEntities}개의 매장 엔티티가 필요합니다.` };
    }

    return { canRun: true };
  }, [evaluateDataQuality]);

  const dataQuality = useMemo(() => evaluateDataQuality(), [evaluateDataQuality]);

  // AI 모델 선택 상태
  const [selectedScenarios, setSelectedScenarios] = useState<SimulationScenario[]>([
    'demand', 'inventory', 'pricing', 'layout', 'marketing'
  ]);
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);
  
  const scenarios: SimulationScenarioConfig[] = useMemo(() => {
    return defaultScenarios.map(scenario => {
      const { canRun, reason } = canRunScenario(scenario.id);
      return {
        ...scenario,
        enabled: canRun,
        disabledReason: reason,
      };
    });
  }, [canRunScenario]);

  // 시뮬레이션 결과 상태
  const [results, setResults] = useState<Record<SimulationScenario, any>>({
    demand: null, inventory: null, pricing: null, layout: null, marketing: null,
  });
  
  const [resultMeta, setResultMeta] = useState<Record<SimulationScenario, SimulationResultMeta & { appliedAt?: string }>>({
    demand: { status: 'idle' }, inventory: { status: 'idle' }, pricing: { status: 'idle' },
    layout: { status: 'idle' }, marketing: { status: 'idle' },
  });

  const [loadingStates, setLoadingStates] = useState<Record<SimulationScenario, boolean>>({
    demand: false, inventory: false, pricing: false, layout: false, marketing: false,
  });

  // 핸들러
  const handleScenarioToggle = useCallback((scenario: SimulationScenario) => {
    setSelectedScenarios(prev => 
      prev.includes(scenario) ? prev.filter(s => s !== scenario) : [...prev, scenario]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedScenarios(scenarios.filter(s => s.enabled).map(s => s.id));
  }, [scenarios]);

  const handleDeselectAll = useCallback(() => {
    setSelectedScenarios([]);
  }, []);

  const handleParameterChange = useCallback((params: Partial<SimulationParameters>) => {
    setParameters(prev => ({ ...prev, ...params }));
  }, []);

  // ✅ 실제 데이터를 포함한 Store Context 빌드
  const buildStoreContext = useCallback(() => {
    if (!contextData) {
      return {
        storeInfo: selectedStore ? {
          id: selectedStore.id,
          name: selectedStore.store_name,
          code: selectedStore.store_code,
        } : null,
        products: [],
        inventory: [],
        recentKpis: [],
        entities: [],
        dataQuality: evaluateDataQuality(),
      };
    }

    const mappedEntities = (contextData.entities || []).map((e: any) => ({
      id: e.id,
      label: e.label,
      entityType: e.entityType || e.entity_type_name || 'unknown',
      entity_type_name: e.entity_type_name || e.entityType || 'unknown',
      model_3d_type: e.model_3d_type,
      properties: e.properties || {},
      position: e.model_3d_position || e.position || { x: 0, y: 0, z: 0 },
      rotation: e.model_3d_rotation || { x: 0, y: 0, z: 0 },
      scale: e.model_3d_scale || { x: 1, y: 1, z: 1 },
      model3dUrl: e.model_3d_url,
      dimensions: e.model_3d_dimensions,
    }));

    const furnitureCount = mappedEntities.filter((e: any) => 
      ['furniture', 'room', 'structure'].includes(e.model_3d_type) ||
      ['Shelf', 'Rack', 'DisplayTable', 'CheckoutCounter', 'FittingRoom', 'Entrance'].includes(e.entity_type_name)
    ).length;
    
    console.log('buildStoreContext - entities:', mappedEntities.length, 'furniture:', furnitureCount);

    return {
      storeInfo: contextData.storeInfo || (selectedStore ? {
        id: selectedStore.id,
        name: selectedStore.store_name,
        code: selectedStore.store_code,
        areaSqm: contextData.storeInfo?.areaSqm,
      } : null),
      products: contextData.products || [],
      inventory: contextData.inventory || [],
      recentKpis: contextData.recentKpis || [],
      entities: mappedEntities,
      dataQuality: evaluateDataQuality(),
      mappingStatus,
    };
  }, [selectedStore, contextData, mappingStatus, evaluateDataQuality]);

  // ✅ 시뮬레이션 실행
  const runSimulation = useCallback(async (type: SimulationScenario) => {
    const { canRun, reason } = canRunScenario(type);
    if (!canRun) {
      toast.error(reason || '데이터가 부족하여 시뮬레이션을 실행할 수 없습니다.');
      setResultMeta(prev => ({
        ...prev,
        [type]: { status: 'error', errorMessage: reason || '데이터 부족' }
      }));
      return;
    }

    if (!selectedStore) {
      toast.error('매장을 선택해주세요.');
      return;
    }

    const startTime = Date.now();
    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setResultMeta(prev => ({ ...prev, [type]: { status: 'loading' } }));

    try {
      const storeContext = buildStoreContext();
      
      console.log('=== runSimulation Debug ===');
      console.log('type:', type);
      console.log('storeContext.entities:', storeContext.entities?.length);
      console.log('storeContext.storeInfo:', storeContext.storeInfo);
      
      const inferFn = useOntologyMode ? inferWithOntology : infer;
      
      const result = await inferFn(type, {
        dataRange: parameters.dataRange,
        forecastPeriod: parameters.forecastPeriod,
        confidenceLevel: parameters.confidenceLevel,
        includeSeasonality: parameters.includeSeasonality,
        includeExternalFactors: parameters.includeExternalFactors,
        dataQualityScore: dataQuality.overallScore,
        dataQualityLevel: dataQuality.level,
      }, storeContext);
      
      if (result) {
        if (type === 'layout') {
          console.log('=== Layout Simulation Result ===');
          console.log('result keys:', Object.keys(result));
          console.log('layoutChanges:', result.layoutChanges);
          console.log('asIsRecipe:', result.asIsRecipe);
          console.log('toBeRecipe:', result.toBeRecipe);
        }
  
        setResults(prev => ({ ...prev, [type]: result }));
        setResultMeta(prev => ({
          ...prev,
          [type]: {
            status: 'success',
            executedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            confidenceScore: result.confidenceScore || parameters.confidenceLevel,
            dataQuality: dataQuality.level,
          }
        }));
        
        if (autoSave) {
          await saveToHistory(type, parameters, result);
        }
        
        toast.success(`${getSimulationTitle(type)} 완료`);
      }
    } catch (error) {
      console.error(`${type} simulation error:`, error);
      setResultMeta(prev => ({
        ...prev,
        [type]: { status: 'error', errorMessage: error instanceof Error ? error.message : '오류 발생' }
      }));
      toast.error(`${getSimulationTitle(type)} 실패`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  }, [selectedStore, canRunScenario, parameters, useOntologyMode, infer, inferWithOntology, buildStoreContext, autoSave, saveToHistory, dataQuality]);

  const runAllSimulations = useCallback(async () => {
    const runnableScenarios = selectedScenarios.filter(s => canRunScenario(s).canRun);
    
    if (runnableScenarios.length === 0) {
      toast.error('실행 가능한 시나리오가 없습니다. 데이터를 추가해주세요.');
      return;
    }

    if (runnableScenarios.length < selectedScenarios.length) {
      toast.warning(`${selectedScenarios.length - runnableScenarios.length}개 시나리오는 데이터 부족으로 건너뜁니다.`);
    }

    toast.info(`${runnableScenarios.length}개 시뮬레이션 시작...`);
    await Promise.all(runnableScenarios.map(type => runSimulation(type)));
    toast.success('시뮬레이션 완료');
  }, [selectedScenarios, canRunScenario, runSimulation]);

  // ✅ 레이아웃 추천 적용 핸들러
  const handleApplyLayoutSuggestion = useCallback(async () => {
    if (!results.layout?.layoutChanges || results.layout.layoutChanges.length === 0) {
      toast.warning('적용할 변경사항이 없습니다.');
      return;
    }

    const confirmed = window.confirm(
      `${results.layout.layoutChanges.length}개의 가구 위치를 변경하시겠습니까?\n\n` +
      `이 작업은 디지털트윈 3D에도 반영됩니다.`
    );

    if (!confirmed) return;

    const result = await applyLayoutChanges(results.layout.layoutChanges, {
      createSnapshot: true,
      storeId: selectedStore?.id,
    });

    if (result.success) {
      setResultMeta(prev => ({
        ...prev,
        layout: {
          ...prev.layout,
          appliedAt: new Date().toISOString(),
        }
      }));
    }
  }, [results.layout, applyLayoutChanges, selectedStore?.id]);

  // 내보내기
  const handleExport = useCallback(async (type: SimulationScenario, format: 'csv' | 'pdf' | 'json') => {
    const result = results[type];
    if (!result) { toast.error('결과 없음'); return; }
    await exportSimulationResult(type, result, format);
  }, [results]);

  // 수동 저장
  const handleManualSave = useCallback(async (type: SimulationScenario) => {
    const result = results[type];
    if (!result) { toast.error('저장할 결과 없음'); return; }
    await saveToHistory(type, parameters, result);
  }, [results, parameters, saveToHistory]);

  const getSimulationTitle = (type: string) => {
    const titles: Record<string, string> = {
      demand: '수요 예측', layout: '레이아웃 최적화', inventory: '재고 최적화',
      pricing: '가격 최적화', marketing: '마케팅 전략',
    };
    return titles[type] || type;
  };

  const getQualityBadgeVariant = (level: DataQualityStatus['level']) => {
    switch (level) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  const getQualityIcon = (level: DataQualityStatus['level']) => {
    switch (level) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'good': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              시뮬레이션 허브
              {useOntologyMode && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Network className="h-3 w-3" />
                  온톨로지
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              지식 그래프 기반 AI 추론으로 매장 운영 최적화
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoSave ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoSave(!autoSave)}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {autoSave ? '자동저장' : '수동저장'}
            </Button>
            <Button
              variant={useOntologyMode ? "default" : "outline"}
              size="sm"
              onClick={() => setUseOntologyMode(!useOntologyMode)}
              className="gap-1"
            >
              <Brain className="h-4 w-4" />
              온톨로지 {useOntologyMode ? 'ON' : 'OFF'}
            </Button>
            {isAdmin && (
              <Badge variant="outline" className="gap-1">
                <Info className="h-3 w-3" />
                관리자
              </Badge>
            )}
          </div>
        </div>

        {/* 데이터 품질 상태 표시 */}
        {selectedStore && (
          <Alert className={`
            ${dataQuality.level === 'excellent' ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : ''}
            ${dataQuality.level === 'good' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' : ''}
            ${dataQuality.level === 'fair' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20' : ''}
            ${dataQuality.level === 'poor' ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20' : ''}
            ${dataQuality.level === 'none' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' : ''}
          `}>
            <Database className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              데이터 현황
              <Badge variant={getQualityBadgeVariant(dataQuality.level)} className="gap-1">
                {getQualityIcon(dataQuality.level)}
                {dataQuality.overallScore}점
              </Badge>
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <p>{dataQuality.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Package className="h-3 w-3" />
                    상품 {dataQuality.productCount}개
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    재고 {dataQuality.inventoryCount}개
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    KPI {dataQuality.kpiDays}일
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Grid3x3 className="h-3 w-3" />
                    엔티티 {dataQuality.entityCount}개
                  </Badge>
                </div>
                {dataQuality.recommendations.length > 0 && dataQuality.level !== 'excellent' && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <strong>권장사항:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {dataQuality.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 🆕 통합 데이터 분석 섹션 */}
        {selectedStore && contextData && (
          <IntegratedDataAnalysis
            contextData={contextData}
            loading={contextLoading}
            onRefresh={() => {
              toast.info('데이터를 새로고침합니다...');
            }}
          />
        )}

        {/* 🆕 ROI 결과 카드 추가 - 여기! */}
        {selectedStore && (
          <ROIResultCard 
            storeId={selectedStore.id} 
            limit={3}
            showHeader={true}
          />
        )}

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="simulation" className="gap-2">
              <Sparkles className="h-4 w-4" />
              시뮬레이션
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              히스토리
              {history.length > 0 && <Badge variant="secondary">{history.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              온톨로지 분석
            </TabsTrigger>
          </TabsList>

          {/* 시뮬레이션 탭 */}
          <TabsContent value="simulation" className="space-y-6 mt-6">
            {useOntologyMode && ontologyContext && (
              <Alert className="bg-primary/5 border-primary/20">
                <Network className="h-4 w-4" />
                <AlertDescription>
                  <strong>지식 그래프:</strong> {ontologyContext.entities.total}개 엔티티, {ontologyContext.relations.total}개 관계, {ontologyContext.patterns.frequentPairs.length}개 패턴
                </AlertDescription>
              </Alert>
            )}

            {!selectedStore && (
              <Alert>
                <AlertDescription>매장을 선택하면 AI가 데이터를 분석합니다.</AlertDescription>
              </Alert>
            )}

            {contextLoading && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  매장 데이터를 불러오는 중입니다...
                </AlertDescription>
              </Alert>
            )}

            <DataSourceMappingCard
              importedData={importedData}
              presetApis={presetApis}
              customApis={customApis}
              mappingStatus={mappingStatus}
              isAdmin={isAdmin}
              onRefresh={refreshMapping}
              onConnectApi={(apiId) => connectApi({ type: 'custom', name: apiId })}
              onDisconnectApi={disconnectApi}
              onConfigureApi={(apiId) => configurePresetApi(apiId, true)}
              isLoading={dataSourcesLoading}
            />

            <AIModelSelector
              scenarios={scenarios}
              selectedScenarios={selectedScenarios}
              parameters={parameters}
              onScenarioToggle={handleScenarioToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onParameterChange={handleParameterChange}
              onRunSimulation={runAllSimulations}
              isRunning={Object.values(loadingStates).some(v => v) || isInferring}
              disabled={!selectedStore || !dataQuality.canRunSimulation}
            />

            {/* 레이아웃 최적화 - As-Is / To-Be 비교 */}
            <SimulationResultCard
              type="layout" title="레이아웃 최적화" description="AI 가구 배치 최적화"
              icon={Grid3x3} color="cyan"
              isLoading={loadingStates.layout} hasResult={!!results.layout} meta={resultMeta.layout}
              onRefresh={() => runSimulation('layout')}
              onExport={(format) => handleExport('layout', format)}
              onSave={() => handleManualSave('layout')}
              fullWidth minHeight="500px"
            >
              {results.layout && (
                <div className="space-y-4">
                  {/* As-Is / To-Be 비교 뷰 */}
                  {results.layout.layoutChanges && Array.isArray(results.layout.layoutChanges) && results.layout.layoutChanges.length > 0 ? (
                    <LayoutComparisonView
                      currentRecipe={results.layout.asIsRecipe}
                      suggestedRecipe={results.layout.toBeRecipe}
                      changes={results.layout.layoutChanges}
                      optimizationSummary={results.layout.optimizationSummary}
                      onApplySuggestion={handleApplyLayoutSuggestion}
                      isApplying={isApplying}
                    />
                  ) : results.layout.sceneRecipe ? (
                    <div className="h-[400px] rounded-lg border overflow-hidden">
                      <SharedDigitalTwinScene overlayType="layout" layoutSimulationData={results.layout.sceneRecipe} />
                    </div>
                  ) : null}

                  {/* AI 인사이트 */}
                  {(() => {
                    const insights = results.layout.aiInsights;
                    if (insights && Array.isArray(insights) && insights.length > 0) {
                      return (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            AI 인사이트
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {insights.map((insight: string, idx: number) => (
                              <li key={idx}>• {String(insight)}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 추천 사항 */}
                  {(() => {
                    const recs = results.layout.recommendations;
                    if (recs && Array.isArray(recs) && recs.length > 0) {
                      return (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium text-sm mb-2">추천 사항</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {recs.map((rec: string, idx: number) => (
                              <li key={idx}>• {String(rec)}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* 온톨로지 인사이트 */}
                  {results.layout.ontologyBasedInsights && (
                    <OntologyInsightChart insights={results.layout.ontologyBasedInsights} compact />
                  )}

                  {/* 적용 완료 표시 */}
                  {resultMeta.layout?.appliedAt && (
                    <div className="p-2 bg-green-100 rounded text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      적용 완료: {new Date(resultMeta.layout.appliedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </SimulationResultCard>

            {/* 4개 그리드 */}
            <SimulationResultGrid columns={2}>
              {/* 수요 예측 */}
              <SimulationResultCard
                type="demand" title="수요 예측" description={`${parameters.dataRange}일→${parameters.forecastPeriod}일`}
                icon={TrendingUp} color="blue"
                isLoading={loadingStates.demand} hasResult={!!results.demand} meta={resultMeta.demand}
                onRefresh={() => runSimulation('demand')}
                onExport={(format) => handleExport('demand', format)}
                onSave={() => handleManualSave('demand')}
              >
                {results.demand && (
                  <>
                    <DemandForecastResult 
                      forecastData={results.demand.demandForecast?.forecastData}
                      summary={results.demand.demandForecast?.summary}
                      demandDrivers={results.demand.demandDrivers}
                      topProducts={results.demand.topProducts}
                      recommendations={results.demand.recommendations}
                    />
                    {results.demand.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.demand.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              {/* 재고 최적화 */}
              <SimulationResultCard
                type="inventory" title="재고 최적화" description="최적 재고 수준"
                icon={Package} color="green"
                isLoading={loadingStates.inventory} hasResult={!!results.inventory} meta={resultMeta.inventory}
                onRefresh={() => runSimulation('inventory')}
                onExport={(format) => handleExport('inventory', format)}
                onSave={() => handleManualSave('inventory')}
              >
                {results.inventory && (
                  <>
                    <InventoryOptimizationResult 
                      recommendations={results.inventory.inventoryOptimization?.recommendations || results.inventory.recommendations || []}
                      summary={results.inventory.inventoryOptimization?.summary || results.inventory.summary || {}}
                      textRecommendations={results.inventory.recommendations}
                    />
                    {results.inventory.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.inventory.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              {/* 가격 최적화 */}
              <SimulationResultCard
                type="pricing" title="가격 최적화" description="최적 가격 전략"
                icon={DollarSign} color="yellow"
                isLoading={loadingStates.pricing} hasResult={!!results.pricing} meta={resultMeta.pricing}
                onRefresh={() => runSimulation('pricing')}
                onExport={(format) => handleExport('pricing', format)}
                onSave={() => handleManualSave('pricing')}
              >
                {results.pricing && (
                  <>
                    <PricingOptimizationResult 
                      recommendations={results.pricing.pricingOptimization?.recommendations || results.pricing.recommendations || []}
                      summary={results.pricing.pricingOptimization?.summary || results.pricing.summary || {}}
                      textRecommendations={results.pricing.recommendations}
                    />
                    {results.pricing.ontologyBasedStrategies && (
                      <OntologyInsightChart insights={results.pricing.ontologyBasedStrategies} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              {/* 마케팅 전략 */}
              <SimulationResultCard
                type="marketing" title="마케팅 전략" description="개인화 마케팅"
                icon={Target} color="purple"
                isLoading={loadingStates.marketing} hasResult={!!results.marketing} meta={resultMeta.marketing}
                onRefresh={() => runSimulation('marketing')}
                onExport={(format) => handleExport('marketing', format)}
                onSave={() => handleManualSave('marketing')}
              >
                {results.marketing && (
                  <>
                    <RecommendationStrategyResult 
                      strategies={results.marketing.recommendationStrategy?.strategies || results.marketing.strategies || []}
                      summary={results.marketing.recommendationStrategy?.summary || results.marketing.summary || {}}
                      performanceMetrics={results.marketing.performanceMetrics || []}
                      recommendations={results.marketing.recommendations}
                    />
                    {results.marketing.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.marketing.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>
            </SimulationResultGrid>
          </TabsContent>

          {/* 히스토리 탭 */}
          <TabsContent value="history" className="mt-6">
            <SimulationHistoryPanel
              onSelectResult={(result) => toast.info('시뮬레이션 탭에서 확인하세요')}
            />
          </TabsContent>

          {/* 온톨로지 분석 탭 */}
          <TabsContent value="insights" className="mt-6">
            {ontologyContext ? (
              <OntologyInsightChart
                ontologyContext={ontologyContext}
                insights={lastResult?.ontologyBasedInsights}
              />
            ) : (
              <Alert>
                <Network className="h-4 w-4" />
                <AlertDescription>
                  온톨로지 모드를 활성화하고 매장을 선택하세요.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
