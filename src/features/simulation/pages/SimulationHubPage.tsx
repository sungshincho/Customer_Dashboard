import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Grid3x3, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Package, 
  RefreshCw, 
  Loader2,
  Info
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { useAIInference, useStoreContext } from '../hooks';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { DemandForecastResult } from '../components/DemandForecastResult';
import { InventoryOptimizationResult } from '../components/InventoryOptimizationResult';
import { PricingOptimizationResult } from '../components/PricingOptimizationResult';
import { RecommendationStrategyResult } from '../components/RecommendationStrategyResult';
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

// 새로운 컴포넌트들
import { 
  DataSourceMappingCard, 
  type ImportedDataSource,
  type PresetApiSource,
  type CustomApiSource,
  type OntologyMappingStatus
} from '../components/DataSourceMappingCard';
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

/**
 * SimulationHubPage v2
 * 
 * 고도화된 시뮬레이션 허브
 * - 데이터 소스 매핑 UI
 * - AI 모델 선택 UI
 * - 온톨로지 기반 추론
 * - 개선된 결과 시각화
 */
export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { infer, loading: isInferring } = useAIInference();
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id);

  // 관리자 여부 (NEURALTWIN master 계정)
  const isAdmin = user?.email?.includes('@neuraltwin') || user?.email?.includes('admin');

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Simulation Hub v2',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  // ===== 데이터 소스 상태 =====
  const [dataSourcesLoading, setDataSourcesLoading] = useState(false);
  
  // 임포트된 데이터 (contextData에서 파생)
  const importedData: ImportedDataSource[] = useMemo(() => {
    if (!contextData) return [];
    
    return [
      {
        id: 'products',
        name: '상품 데이터',
        table: 'products',
        recordCount: contextData.products.length,
        lastUpdated: new Date().toISOString(),
        status: contextData.products.length > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Product',
      },
      {
        id: 'inventory',
        name: '재고 데이터',
        table: 'inventory_levels',
        recordCount: contextData.inventory.length,
        lastUpdated: new Date().toISOString(),
        status: contextData.inventory.length > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'InventoryLevel',
      },
      {
        id: 'kpis',
        name: 'KPI 데이터',
        table: 'dashboard_kpis',
        recordCount: contextData.recentKpis.length,
        lastUpdated: new Date().toISOString(),
        status: contextData.recentKpis.length > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'DailyKPI',
      },
      {
        id: 'entities',
        name: '온톨로지 엔티티',
        table: 'graph_entities',
        recordCount: contextData.entities.length,
        lastUpdated: new Date().toISOString(),
        status: contextData.entities.length > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Entity',
      },
    ];
  }, [contextData]);

  // 프리셋 API (추후 확장)
  const presetApis: PresetApiSource[] = useMemo(() => [
    {
      id: 'weather',
      name: '날씨 API',
      description: '기상청 날씨 데이터',
      provider: 'OpenWeather',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'economic',
      name: '경제지표 API',
      description: '소비자물가지수, 경기동행지수 등',
      provider: 'KOSIS',
      enabled: false,
      adminOnly: true,
    },
    {
      id: 'holidays',
      name: '공휴일 API',
      description: '공휴일 및 특별 기념일',
      provider: '공공데이터포털',
      enabled: false,
      adminOnly: true,
    },
  ], []);

  // 고객 연동 API (추후 확장)
  const [customApis, setCustomApis] = useState<CustomApiSource[]>([]);

  // 온톨로지 매핑 상태
  const mappingStatus: OntologyMappingStatus = useMemo(() => {
    const totalEntities = contextData?.entities.length || 0;
    const mappedEntities = importedData.filter(d => d.mappedToOntology).length;
    const unmappedFields: string[] = [];
    
    // 미매핑 필드 체크
    if (!contextData?.products.length) unmappedFields.push('products');
    if (!contextData?.inventory.length) unmappedFields.push('inventory');
    if (!contextData?.recentKpis.length) unmappedFields.push('kpis');
    
    const healthScore = contextData 
      ? Math.round(((4 - unmappedFields.length) / 4) * 100)
      : 0;

    return {
      totalEntities,
      mappedEntities: mappedEntities,
      totalRelations: 0,  // TODO: 관계 수 계산
      unmappedFields,
      healthScore,
    };
  }, [contextData, importedData]);

  // ===== AI 모델 선택 상태 =====
  const [selectedScenarios, setSelectedScenarios] = useState<SimulationScenario[]>([
    'demand', 'inventory', 'pricing', 'layout', 'marketing'
  ]);
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);
  
  // 시나리오 설정 (데이터 유무에 따라 enabled 결정)
  const scenarios: SimulationScenarioConfig[] = useMemo(() => {
    return defaultScenarios.map(scenario => ({
      ...scenario,
      enabled: mappingStatus.healthScore >= 25,  // 최소 25% 이상 매핑되어야 활성화
    }));
  }, [mappingStatus.healthScore]);

  // ===== 시뮬레이션 결과 상태 =====
  const [results, setResults] = useState<Record<SimulationScenario, any>>({
    demand: null,
    inventory: null,
    pricing: null,
    layout: null,
    marketing: null,
  });
  
  const [resultMeta, setResultMeta] = useState<Record<SimulationScenario, SimulationResultMeta>>({
    demand: { status: 'idle' },
    inventory: { status: 'idle' },
    pricing: { status: 'idle' },
    layout: { status: 'idle' },
    marketing: { status: 'idle' },
  });

  const [loadingStates, setLoadingStates] = useState<Record<SimulationScenario, boolean>>({
    demand: false,
    inventory: false,
    pricing: false,
    layout: false,
    marketing: false,
  });

  // ===== 핸들러 =====
  const handleScenarioToggle = useCallback((scenario: SimulationScenario) => {
    setSelectedScenarios(prev => 
      prev.includes(scenario)
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
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

  const handleRefreshDataSources = useCallback(() => {
    setDataSourcesLoading(true);
    // contextData가 자동으로 리페치됨 (useStoreContext)
    setTimeout(() => setDataSourcesLoading(false), 1000);
  }, []);

  // 단일 시뮬레이션 실행
  const runSimulation = useCallback(async (type: SimulationScenario) => {
    if (!selectedStore || !contextData) {
      toast.error('매장 데이터를 불러오는 중입니다');
      return;
    }

    const startTime = Date.now();
    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setResultMeta(prev => ({ 
      ...prev, 
      [type]: { status: 'loading' } 
    }));

    try {
      const result = await infer(type, {
        dataRange: parameters.dataRange,
        forecastPeriod: parameters.forecastPeriod,
        confidenceLevel: parameters.confidenceLevel,
        includeSeasonality: parameters.includeSeasonality,
        includeExternalFactors: parameters.includeExternalFactors,
      }, selectedStore.id, contextData);
      
      if (result) {
        setResults(prev => ({ ...prev, [type]: result }));
        setResultMeta(prev => ({
          ...prev,
          [type]: {
            status: 'success',
            executedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            dataPointsAnalyzed: contextData.recentKpis.length + contextData.products.length,
            confidenceScore: parameters.confidenceLevel,
          }
        }));
        
        // Activity logging
        logActivity('feature_use', {
          feature: 'simulation_run',
          simulation_type: type,
          store_id: selectedStore.id,
          store_name: selectedStore.store_name,
          parameters,
          timestamp: new Date().toISOString()
        });
        
        toast.success(`${getSimulationTitle(type)} 완료`);
      }
    } catch (error) {
      console.error(`${type} simulation error:`, error);
      setResultMeta(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        }
      }));
      toast.error(`${getSimulationTitle(type)} 실패`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  }, [selectedStore, contextData, parameters, infer, logActivity]);

  // 선택된 시뮬레이션 전체 실행
  const runAllSimulations = useCallback(async () => {
    if (!selectedStore || !contextData) {
      toast.error('매장을 선택하고 데이터를 불러온 후 시도하세요');
      return;
    }

    if (selectedScenarios.length === 0) {
      toast.error('최소 1개 이상의 시나리오를 선택하세요');
      return;
    }

    toast.info(`${selectedScenarios.length}개 시뮬레이션을 시작합니다...`);
    
    await Promise.all(
      selectedScenarios.map(type => runSimulation(type))
    );

    toast.success('모든 시뮬레이션이 완료되었습니다');
  }, [selectedStore, contextData, selectedScenarios, runSimulation]);

  // 내보내기 핸들러
  const handleExport = useCallback((type: SimulationScenario, format: 'csv' | 'pdf' | 'json') => {
    const result = results[type];
    if (!result) return;

    // TODO: 실제 내보내기 로직 구현
    toast.info(`${getSimulationTitle(type)} 결과를 ${format.toUpperCase()}로 내보내는 중...`);
    
    logActivity('feature_use', {
      feature: 'simulation_export',
      simulation_type: type,
      format,
      timestamp: new Date().toISOString()
    });
  }, [results, logActivity]);

  const getSimulationTitle = (type: string) => {
    const titles: Record<string, string> = {
      demand: '수요 예측',
      layout: '레이아웃 최적화',
      inventory: '재고 최적화',
      pricing: '가격 최적화',
      marketing: '마케팅 전략',
    };
    return titles[type] || type;
  };

  // ===== 렌더링 =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              시뮬레이션 허브
            </h1>
            <p className="text-muted-foreground mt-2">
              온톨로지 기반 AI 추론으로 매장 운영을 최적화하세요
            </p>
          </div>
          {isAdmin && (
            <Badge variant="outline" className="gap-1">
              <Info className="h-3 w-3" />
              관리자 모드
            </Badge>
          )}
        </div>

        {/* 매장 미선택 경고 */}
        {!selectedStore && (
          <Alert>
            <AlertDescription>
              매장을 선택하면 AI가 자동으로 데이터를 분석하여 최적화 방안을 제안합니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 1. 데이터 소스 & 온톨로지 매핑 */}
        <DataSourceMappingCard
          importedData={importedData}
          presetApis={presetApis}
          customApis={customApis}
          mappingStatus={mappingStatus}
          isAdmin={isAdmin}
          onRefresh={handleRefreshDataSources}
          isLoading={contextLoading || dataSourcesLoading}
        />

        {/* 2. AI 모델 선택 */}
        <AIModelSelector
          scenarios={scenarios}
          selectedScenarios={selectedScenarios}
          parameters={parameters}
          onScenarioToggle={handleScenarioToggle}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onParameterChange={handleParameterChange}
          onRunSimulation={runAllSimulations}
          isRunning={Object.values(loadingStates).some(v => v)}
          disabled={!selectedStore || !contextData || mappingStatus.healthScore < 25}
        />

        {/* 3. 레이아웃 최적화 (전체 너비) */}
        <SimulationResultCard
          type="layout"
          title="레이아웃 최적화"
          description="고객 동선 분석을 통한 매장 공간 배치 최적화 제안"
          icon={Grid3x3}
          color="cyan"
          isLoading={loadingStates.layout}
          hasResult={!!results.layout}
          meta={resultMeta.layout}
          onRefresh={() => runSimulation('layout')}
          onExport={(format) => handleExport('layout', format)}
          fullWidth
          minHeight="400px"
        >
          {results.layout?.sceneRecipe && (
            <div className="h-[400px] rounded-lg border bg-muted/20 overflow-hidden">
              <SharedDigitalTwinScene
                overlayType="layout"
                layoutSimulationData={results.layout.sceneRecipe}
              />
            </div>
          )}
        </SimulationResultCard>

        {/* 4. 나머지 4개 시뮬레이션 - 2x2 그리드 */}
        <SimulationResultGrid columns={2}>
          {/* 수요 예측 */}
          <SimulationResultCard
            type="demand"
            title="향후 수요 예측"
            description={`과거 ${parameters.dataRange}일 데이터로 향후 ${parameters.forecastPeriod}일 수요 예측`}
            icon={TrendingUp}
            color="blue"
            isLoading={loadingStates.demand}
            hasResult={!!results.demand}
            meta={resultMeta.demand}
            onRefresh={() => runSimulation('demand')}
            onExport={(format) => handleExport('demand', format)}
          >
            {results.demand && (
              <DemandForecastResult 
                forecastData={results.demand.demandForecast?.forecastData}
                summary={results.demand.demandForecast?.summary}
                demandDrivers={results.demand.demandDrivers}
                topProducts={results.demand.topProducts}
                recommendations={results.demand.recommendations}
              />
            )}
          </SimulationResultCard>

          {/* 재고 최적화 */}
          <SimulationResultCard
            type="inventory"
            title="재고 최적화"
            description="현재 재고 분석 및 최적 재고 수준·발주 시점 제안"
            icon={Package}
            color="green"
            isLoading={loadingStates.inventory}
            hasResult={!!results.inventory}
            meta={resultMeta.inventory}
            onRefresh={() => runSimulation('inventory')}
            onExport={(format) => handleExport('inventory', format)}
          >
            {results.inventory && (
              <InventoryOptimizationResult 
                recommendations={results.inventory.recommendations}
                summary={results.inventory.summary}
              />
            )}
          </SimulationResultCard>

          {/* 가격 최적화 */}
          <SimulationResultCard
            type="pricing"
            title="가격 최적화"
            description="가격 탄력성 분석을 통한 최적 가격 전략 제안"
            icon={DollarSign}
            color="yellow"
            isLoading={loadingStates.pricing}
            hasResult={!!results.pricing}
            meta={resultMeta.pricing}
            onRefresh={() => runSimulation('pricing')}
            onExport={(format) => handleExport('pricing', format)}
          >
            {results.pricing && (
              <PricingOptimizationResult 
                recommendations={results.pricing.recommendations}
                summary={results.pricing.summary}
              />
            )}
          </SimulationResultCard>

          {/* 마케팅 전략 */}
          <SimulationResultCard
            type="marketing"
            title="추천 마케팅·프로모션 전략"
            description="고객 세그먼트 분석 기반 개인화 마케팅 전략 제안"
            icon={Target}
            color="purple"
            isLoading={loadingStates.marketing}
            hasResult={!!results.marketing}
            meta={resultMeta.marketing}
            onRefresh={() => runSimulation('marketing')}
            onExport={(format) => handleExport('marketing', format)}
          >
            {results.marketing && (
              <RecommendationStrategyResult 
                strategies={results.marketing.strategies}
                summary={results.marketing.summary}
                performanceMetrics={results.marketing.performanceMetrics}
              />
            )}
          </SimulationResultCard>
        </SimulationResultGrid>
      </div>
    </DashboardLayout>
  );
}
