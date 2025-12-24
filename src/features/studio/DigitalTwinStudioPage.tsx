/**
 * DigitalTwinStudioPage.tsx
 *
 * 디지털트윈 스튜디오 - 통합 3D 편집 + 시뮬레이션 + 분석
 * 드래그 가능 패널 시스템 + 시뮬레이션 결과 패널
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Sparkles, Layers, Save, Play, GitCompare, Pause, Square, RotateCcw, Users, FlaskConical, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// 새 스튜디오 컴포넌트
import { Canvas3D, SceneProvider, useScene } from './core';
import { LayerPanel, SimulationPanel, ToolPanel, SceneSavePanel, OverlayControlPanel, PropertyPanel } from './panels';
import { HeatmapOverlay, CustomerFlowOverlay, ZoneBoundaryOverlay, LayoutOptimizationOverlay, FlowOptimizationOverlay, CongestionOverlay, StaffingOverlay, ZonesFloorOverlay, StaffAvatarsOverlay, CustomerFlowOverlayEnhanced, StaffReallocationOverlay } from './overlays';
import { DraggablePanel, QuickToggleBar, ViewModeToggle, ResultReportPanel, type ViewMode } from './components';
import type { DiagnosticIssue } from './components/DiagnosticIssueList';
import { PanelLeftClose, PanelLeft, Mouse } from 'lucide-react';
import { AIOptimizationTab } from './tabs/AIOptimizationTab';
import { AISimulationTab } from './tabs/AISimulationTab';
import { ApplyPanel } from './tabs/ApplyPanel';
import {
  LayoutResultPanel,
  FlowResultPanel,
  CongestionResultPanel,
  StaffingResultPanel,
  type LayoutResult,
  type FlowResult,
  type CongestionResult,
  type StaffingResult,
} from './panels/results';
import { useStudioMode, useOverlayVisibility, useScenePersistence, useSceneSimulation, useStoreBounds, useStaffData } from './hooks';
import { loadUserModels } from './utils';
import type { StudioMode, Model3D, OverlayType, HeatPoint, ZoneBoundary, SceneRecipe, LightingPreset, Vector3, SimulationScenario, TransformMode, RenderingConfig } from './types';
import type { SimulationEnvironmentConfig } from './types/simulationEnvironment.types';
import { convertToRenderingConfig } from './types/simulationEnvironment.types';

// 기존 시뮬레이션 훅
import { useStoreContext } from '@/features/simulation/hooks/useStoreContext';
import { useEnhancedAIInference } from '@/features/simulation/hooks/useEnhancedAIInference';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSimulationStore, STATE_COLORS, STATE_LABELS, type CustomerState } from '@/stores/simulationStore';

// 타입 변환 헬퍼
interface ModelLayer {
  id: string;
  name: string;
  type: 'space' | 'furniture' | 'product' | 'custom' | 'other';
  model_url: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  dimensions?: { width: number; height: number; depth: number };
  metadata?: Record<string, any>;
}

type TabType = 'layer' | 'ai-simulation' | 'ai-optimization' | 'apply';

// 시뮬레이션 결과 상태 타입
interface SimulationResults {
  layout: LayoutResult | null;
  flow: FlowResult | null;
  congestion: CongestionResult | null;
  staffing: StaffingResult | null;
}

// 패널 표시 상태 타입
interface VisiblePanels {
  tools: boolean;
  sceneSave: boolean;
  property: boolean;
  resultReport: boolean; // 통합 결과 리포트
}

// ============================================================================
// 메인 페이지 컴포넌트
// ============================================================================
export default function DigitalTwinStudioPage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { getDays } = useDateFilterStore();

  // 모드 관리
  const { mode, setMode, isEditMode } = useStudioMode({ initialMode: 'view' });

  // 오버레이 관리
  const { activeOverlays, toggleOverlay, isActive } = useOverlayVisibility();

  // 씬 저장 관리
  const { scenes, activeScene, isSaving, saveScene, deleteScene, setActiveScene } =
    useScenePersistence({ userId: user?.id, storeId: selectedStore?.id });

  // 씬 기반 시뮬레이션 (As-is → To-be)
  const sceneSimulation = useSceneSimulation();

  // 매장 경계 및 입구 위치 (zones_dim 기반)
  const { storeBounds, entrancePosition, zonePositions, zoneSizes, zones: dbZones } = useStoreBounds();

  // 실제 DB 스태프 데이터
  const { staff: dbStaff, loading: staffLoading, error: staffError } = useStaffData({ storeId: selectedStore?.id });

  // 🆕 로그인된 계정의 스토어 ID
  const storeId = selectedStore?.id;

  // 스태프 데이터 디버깅
  useEffect(() => {
    const debugInfo = {
      selectedStoreId: selectedStore?.id,
      selectedStoreName: selectedStore?.store_name,
      expectedStoreId: 'd9830554-2688-4032-af40-acccda787ac4',
      idMatch: selectedStore?.id === 'd9830554-2688-4032-af40-acccda787ac4',
      staffCount: dbStaff?.length || 0,
      staffLoading,
      staffError: staffError?.message,
    };
    console.log('%c[DigitalTwinStudio] Staff Debug', 'background: yellow; color: black; font-size: 14px', debugInfo);

    // window에도 저장
    if (typeof window !== 'undefined') {
      (window as any).__studioDebug = debugInfo;
    }
  }, [selectedStore?.id, dbStaff, staffLoading, staffError]);

  // UI 상태
  const [activeTab, setActiveTab] = useState<TabType>('layer');
  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');

  // 패널 리사이즈 상태
  const PANEL_MIN_WIDTH = 280;
  const PANEL_MAX_WIDTH = 500;
  const PANEL_DEFAULT_WIDTH = 320;
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studio_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= PANEL_MIN_WIDTH && parsed <= PANEL_MAX_WIDTH) {
          return parsed;
        }
      }
    }
    return PANEL_DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // As-Is / To-Be / Split 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('as-is');

  // 드래그 패널 표시 상태
  const [visiblePanels, setVisiblePanels] = useState<VisiblePanels>({
    tools: false,
    sceneSave: true,
    property: true,
    resultReport: false, // 결과 있을 때만 자동 표시
  });

  // 시뮬레이션 결과 상태
  const [simulationResults, setSimulationResults] = useState<SimulationResults>({
    layout: null,
    flow: null,
    congestion: null,
    staffing: null,
  });

  // AI 시뮬레이션에서 발견된 진단 결과
  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);

  // 🆕 환경 효과 렌더링 설정 (날씨, 시간대 등)
  const [environmentRenderingConfig, setEnvironmentRenderingConfig] = useState<RenderingConfig | null>(null);

  // 🆕 시뮬레이션 환경 설정 원본 (AI 최적화에 전달용)
  const [simulationEnvConfig, setSimulationEnvConfig] = useState<SimulationEnvironmentConfig | null>(null);

  // 🆕 환경 설정 변경 핸들러
  const handleEnvironmentConfigChange = useCallback((config: SimulationEnvironmentConfig) => {
    console.log('[DigitalTwinStudio] Environment config changed:', {
      mode: config.mode,
      weather: config.manualSettings?.weather,
      autoLoadedWeather: config.autoLoadedData?.weather?.condition,
    });

    // 원본 설정 저장 (AI 최적화에서 사용)
    setSimulationEnvConfig(config);

    // 🔧 FIX: 날짜선택/직접설정 모드일 때 렌더링 설정 적용
    if (config.mode === 'dateSelect' || config.mode === 'manual') {
      const renderingConfig = convertToRenderingConfig(config);
      console.log('[DigitalTwinStudio] Setting rendering config:', {
        weatherCondition: renderingConfig.weatherCondition,
        particleType: renderingConfig.particles?.weatherParticles?.type,
        particleCount: renderingConfig.particles?.weatherParticles?.count,
        particleEnabled: renderingConfig.particles?.weatherParticles?.enabled,
      });
      setEnvironmentRenderingConfig(renderingConfig);
    } else {
      // 실시간 모드일 때는 기본 환경으로 리셋
      console.log('[DigitalTwinStudio] Realtime mode - clearing rendering config');
      setEnvironmentRenderingConfig(null);
    }
  }, []);

  // 시뮬레이션 데이터
  const days = getDays();
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id, days);
  const { loading: isInferring } = useEnhancedAIInference();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', {
      page: location.pathname,
      page_name: 'Digital Twin Studio (New)',
      mode,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, mode]);

  // 패널 너비 localStorage 저장
  useEffect(() => {
    if (!isPanelCollapsed) {
      localStorage.setItem('studio_panel_width', panelWidth.toString());
    }
  }, [panelWidth, isPanelCollapsed]);

  // 패널 리사이즈 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, newWidth)));
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth, PANEL_MAX_WIDTH, PANEL_MIN_WIDTH]);

  // 패널 접기/펼치기
  const togglePanelCollapse = useCallback(() => {
    setIsPanelCollapsed((prev) => !prev);
  }, []);

  // 모델 로드
  const loadModelsAsync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log('[DigitalTwinStudio] Loading models for user:', user.id, 'store:', selectedStore?.id);
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);

      // 🔍 DEBUG: 로드된 모델의 childProducts 확인
      const furnitureWithChildren = loadedModels.filter(
        m => m.type === 'furniture' && (m.metadata as any)?.childProducts?.length > 0
      );
      const totalChildProducts = furnitureWithChildren.reduce(
        (sum, m) => sum + ((m.metadata as any)?.childProducts?.length || 0),
        0
      );
      console.log('[DigitalTwinStudio] Loaded models:', {
        total: loadedModels.length,
        furniture: loadedModels.filter(m => m.type === 'furniture').length,
        products: loadedModels.filter(m => m.type === 'product').length,
        furnitureWithChildren: furnitureWithChildren.length,
        totalChildProducts,
      });

      setModels(loadedModels);
      if (loadedModels.length > 0) {
        setActiveLayers(loadedModels.map((m) => m.id));
      }
    } catch (error) {
      console.error('[DigitalTwinStudio] Error loading models:', error);
      toast.error('모델 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelsAsync();
  }, [user, selectedStore]);

  // 패널 닫기 핸들러
  const closePanel = useCallback((panelId: keyof VisiblePanels) => {
    setVisiblePanels((prev) => ({ ...prev, [panelId]: false }));
  }, []);

  // 시뮬레이션 완료 핸들러
  const handleSimulationComplete = useCallback((type: keyof SimulationResults, result: LayoutResult | FlowResult | CongestionResult | StaffingResult) => {
    setSimulationResults((prev) => ({ ...prev, [type]: result }));
    const panelKey = `${type}Result` as keyof VisiblePanels;
    setVisiblePanels((prev) => ({ ...prev, [panelKey]: true }));
  }, []);

  // 시뮬레이션 실행 핸들러
  const handleRunSimulation = useCallback((scenarios: SimulationScenario[]) => {
    toast.info(`시뮬레이션 실행: ${scenarios.join(', ')}`);

    // 각 시나리오별 Mock 결과 생성 (실제 구현시 API 연동)
    scenarios.forEach((scenario) => {
      setTimeout(() => {
        switch (scenario) {
          case 'layout':
            handleSimulationComplete('layout', {
              currentEfficiency: 72,
              optimizedEfficiency: 89,
              revenueIncrease: 2400000,
              dwellTimeIncrease: 8,
              conversionIncrease: 3.2,
              changes: [
                { item: '메인 테이블', from: 'A존 중앙', to: 'B존 입구', effect: '+15% 노출' },
                { item: '디스플레이', from: '벽면', to: '동선 교차점', effect: '+23% 체류' },
              ],
            });
            break;
          case 'flow':
            handleSimulationComplete('flow', {
              currentPathLength: 45,
              optimizedPathLength: 38,
              bottlenecks: [
                { location: '입구 → A존', congestion: 78, cause: '통로 폭 부족', suggestion: '진열대 이동' },
                { location: 'B존 중앙', congestion: 65, cause: '고객 체류', suggestion: '휴식 공간 추가' },
              ],
              improvements: [
                { metric: '평균 이동 시간', value: '-18%' },
                { metric: '병목 해소율', value: '85%' },
                { metric: '고객 만족도', value: '+12%' },
              ],
            });
            break;
          case 'congestion':
            handleSimulationComplete('congestion', {
              date: '2024-12-15 (일)',
              peakHours: '14:00 - 16:00',
              peakCongestion: 85,
              maxCapacity: 50,
              hourlyData: [
                { hour: '10:00', congestion: 25 },
                { hour: '12:00', congestion: 55 },
                { hour: '14:00', congestion: 85 },
                { hour: '16:00', congestion: 70 },
                { hour: '18:00', congestion: 45 },
                { hour: '20:00', congestion: 30 },
              ],
              zoneData: [
                { zone: '입구', congestion: 45 },
                { zone: 'A존', congestion: 85 },
                { zone: 'B존', congestion: 60 },
                { zone: '계산대', congestion: 75 },
              ],
              recommendations: [
                '14-16시 추가 인력 배치',
                'A존 진열대 간격 확대',
                '계산대 운영 효율화',
              ],
            });
            break;
          case 'staffing':
            handleSimulationComplete('staffing', {
              currentCoverage: 68,
              optimizedCoverage: 92,
              staffCount: 3,
              staffPositions: [
                { name: '직원 A', current: '입구', suggested: 'A존 중앙', coverageGain: '+12%' },
                { name: '직원 B', current: 'B존', suggested: 'A-B존 경계', coverageGain: '+8%' },
                { name: '직원 C', current: '계산대', suggested: '계산대', coverageGain: '유지' },
              ],
              improvements: [
                { metric: '고객 응대율', value: '+35%' },
                { metric: '대기 시간', value: '-25%' },
                { metric: '매출 효과', value: '+₩150만/월' },
              ],
            });
            break;
        }
      }, 1000 + Math.random() * 1000);
    });
  }, [handleSimulationComplete]);

  // SceneRecipe 생성 (handleRunAllSimulations보다 먼저 정의되어야 함)
  // SceneRecipe 생성 (handleRunAllSimulations에서 사용하므로 먼저 정의)
  const currentRecipe = useMemo<SceneRecipe | null>(() => {
    const activeModels = models.filter((m) => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;

    const spaceModel = activeModels.find((m) => m.type === 'space');
    if (!spaceModel) return null;

    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 5 } },
      ],
    };

    const furnitureList = activeModels
      .filter((m) => m.type === 'furniture')
      .map((m) => {
        const metaChildProducts = (m.metadata as any)?.childProducts;

        return {
          id: m.id,
          model_url: m.model_url,
          type: 'furniture' as const,
          furniture_type: m.name,
          position: m.position || { x: 0, y: 0, z: 0 },
          rotation: m.rotation || { x: 0, y: 0, z: 0 },
          scale: m.scale || { x: 1, y: 1, z: 1 },
          dimensions: m.dimensions,
          movable: true,
          metadata: m.metadata,
          // 🔧 FIX: 가구에 배치된 자식 제품들 (상대 좌표 사용)
          childProducts: metaChildProducts?.map((cp: any) => ({
            id: cp.id,
            type: 'product' as const,
            model_url: cp.model_url,
            position: cp.position || { x: 0, y: 0, z: 0 },
            rotation: cp.rotation || { x: 0, y: 0, z: 0 },
            scale: cp.scale || { x: 1, y: 1, z: 1 },
            sku: cp.name,
            display_type: cp.metadata?.displayType,
            dimensions: cp.dimensions,
            isRelativePosition: true,
            metadata: cp.metadata,
          })) || [],
        };
      });

    const productsList = activeModels
      .filter((m) => m.type === 'product')
      .map((m) => ({
        id: m.id,
        model_url: m.model_url,
        type: 'product' as const,
        product_id: m.metadata?.entityId,
        sku: m.name,
        position: m.position || { x: 0, y: 0, z: 0 },
        rotation: m.rotation || { x: 0, y: 0, z: 0 },
        scale: m.scale || { x: 1, y: 1, z: 1 },
        dimensions: m.dimensions,
        movable: true,
        metadata: m.metadata,
      }));

    // 🔍 DEBUG: currentRecipe의 childProducts 확인
    const totalChildProducts = furnitureList.reduce(
      (sum, f) => sum + ((f as any).childProducts?.length || 0),
      0
    );
    console.log('[DigitalTwinStudio] currentRecipe built:', {
      furnitureCount: furnitureList.length,
      productsCount: productsList.length,
      childProductsTotal: totalChildProducts,
      furnitureWithChildren: furnitureList.filter(f => (f as any).childProducts?.length > 0).length,
    });

    return {
      space: {
        id: spaceModel.id,
        model_url: spaceModel.model_url,
        type: 'space',
        position: spaceModel.position || { x: 0, y: 0, z: 0 },
        rotation: spaceModel.rotation || { x: 0, y: 0, z: 0 },
        scale: spaceModel.scale || { x: 1, y: 1, z: 1 },
        dimensions: spaceModel.dimensions,
        metadata: spaceModel.metadata,
      },
      furniture: furnitureList,
      products: productsList,
      lighting: lightingPreset,
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
    };
  }, [models, activeLayers]);

  // 전체 시뮬레이션 실행 (씬 기반 + 레거시 UI 결과)
  const handleRunAllSimulations = useCallback(async () => {
    setMode('simulate');

    // 레거시 UI 결과 패널용 (데모 데이터)
    handleRunSimulation(['layout', 'flow', 'congestion', 'staffing']);

    // 씬 기반 시뮬레이션도 함께 실행 (실제 모델 이동용)
    // currentRecipe를 직접 전달하여 state 동기화 문제 해결
    if (currentRecipe) {
      await sceneSimulation.runAllSimulations(
        {
          layout: { goal: 'revenue' },
          flow: { duration: '1hour', customerCount: 100 },
          staffing: { staffCount: 3, goal: 'customer_service' },
        },
        currentRecipe  // 씬 직접 전달
      );
    }
  }, [setMode, handleRunSimulation, currentRecipe, sceneSimulation]);

  // SceneProvider용 모델 변환
  // - DB(rotation_x/y/z)는 degree로 저장되어 있어 three.js에 전달 전 radians로 변환
  const sceneModels: Model3D[] = useMemo(() => {
    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    const result = models
      .filter((m) => activeLayers.includes(m.id))
      .map((m) => {
        const converted = {
          id: m.id,
          name: m.name,
          url: m.model_url,
          position: [m.position?.x || 0, m.position?.y || 0, m.position?.z || 0] as [number, number, number],
          rotation: [
            degToRad(m.rotation?.x || 0),
            degToRad(m.rotation?.y || 0),
            degToRad(m.rotation?.z || 0),
          ] as [number, number, number],
          scale: [m.scale?.x || 1, m.scale?.y || 1, m.scale?.z || 1] as [number, number, number],
          visible: true,
          type: m.type,
          metadata: m.metadata,
          dimensions: m.dimensions,
        };
        return converted;
      });

    // 🔍 DEBUG: sceneModels의 childProducts 확인
    const furnitureWithChildren = result.filter(
      m => m.type === 'furniture' && (m.metadata as any)?.childProducts?.length > 0
    );
    console.log('[DigitalTwinStudio] sceneModels built:', {
      total: result.length,
      furniture: result.filter(m => m.type === 'furniture').length,
      furnitureWithChildren: furnitureWithChildren.length,
      totalChildProducts: furnitureWithChildren.reduce(
        (sum, m) => sum + ((m.metadata as any)?.childProducts?.length || 0),
        0
      ),
    });

    return result;
  }, [models, activeLayers]);


  // As-is → To-be 씬 기반 시뮬레이션 실행
  const handleRunSceneSimulation = useCallback(async () => {
    if (!currentRecipe) {
      toast.error('씬을 먼저 구성해주세요');
      return;
    }

    // 씬 직접 전달하여 시뮬레이션 실행
    await sceneSimulation.runAllSimulations(
      {
        layout: { goal: 'revenue' },
        flow: { duration: '1hour', customerCount: 100 },
        staffing: { staffCount: 3, goal: 'customer_service' },
      },
      currentRecipe
    );

    // AI 시뮬레이션 탭으로 전환
    setActiveTab('ai-simulation');
    setMode('simulate');
  }, [currentRecipe, sceneSimulation, setMode]);

  // 데모 오버레이 데이터
  const demoHeatPoints: HeatPoint[] = useMemo(
    () => [
      { x: 0, y: 0, z: 0, intensity: 0.8 },
      { x: 3, y: 0, z: 2, intensity: 0.6 },
      { x: -2, y: 0, z: 3, intensity: 0.9 },
      { x: 4, y: 0, z: -2, intensity: 0.4 },
    ],
    []
  );

  // demoFlows 제거됨 - CustomerFlowOverlayEnhanced에서 DB 기반 데이터 사용

  const demoZones: ZoneBoundary[] = useMemo(
    () => [
      {
        id: 'zone-1',
        name: '입구',
        points: [
          [-6, 0, -3],
          [-6, 0, 3],
          [-3, 0, 3],
          [-3, 0, -3],
        ],
        color: '#3b82f6',
      },
      {
        id: 'zone-2',
        name: '디스플레이',
        points: [
          [-3, 0, -3],
          [-3, 0, 3],
          [3, 0, 3],
          [3, 0, -3],
        ],
        color: '#22c55e',
      },
      {
        id: 'zone-3',
        name: '계산대',
        points: [
          [3, 0, -3],
          [3, 0, 3],
          [6, 0, 3],
          [6, 0, -3],
        ],
        color: '#f59e0b',
      },
    ],
    []
  );

  // 🔧 FIX: zones_dim 데이터 기반 시뮬레이션 존 (DB 우선, 폴백으로 demoZones 사용)
  const simulationZones = useMemo(() => {
    // DB에서 로드한 zones_dim 데이터가 있으면 우선 사용
    if (dbZones && dbZones.length > 0) {
      console.log('[SimulationZones] Using DB zones:', dbZones.length, 'zones');
      return dbZones.map((zone) => ({
        id: zone.id,
        zone_name: zone.zone_name,
        x: zone.position_x || zone.coordinates?.x || 0,
        z: zone.position_z || zone.coordinates?.z || 0,
        width: zone.size_width || zone.coordinates?.width || 3,
        depth: zone.size_depth || zone.coordinates?.depth || 3,
        zone_type: zone.zone_type || 'display',
      }));
    }

    // 폴백: demoZones 사용 (DB 데이터가 없는 경우)
    console.log('[SimulationZones] Using demo zones (DB zones not available)');
    return demoZones.map((zone) => {
      // points 배열에서 x, z 범위 계산
      const xValues = zone.points.map((p) => p[0]);
      const zValues = zone.points.map((p) => p[2]);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minZ = Math.min(...zValues);
      const maxZ = Math.max(...zValues);

      // 중심점과 크기 계산
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const width = maxX - minX;
      const depth = maxZ - minZ;

      // zone_type 추론 (이름 기반)
      let zone_type = 'display';
      const nameLower = zone.name.toLowerCase();
      if (nameLower.includes('입구') || nameLower.includes('entry') || nameLower.includes('entrance')) {
        zone_type = 'entrance';
      } else if (nameLower.includes('출구') || nameLower.includes('exit')) {
        zone_type = 'exit';
      } else if (nameLower.includes('계산') || nameLower.includes('checkout') || nameLower.includes('register')) {
        zone_type = 'checkout';
      } else if (nameLower.includes('피팅') || nameLower.includes('fitting')) {
        zone_type = 'fitting';
      }

      return {
        id: zone.id,
        zone_name: zone.name,
        x: centerX,
        z: centerZ,
        width,
        depth,
        zone_type,
      };
    });
  }, [dbZones, demoZones]);

  // 씬 저장 핸들러
  const handleSaveScene = async (name: string) => {
    if (!currentRecipe) return;
    try {
      await saveScene(currentRecipe, name, activeScene?.id);
      setSceneName(name);
      logActivity('feature_use', {
        feature: 'scene_save',
        scene_name: name,
        layer_count: activeLayers.length,
        store_id: selectedStore?.id,
      });
    } catch (err) {
      // 에러는 useScenePersistence에서 처리
    }
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SceneProvider mode={mode} initialModels={sceneModels}>
        <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden bg-black rounded-lg">
          {/* ========== 3D 캔버스 (배경) ========== */}
          <div className="absolute inset-0 z-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : (
              <Canvas3D
                mode={mode}
                transformMode={transformMode}
                enableControls={true}
                enableSelection={isEditMode}
                enableTransform={isEditMode}
                showGrid={isEditMode}
                zones={simulationZones}
                userId={user?.id}
                storeId={selectedStore?.id}
                renderingConfig={environmentRenderingConfig}
              >
                {/* zones_dim 기반 구역 바닥 오버레이 (DB 데이터 우선) */}
                {isActive('zone') && dbZones && dbZones.length > 0 && (
                  <ZonesFloorOverlay
                    zones={dbZones}
                    visible={true}
                    showLabels={true}
                    opacity={0.3}
                  />
                )}
                {/* 폴백: DB 데이터 없으면 demoZones 사용 */}
                {isActive('zone') && (!dbZones || dbZones.length === 0) && (
                  <ZoneBoundaryOverlay zones={demoZones} />
                )}

                {/* 🔧 히트맵 오버레이 - zones_dim 기반 동적 히트맵 또는 데모 데이터 */}
                {isActive('heatmap') && (() => {
                  // 🔧 FIX: zones_dim 데이터가 있으면 존 기반 히트맵 생성
                  if (dbZones && dbZones.length > 0) {
                    const zoneHeatPoints: HeatPoint[] = dbZones.map((zone) => ({
                      x: zone.position_x || zone.coordinates?.x || 0,
                      y: 0.1,
                      z: zone.position_z || zone.coordinates?.z || 0,
                      intensity: zone.zone_type === 'checkout' ? 0.9
                        : zone.zone_type === 'entrance' ? 0.7
                        : zone.zone_type === 'fitting' ? 0.8
                        : zone.zone_type === 'display' ? 0.6
                        : 0.5,
                    }));
                    return <HeatmapOverlay heatPoints={zoneHeatPoints} />;
                  }
                  // 폴백: 데모 데이터
                  return <HeatmapOverlay heatPoints={demoHeatPoints} />;
                })()}

                {/* 🆕 개선된 동선 오버레이 (zone_transitions 기반) - DB 데이터 사용 */}
                {isActive('flow') && selectedStore?.id && (
                  <CustomerFlowOverlayEnhanced
                    visible={true}
                    storeId={selectedStore.id}
                    showLabels={true}
                    minOpacity={0.3}
                  />
                )}

                {/* 🆕 고객 시뮬레이션은 Canvas3D 내부 CustomerAgents에서 처리 */}
                {/* useSimulationEngine이 storeId 기반으로 zones_dim, zone_transitions 데이터 로드 */}

                {/* 스태프 오버레이 - 실제 DB 스태프 데이터 사용 */}
                {(() => {
                  const staffActive = isActive('staff');
                  const hasStaffData = dbStaff && dbStaff.length > 0;
                  console.log('[DigitalTwinStudio] Staff overlay render check:', {
                    staffActive,
                    hasStaffData,
                    staffCount: dbStaff?.length || 0,
                    zonePositions: Object.keys(zonePositions || {}).length,
                  });

                  if (staffActive && hasStaffData) {
                    // 스태프 위치가 (0,0,0)인 경우 zone 위치를 fallback으로 사용
                    const staffWithPositions = dbStaff.map((s, idx) => {
                      const pos = s.avatar_position;
                      const isZeroPosition = pos.x === 0 && pos.y === 0 && pos.z === 0;

                      if (isZeroPosition && s.zone_id && zonePositions[s.zone_id]) {
                        // zone 위치 기반 fallback
                        const zonePos = zonePositions[s.zone_id];
                        return {
                          ...s,
                          avatar_position: {
                            x: zonePos[0] + (idx % 3) * 1.5 - 1.5,
                            y: 0,
                            z: zonePos[2] + Math.floor(idx / 3) * 1.5 - 1.5,
                          },
                        };
                      } else if (isZeroPosition) {
                        // zone 없으면 그리드 배치
                        return {
                          ...s,
                          avatar_position: {
                            x: -5 + (idx % 4) * 3,
                            y: 0,
                            z: -3 + Math.floor(idx / 4) * 3,
                          },
                        };
                      }
                      return s;
                    });

                    console.log('[DigitalTwinStudio] Rendering staff with positions:', staffWithPositions);
                    return (
                      <StaffAvatarsOverlay
                        staff={staffWithPositions}
                        showLabels={true}
                        showRoles={true}
                      />
                    );
                  }
                  return null;
                })()}

                {/* 시뮬레이션 결과 스태프 오버레이 (최적화 결과가 있을 때) */}
                {isActive('staff') && sceneSimulation.state.results.staffing && (
                  <StaffingOverlay
                    result={sceneSimulation.state.results.staffing as any}
                    showStaffMarkers={true}
                    showCurrentPositions={false}
                    showSuggestedPositions={true}
                    showCoverageZones={false}
                    showMovementPaths={true}
                    animateMovement={true}
                  />
                )}

                {/* 시뮬레이션 결과 오버레이 (viewMode에 따라 표시 제어) */}
                {sceneSimulation.state.results.layout && viewMode !== 'as-is' && (
                  <LayoutOptimizationOverlay
                    result={sceneSimulation.state.results.layout as any}
                    showBefore={false}  /* 🔧 FIX: Before 히트맵 비활성화 (빨간 오버레이 방지) */
                    showAfter={false}   /* 🔧 FIX: After 히트맵도 비활성화 (깔끔한 뷰) */
                    showMoves={true}    /* 가구 이동 화살표는 항상 표시 */
                    showProductMoves={true}  /* 제품 이동 화살표도 항상 표시 */
                    showZoneHighlights={viewMode === 'to-be'}  /* To-Be에서만 존 하이라이트 */
                    storeBounds={storeBounds}
                    zonePositions={zonePositions}
                    zoneSizes={zoneSizes}
                  />
                )}
                {sceneSimulation.state.results.flow && viewMode !== 'as-is' && (
                  <FlowOptimizationOverlay
                    result={sceneSimulation.state.results.flow as any}
                    showPaths={true}
                    showBottlenecks={true}
                    showHeatmap={true}
                    animatePaths={true}
                    storeBounds={storeBounds}
                    entrancePosition={entrancePosition}
                  />
                )}
                {sceneSimulation.state.results.congestion && viewMode !== 'as-is' && (
                  <CongestionOverlay
                    result={sceneSimulation.state.results.congestion as any}
                    showHeatmap={true}
                    showZoneMarkers={true}
                    showCrowdAnimation={true}
                    animateTimeProgress={false}
                  />
                )}
                {sceneSimulation.state.results.staffing && (viewMode as string) !== 'as-is' && (
                  <StaffingOverlay
                    result={sceneSimulation.state.results.staffing as any}
                    showStaffMarkers={true}
                    showCurrentPositions={(viewMode as string) === 'split'}
                    showSuggestedPositions={(viewMode as string) === 'to-be' || (viewMode as string) === 'split'}
                    showCoverageZones={(viewMode as string) !== 'as-is'}
                    showMovementPaths={(viewMode as string) === 'to-be' || (viewMode as string) === 'split'}
                    animateMovement={true}
                  />
                )}

                {/* 🆕 인력 재배치 오버레이 (As-Is → To-Be 이동 경로 애니메이션) */}
                {sceneSimulation.state.results.staffing && viewMode === 'to-be' && (() => {
                  const staffingResult = sceneSimulation.state.results.staffing as any;
                  // staffPositions를 StaffReallocation 형식으로 변환
                  const reallocations = (staffingResult.staffPositions || []).map((sp: any, idx: number) => ({
                    staff_id: sp.staffId || `staff-${idx}`,
                    staff_code: `S${String(idx + 1).padStart(3, '0')}`,
                    staff_name: sp.staffName || `직원 ${idx + 1}`,
                    role: 'sales' as const,
                    from_zone_id: sp.fromZoneId || `zone-${idx}`,
                    from_zone_name: sp.fromZoneName || '이전 구역',
                    from_position: sp.currentPosition || { x: 0, y: 0, z: 0 },
                    to_zone_id: sp.toZoneId || `zone-opt-${idx}`,
                    to_zone_name: sp.toZoneName || '최적 구역',
                    to_position: sp.suggestedPosition || { x: 0, y: 0, z: 0 },
                    reason: sp.reason || '커버리지 최적화',
                    priority: (sp.coverageGain > 15 ? 'high' : sp.coverageGain > 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                    expected_impact: {
                      coverage_change_pct: sp.coverageGain || 0,
                      response_time_change_sec: -5,
                      customers_served_change: Math.floor((sp.coverageGain || 0) / 3),
                    },
                  }));
                  return (
                    <StaffReallocationOverlay
                      visible={true}
                      reallocations={reallocations}
                    />
                  );
                })()}
              </Canvas3D>
            )}
          </div>

          {/* ========== UI 오버레이 ========== */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* ----- 상단 중앙: 통합 컨트롤 바 (패널 토글 + 퀵 토글) ----- */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto z-20 flex items-center gap-3">
              {/* 패널 토글 버튼들 */}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
                {/* 임시 비활성화 - 도구 버튼
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisiblePanels(prev => ({ ...prev, tools: !prev.tools }))}
                  className={`h-8 px-3 rounded-lg transition-all border border-transparent ${
                    visiblePanels.tools ? 'bg-blue-500/30 border-blue-500 text-blue-400' : 'hover:bg-white/10 text-white/60'
                  }`}
                >
                  <Layers className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">도구</span>
                </Button>
                */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisiblePanels(prev => ({ ...prev, sceneSave: !prev.sceneSave }))}
                  className={`h-8 px-3 rounded-lg transition-all border border-transparent ${
                    visiblePanels.sceneSave ? 'bg-green-500/30 border-green-500 text-green-400' : 'hover:bg-white/10 text-white/60'
                  }`}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">씬 저장</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisiblePanels(prev => ({ ...prev, resultReport: !prev.resultReport }))}
                  className={`h-8 px-3 rounded-lg transition-all border border-transparent relative ${
                    visiblePanels.resultReport ? 'bg-purple-500/30 border-purple-500 text-purple-400' : 'hover:bg-white/10 text-white/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span className="text-xs">AI 리포트</span>
                  {(simulationResults.layout || simulationResults.flow || simulationResults.congestion || simulationResults.staffing) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </Button>
              </div>

              {/* 구분선 */}
              <div className="w-px h-6 bg-white/20" />

              {/* 퀵 토글 바 */}
              <QuickToggleBar
                activeOverlays={activeOverlays as any[]}
                onToggle={(id) => toggleOverlay(id as OverlayType)}
              />
            </div>

            {/* ----- 상단 우측: As-Is / To-Be / Split 토글 ----- */}
            <div className="absolute top-4 right-4 pointer-events-auto z-20">
              <ViewModeToggle
                mode={viewMode}
                onChange={setViewMode}
                hasOptimizationResults={!!sceneSimulation.state.results.layout || !!sceneSimulation.state.results.flow}
              />
            </div>

            {/* ----- 하단 좌측: 현재 상태 정보 + 뷰모드 표시 ----- */}
            <div className="absolute bottom-4 left-4 pointer-events-auto z-20 flex items-center gap-2">
              {/* 뷰 모드 인디케이터 */}
              {(sceneSimulation.state.results.layout || sceneSimulation.state.results.flow) && (
                <div className={`px-3 py-2 rounded-lg text-xs font-medium flex flex-col gap-1 ${
                  viewMode === 'as-is'
                    ? 'bg-blue-600/80 text-white'
                    : viewMode === 'to-be'
                    ? 'bg-green-600/80 text-white'
                    : 'bg-purple-600/80 text-white'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {viewMode === 'as-is' && '📍 As-Is (현재 배치)'}
                    {viewMode === 'to-be' && '✨ To-Be (최적화 결과)'}
                    {viewMode === 'split' && '⚡ Split (비교 뷰)'}
                  </div>
                  {/* Split 뷰 안내 */}
                  {viewMode === 'split' && (
                    <div className="text-[10px] text-white/70">
                      🔴 As-Is → 🟢 To-Be 화살표로 변경 확인
                    </div>
                  )}
                </div>
              )}
              <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80">
                <span>가구: {models.filter(m => m.type === 'furniture').length}개</span>
                <span className="mx-2 text-white/30">|</span>
                <span>제품: {models.filter(m => m.type === 'furniture').reduce((acc, m) => acc + ((m.metadata as any)?.childProducts?.length || 0), 0)}개</span>
                <span className="mx-2 text-white/30">|</span>
                <span>존: {dbZones?.length || 0}개</span>
              </div>
            </div>

            {/* ----- 하단 우측: 카메라 컨트롤 힌트 ----- */}
            <div className="absolute bottom-4 right-4 pointer-events-auto z-20">
              <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs text-white/50 flex items-center gap-2">
                <Mouse className="w-3.5 h-3.5" />
                <span>회전</span>
                <span className="text-white/30">|</span>
                <span>Shift+🖱️ 이동</span>
                <span className="text-white/30">|</span>
                <span>스크롤 줌</span>
              </div>
            </div>

            {/* ----- 왼쪽 패널 (리사이즈 가능) ----- */}
            <div
              className="absolute left-4 top-4 bottom-4 pointer-events-auto flex"
              style={{ width: isPanelCollapsed ? 40 : panelWidth }}
            >
              {/* 패널 접기/펼치기 버튼 (접힌 상태) */}
              {isPanelCollapsed ? (
                <div className="h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col items-center py-4">
                  <button
                    onClick={togglePanelCollapse}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                    title="패널 펼치기"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
                    {/* 탭 헤더 - 4패널 구조: 레이어 → AI시뮬레이션 → AI최적화 → 적용하기 */}
                    <div className="flex border-b border-white/10 items-center">
                      <TabButton active={activeTab === 'layer'} onClick={() => setActiveTab('layer')}>
                        <Layers className="w-3 h-3 mr-1 inline" />
                        레이어
                      </TabButton>
                      <TabButton
                        active={activeTab === 'ai-simulation'}
                        onClick={() => setActiveTab('ai-simulation')}
                      >
                        <FlaskConical className="w-3 h-3 mr-1 inline" />
                        AI 시뮬레이션
                      </TabButton>
                      <TabButton
                        active={activeTab === 'ai-optimization'}
                        onClick={() => setActiveTab('ai-optimization')}
                      >
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        AI 최적화
                      </TabButton>
                      <TabButton
                        active={activeTab === 'apply'}
                        onClick={() => setActiveTab('apply')}
                      >
                        <CheckCircle className="w-3 h-3 mr-1 inline" />
                        적용하기
                      </TabButton>
                      {/* 패널 접기 버튼 */}
                      <button
                        onClick={togglePanelCollapse}
                        className="p-2 ml-auto hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                        title="패널 접기"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div className="flex-1 overflow-y-auto">
                      {activeTab === 'layer' && <LayerPanel />}
                      {activeTab === 'ai-simulation' && (
                        <AISimulationTab
                          storeId={selectedStore?.id || ''}
                          sceneData={currentRecipe}
                          onOverlayToggle={toggleOverlay}
                          simulationZones={simulationZones}
                          onResultsUpdate={(type, result) => {
                            // AI 시뮬레이션 결과 저장 및 결과 리포트 패널 표시
                            setSimulationResults((prev) => ({ ...prev, [type]: result }));
                            setVisiblePanels((prev) => ({ ...prev, resultReport: true }));
                          }}
                          onNavigateToOptimization={(issues) => {
                            // AI 시뮬레이션에서 발견된 문제를 AI 최적화로 전달
                            if (issues) {
                              setDiagnosticIssues(issues);
                            }
                            setActiveTab('ai-optimization');
                          }}
                          onEnvironmentConfigChange={handleEnvironmentConfigChange}
                        />
                      )}
                      {activeTab === 'ai-optimization' && (
                        <AIOptimizationTab
                          storeId={selectedStore?.id || ''}
                          sceneData={currentRecipe}
                          sceneSimulation={sceneSimulation}
                          onSceneUpdate={(newScene) => {
                            // SceneProvider에 시뮬레이션 결과 적용
                            if (newScene.furnitureMoves) {
                              // applySimulationResults는 useScene에서 가져옴
                            }
                          }}
                          onOverlayToggle={toggleOverlay}
                          onResultsUpdate={(type, result) => {
                            // AI 최적화 결과 저장 및 결과 리포트 패널 표시
                            setSimulationResults((prev) => ({ ...prev, [type]: result }));
                            setVisiblePanels((prev) => ({ ...prev, resultReport: true }));
                          }}
                          diagnosticIssues={diagnosticIssues}
                          onNavigateToApply={() => setActiveTab('apply')}
                          simulationEnvConfig={simulationEnvConfig}
                        />
                      )}
                      {activeTab === 'apply' && (
                        <ApplyPanel
                          storeId={selectedStore?.id || ''}
                          onApplyScenario={(scenarioId) => {
                            toast.success(`시나리오 ${scenarioId} 적용 시작`);
                            logActivity('feature_use', {
                              feature: 'scenario_apply',
                              scenario_id: scenarioId,
                              store_id: selectedStore?.id,
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* 리사이즈 핸들 */}
                  <div
                    className={`w-1.5 h-full cursor-col-resize flex items-center justify-center group hover:bg-primary/30 transition-colors ${isResizing ? 'bg-primary/50' : ''}`}
                    onMouseDown={handleResizeStart}
                  >
                    <div className="w-0.5 h-12 bg-white/20 group-hover:bg-primary rounded-full transition-colors" />
                  </div>
                </>
              )}
            </div>

            {/* ========== 드래그 가능한 플로팅 패널들 (상단 바 아래에 배치) ========== */}

            {/* 임시 비활성화 - 도구 패널
            {visiblePanels.tools && (
              <DraggablePanel
                id="tool-panel"
                title="도구"
                defaultPosition={{ x: 16, y: 60 }}
                collapsible={true}
                defaultCollapsed={false}
                width="w-auto"
                resizable={false}
              >
                <ToolPanel
                  mode={mode}
                  onModeChange={setMode}
                  onTransformModeChange={setTransformMode}
                  hasSelection={false}
                />
              </DraggablePanel>
            )}
            */}

            {/* 씬 저장 패널 - 상단 바 아래 좌측 */}
            {visiblePanels.sceneSave && (
              <DraggablePanel
                id="scene-save"
                title="씬 저장"
                icon={<Save className="w-4 h-4" />}
                defaultPosition={{ x: 16, y: visiblePanels.tools ? 180 : 60 }}
                defaultCollapsed={false}
                width="w-52"
              >
                <SceneSavePanel
                  currentSceneName={sceneName}
                  savedScenes={scenes.slice(0, 3)}
                  isSaving={isSaving}
                  isDirty={false}
                  onSave={handleSaveScene}
                  onLoad={(id) => setActiveScene(id)}
                  onDelete={(id) => deleteScene(id)}
                  onNew={() => setSceneName('')}
                  maxScenes={3}
                />
              </DraggablePanel>
            )}

            {/* 속성 패널 (편집 모드에서만 표시) */}
            {isEditMode && visiblePanels.property && (
              <DraggablePanel
                id="property-panel"
                title="속성"
                defaultPosition={{ x: 16, y: 300 }}
                defaultCollapsed={false}
                width="w-72"
              >
                <PropertyPanel />
              </DraggablePanel>
            )}

            {/* 통합 결과 리포트 패널 - 우측 상단 */}
            {visiblePanels.resultReport && (
              <ResultReportPanel
                results={simulationResults}
                onClose={() => setVisiblePanels((prev) => ({ ...prev, resultReport: false }))}
                onApply={(type) => {
                  toast.success(`${type} 최적화 결과를 적용합니다`);
                  setActiveTab('apply');
                }}
                onShowIn3D={(type) => {
                  // 해당 오버레이 활성화
                  const overlayMap: Record<string, OverlayType> = {
                    layout: 'layoutOptimization',
                    flow: 'flowOptimization',
                    congestion: 'congestion',
                    staffing: 'staffing',
                  };
                  const overlay = overlayMap[type];
                  if (overlay && !isActive(overlay)) {
                    toggleOverlay(overlay);
                  }
                }}
                defaultPosition={{ x: 16, y: 60 }}
                rightOffset={16}
              />
            )}

            {/* 하단 중앙 버튼 제거됨 - 탭에서 동일 기능 제공 */}
          </div>
        </div>
      </SceneProvider>
    </DashboardLayout>
  );
}

// ============================================================================
// 탭 버튼 컴포넌트
// ============================================================================
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 text-sm font-medium transition-colors
        ${
          active
            ? 'text-white bg-white/10 border-b-2 border-primary'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {children}
    </button>
  );
}

// ============================================================================
// 시뮬레이션 결과 패널 래퍼 (useScene 접근 가능)
// ============================================================================
interface SimulationResultPanelsProps {
  visiblePanels: {
    layoutResult: boolean;
    flowResult: boolean;
    congestionResult: boolean;
    staffingResult: boolean;
  };
  simulationResults: {
    layout: LayoutResult | null;
    flow: FlowResult | null;
    congestion: CongestionResult | null;
    staffing: StaffingResult | null;
  };
  sceneSimulationResults: {
    layout?: any;
    flow?: any;
    congestion?: any;
    staffing?: any;
  };
  onClose: (panel: 'layoutResult' | 'flowResult' | 'congestionResult' | 'staffingResult') => void;
  toggleOverlay: (overlay: string) => void;
}

// ============================================================================
// 통합 오버레이 컨트롤 패널 (고객 시뮬레이션 통합)
// ============================================================================
interface OverlayControlPanelIntegratedProps {
  isActive: (overlayId: OverlayType) => boolean;
  toggleOverlay: (overlayId: OverlayType) => void;
}

function OverlayControlPanelIntegrated({ isActive, toggleOverlay }: OverlayControlPanelIntegratedProps) {
  // 시뮬레이션 스토어
  const {
    isRunning,
    isPaused,
    simulationTime,
    kpi,
    config,
    start,
    pause,
    resume,
    stop,
    reset,
    setSpeed,
  } = useSimulationStore();

  // 고객 오버레이 토글 핸들러 (시뮬레이션 연동)
  const handleAvatarToggle = useCallback(() => {
    const wasActive = isActive('avatar');
    toggleOverlay('avatar');

    // 고객 오버레이가 활성화되면 시뮬레이션 시작
    if (!wasActive && !isRunning) {
      start();
      toast.success('고객 시뮬레이션이 시작되었습니다');
    }
    // 비활성화되면 시뮬레이션 중지
    else if (wasActive && isRunning) {
      stop();
    }
  }, [isActive, toggleOverlay, isRunning, start, stop]);

  // 시간 포맷팅 - 음수는 0으로 처리
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.max(0, seconds);
    const m = Math.floor(absSeconds / 60);
    const s = Math.floor(absSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <DraggablePanel
      id="overlay"
      title="오버레이"
      icon={<Layers className="w-4 h-4" />}
      defaultPosition={{ x: 352, y: 60 }}
      defaultCollapsed={true}
      width="w-56"
    >
      <div className="space-y-3">
        {/* 기본 오버레이 토글 */}
        <div className="space-y-2">
          {[
            { id: 'heatmap', label: '히트맵', icon: '🔥' },
            { id: 'zone', label: '구역', icon: '📍' },
          ].map((overlay) => (
            <label
              key={overlay.id}
              className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors"
            >
              <input
                type="checkbox"
                checked={isActive(overlay.id as OverlayType)}
                onChange={() => toggleOverlay(overlay.id as OverlayType)}
                className="w-3 h-3 rounded"
              />
              <span>{overlay.icon}</span>
              {overlay.label}
            </label>
          ))}
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10" />

        {/* 고객 시뮬레이션 섹션 */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={isActive('avatar')}
              onChange={handleAvatarToggle}
              className="w-3 h-3 rounded"
            />
            <Users className="w-3 h-3 text-green-400" />
            고객 (실시간)
          </label>

          {/* 시뮬레이션 컨트롤 (고객 활성화시) */}
          {isActive('avatar') && (
            <div className="pl-5 space-y-2">
              {/* 시간 & 상태 */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">경과: {formatTime(simulationTime)}</span>
                <span className={isRunning ? (isPaused ? 'text-yellow-400' : 'text-green-400') : 'text-white/40'}>
                  {isRunning ? (isPaused ? '일시정지' : '실행중') : '대기'}
                </span>
              </div>

              {/* 컨트롤 버튼 */}
              <div className="flex gap-1">
                <Button
                  onClick={() => {
                    if (!isRunning) start();
                    else if (isPaused) resume();
                    else pause();
                  }}
                  size="sm"
                  className={`flex-1 h-6 text-[10px] ${isRunning && !isPaused ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {!isRunning ? <Play className="w-3 h-3" /> : isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </Button>
                <Button onClick={stop} disabled={!isRunning} size="sm" variant="destructive" className="h-6 w-6 p-0">
                  <Square className="w-3 h-3" />
                </Button>
                <Button onClick={reset} size="sm" variant="outline" className="h-6 w-6 p-0 border-white/20">
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>

              {/* 속도 조절 */}
              <div className="flex gap-0.5">
                {[1, 2, 4, 10].map((speed) => (
                  <Button
                    key={speed}
                    onClick={() => setSpeed(speed)}
                    size="sm"
                    variant={config.speed === speed ? 'default' : 'outline'}
                    className={`flex-1 h-5 text-[9px] px-1 ${config.speed === speed ? 'bg-blue-600' : 'border-white/20 text-white/60'}`}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>

              {/* 실시간 KPI (실행 중일 때) */}
              {isRunning && (
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="bg-white/5 rounded px-1.5 py-1">
                    <span className="text-white/40">고객</span>
                    <div className="text-white font-bold">{kpi.currentCustomers}</div>
                  </div>
                  <div className="bg-white/5 rounded px-1.5 py-1">
                    <span className="text-white/40">전환</span>
                    <div className="text-green-400 font-bold">{kpi.conversions}</div>
                  </div>
                </div>
              )}

              {/* 고객 상태 범례 */}
              <div className="pt-1 border-t border-white/10">
                <div className="text-[9px] text-white/40 mb-1">상태 범례</div>
                <div className="grid grid-cols-3 gap-x-1 gap-y-0.5">
                  {(Object.entries(STATE_LABELS) as [CustomerState, string][]).map(([state, label]) => (
                    <div key={state} className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: STATE_COLORS[state] }}
                      />
                      <span className="text-[8px] text-white/50">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10" />

        {/* 스태프 오버레이 */}
        <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white transition-colors">
          <input
            type="checkbox"
            checked={isActive('staff')}
            onChange={() => toggleOverlay('staff')}
            className="w-3 h-3 rounded"
          />
          <span>👤</span>
          스태프
        </label>
      </div>
    </DraggablePanel>
  );
}

function SimulationResultPanels({
  visiblePanels,
  simulationResults,
  sceneSimulationResults,
  onClose,
  toggleOverlay,
}: SimulationResultPanelsProps) {
  const { applySimulationResults } = useScene();

  // 3D 씬에 레이아웃 변경 적용 (모델 위치 이동)
  const handleShowLayoutIn3D = useCallback(() => {
    const layoutResult = sceneSimulationResults.layout;
    if (layoutResult?.furnitureMoves && layoutResult.furnitureMoves.length > 0) {
      applySimulationResults({
        furnitureMoves: layoutResult.furnitureMoves,
        animated: true,
      });
      toggleOverlay('zone');
      toast.success('3D 씬에 레이아웃 변경이 적용되었습니다');
    } else {
      toggleOverlay('zone');
      toast.info('3D 뷰에서 변경사항 표시');
    }
  }, [sceneSimulationResults.layout, applySimulationResults, toggleOverlay]);

  return (
    <>
      {visiblePanels.layoutResult && (
        <LayoutResultPanel
          result={simulationResults.layout}
          onClose={() => onClose('layoutResult')}
          onApply={() => {
            // ROI 측정 모달 완료 후 호출됨 - 별도 동작 없음
            // (모달이 이미 ROI 페이지로 이동하거나 토스트 표시함)
          }}
          onShowIn3D={handleShowLayoutIn3D}
          defaultPosition={{ x: 352, y: 220 }}
        />
      )}

      {visiblePanels.flowResult && (
        <FlowResultPanel
          result={simulationResults.flow}
          onClose={() => onClose('flowResult')}
          onApply={() => {
            toast.success('동선 최적화 적용됨');
          }}
          onShowFlow={() => {
            toggleOverlay('flow');
            toast.info('동선 오버레이 표시');
          }}
          defaultPosition={{ x: 352, y: 320 }}
        />
      )}

      {visiblePanels.congestionResult && (
        <CongestionResultPanel
          result={simulationResults.congestion}
          onClose={() => onClose('congestionResult')}
          onPlayAnimation={() => {
            toast.info('시간대별 애니메이션 재생');
          }}
          defaultPosition={{ x: 352, y: 420 }}
        />
      )}

      {visiblePanels.staffingResult && (
        <StaffingResultPanel
          result={simulationResults.staffing}
          onClose={() => onClose('staffingResult')}
          onApply={() => {
            toast.success('인력 배치 최적화 적용됨');
          }}
          onShowPositions={() => {
            toggleOverlay('avatar');
            toast.info('직원 위치 표시');
          }}
          defaultPosition={{ x: 352, y: 520 }}
        />
      )}
    </>
  );
}
