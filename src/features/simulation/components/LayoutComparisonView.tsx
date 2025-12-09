/**
 * LayoutComparisonView_v2.tsx
 * As-Is vs To-Be 레이아웃 비교 뷰 - v2 제품 재배치 시각화 지원
 * 
 * 🆕 v2 변경사항:
 * - productPlacements 지원 (제품 재배치 시각화)
 * - furnitureChanged 제품 하이라이트 (보라색)
 * - 이동 경로 화살표 (선택적)
 * - 신뢰도 게이지 컴포넌트
 * - 제품 재배치 목록
 */

import { useState, Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Plane, Html, useGLTF, Line } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeftRight, Eye, Sparkles, ArrowRight, Save, MoveRight, Loader2,
  Package, Armchair, AlertTriangle, CheckCircle2, TrendingUp, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입 정의
// ============================================================================

interface Vector3D { x: number; y: number; z: number; }

interface LayoutChange {
  entityId: string;
  entityLabel: string;
  entityType: string;
  currentPosition?: Vector3D;
  suggestedPosition?: Vector3D;
  currentRotation?: Vector3D;
  suggestedRotation?: Vector3D;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

// 🆕 제품 재배치 타입
interface ProductPlacement {
  productId: string;
  productLabel: string;
  currentFurnitureId: string | null;
  currentFurnitureLabel: string | null;
  suggestedFurnitureId: string | null;
  suggestedFurnitureLabel: string | null;
  suggestedPosition?: Vector3D;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

interface FurnitureItem {
  id?: string;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  dimensions?: { width?: number; height?: number; depth?: number };
  color?: string;
  label?: string;
  furniture_type?: string;
  model_url?: string | null;
  isChanged?: boolean;  // 🆕
}

interface ProductItem {
  id?: string;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  dimensions?: { width?: number; height?: number; depth?: number };
  label?: string;
  model_url?: string | null;
  isChanged?: boolean;  // 🆕
  currentFurnitureId?: string | null;  // 🆕
  suggestedFurnitureId?: string | null;  // 🆕
  furnitureChanged?: boolean;  // 🆕 가구가 변경된 제품
}

interface SceneRecipe {
  space?: any;
  furniture: FurnitureItem[];
  products: ProductItem[];
}

// 🆕 신뢰도 요소
interface ConfidenceFactors {
  dataAvailability: number;      // 0-25
  dataRecency: number;           // 0-15
  dataCoverage: number;          // 0-15
  pastPerformance: number;       // 0-20
  patternConsistency: number;    // 0-15
  ontologyDepth: number;         // 0-10
}

interface OptimizationSummary {
  expectedTrafficIncrease?: number;
  expectedRevenueIncrease?: number;
  expectedConversionIncrease?: number;
  confidence?: number;
  confidenceFactors?: ConfidenceFactors;  // 🆕
  confidenceExplanation?: string;  // 🆕
  changesCount?: number;
  productChangesCount?: number;  // 🆕
}

interface LayoutComparisonViewProps {
  currentRecipe: SceneRecipe | null;
  suggestedRecipe: SceneRecipe | null;
  changes: LayoutChange[];
  productPlacements?: ProductPlacement[];  // 🆕
  optimizationSummary?: OptimizationSummary;
  onApplySuggestion?: () => void;
  isApplying?: boolean;
}

// ============================================================================
// 색상 상수
// ============================================================================

const HIGHLIGHT_COLORS = {
  furnitureChanged: '#fbbf24',    // amber-400 (가구 변경)
  productMoved: '#3b82f6',        // blue-500 (제품 위치 변경)
  productFurnitureChanged: '#8b5cf6', // purple-500 (제품 가구 변경)
  pathFurniture: '#ef4444',       // red-500
  pathProduct: '#3b82f6',         // blue-500
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

function safeToFixed(value: any, digits: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0.0';
  return Number(value).toFixed(digits);
}

// ============================================================================
// 🆕 신뢰도 게이지 컴포넌트
// ============================================================================

interface ConfidenceGaugeProps {
  confidence: number;
  factors?: ConfidenceFactors;
  explanation?: string;
  compact?: boolean;
}

function ConfidenceGauge({ confidence, factors, explanation, compact = false }: ConfidenceGaugeProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const factorLabels: Record<keyof ConfidenceFactors, { label: string; max: number; icon: string }> = {
    dataAvailability: { label: '데이터 충분성', max: 25, icon: '📊' },
    dataRecency: { label: '데이터 최신성', max: 15, icon: '🕐' },
    dataCoverage: { label: '데이터 커버리지', max: 15, icon: '📈' },
    pastPerformance: { label: '과거 성과', max: 20, icon: '✅' },
    patternConsistency: { label: '패턴 일관성', max: 15, icon: '🔄' },
    ontologyDepth: { label: '온톨로지 깊이', max: 10, icon: '🔗' },
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className={cn("text-lg font-bold", getConfidenceColor(confidence))}>
                {confidence}%
              </div>
              <div className="text-xs text-muted-foreground">신뢰도</div>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">{explanation || '데이터 기반 신뢰도'}</p>
            {factors && (
              <div className="mt-2 space-y-1 text-xs">
                {Object.entries(factors).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{factorLabels[key as keyof ConfidenceFactors]?.label}</span>
                    <span>{value}/{factorLabels[key as keyof ConfidenceFactors]?.max}</span>
                  </div>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">분석 신뢰도</span>
          <Badge variant="outline" className={cn("font-bold", getConfidenceColor(confidence))}>
            {confidence}%
          </Badge>
        </div>
        {factors && (
          expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </div>
      
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", getProgressColor(confidence))}
          style={{ width: `${confidence}%` }}
        />
      </div>
      
      {explanation && (
        <p className="text-xs text-muted-foreground">{explanation}</p>
      )}

      {expanded && factors && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
          <h5 className="text-xs font-medium text-muted-foreground mb-2">신뢰도 구성 요소</h5>
          {Object.entries(factors).map(([key, value]) => {
            const factor = factorLabels[key as keyof ConfidenceFactors];
            const percentage = (value / factor.max) * 100;
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{factor.icon} {factor.label}</span>
                  <span className="text-muted-foreground">{value}/{factor.max}</span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
          
          {confidence < 80 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
              <p className="font-medium text-yellow-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                신뢰도 향상 방법
              </p>
              <ul className="mt-1 text-yellow-700 space-y-0.5">
                {(!factors.dataAvailability || factors.dataAvailability < 20) && (
                  <li>• 30일 매출/방문 데이터 추가 (+25점)</li>
                )}
                {(!factors.pastPerformance || factors.pastPerformance < 15) && (
                  <li>• 과거 추천 적용 후 성과 기록 (+20점)</li>
                )}
                {(!factors.dataCoverage || factors.dataCoverage < 10) && (
                  <li>• 구역별 히트맵 데이터 추가 (+15점)</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3D 모델 컴포넌트들 (기존 유지)
// ============================================================================

function GLBModelInner({ 
  url, position, rotation, scale, isHighlighted = false, highlightColor = '#FFD700'
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isHighlighted?: boolean;
  highlightColor?: string;
}) {
  const { scene } = useGLTF(url);
  const clonedScene = useRef<THREE.Group | null>(null);
  
  useEffect(() => {
    if (clonedScene.current && isHighlighted) {
      clonedScene.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive = new THREE.Color(highlightColor);
            mat.emissiveIntensity = 0.4;
          }
        }
      });
    }
  }, [isHighlighted, highlightColor]);

  return (
    <group 
      position={position}
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
      scale={scale}
    >
      <primitive ref={clonedScene} object={scene.clone()} />
    </group>
  );
}

function GLBModel(props: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isHighlighted?: boolean;
  highlightColor?: string;
  onError?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    fetch(props.url, { method: 'HEAD' })
      .then(res => {
        if (!res.ok) {
          setHasError(true);
          props.onError?.();
        }
      })
      .catch(() => {
        setHasError(true);
        props.onError?.();
      });
  }, [props.url]);
  
  if (hasError) return null;
  
  return <GLBModelInner {...props} />;
}

// 🆕 하이라이트 링 (변경된 객체 아래 표시)
function HighlightRing({ 
  position, 
  color, 
  radius = 1,
  pulseSpeed = 2
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
  pulseSpeed?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.1 + 1;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[position[0], 0.02, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[radius * 0.7, radius, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 폴백 박스 컴포넌트
function FallbackBox({ 
  position, rotation, scale, color = '#8B4513', label, 
  isHighlighted = false, highlightColor = '#FFD700', isProduct = false
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  label?: string;
  isHighlighted?: boolean;
  highlightColor?: string;
  isProduct?: boolean;
}) {
  const adjustedY = (position[1] || 0) + (scale[1] || 1) / 2;
  const boxColor = isProduct ? '#4CAF50' : color;
  
  return (
    <group 
      position={[position[0] || 0, adjustedY, position[2] || 0]} 
      rotation={rotation.map(r => (r || 0) * Math.PI / 180) as [number, number, number]}
    >
      <Box args={scale}>
        <meshStandardMaterial 
          color={isHighlighted ? highlightColor : boxColor} 
          transparent 
          opacity={0.85} 
          emissive={isHighlighted ? highlightColor : '#000000'}
          emissiveIntensity={isHighlighted ? 0.3 : 0}
        />
      </Box>
      <Box args={[(scale[0] || 1) + 0.02, (scale[1] || 1) + 0.02, (scale[2] || 1) + 0.02]}>
        <meshBasicMaterial color={isHighlighted ? highlightColor : '#333'} wireframe />
      </Box>
      {label && (
        <Html position={[0, (scale[1] || 1) / 2 + 0.3, 0]} center>
          <div className={cn(
            "text-white text-xs px-2 py-1 rounded whitespace-nowrap",
            isHighlighted ? "bg-purple-600/90" : "bg-black/70"
          )}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// 🆕 아이템 렌더러 (하이라이트 색상 지원)
function ItemRenderer({ 
  item, 
  isHighlighted = false,
  highlightColor = '#FFD700',
  isProduct = false,
  showLabel = true,
  showHighlightRing = true
}: {
  item: FurnitureItem | ProductItem;
  isHighlighted?: boolean;
  highlightColor?: string;
  isProduct?: boolean;
  showLabel?: boolean;
  showHighlightRing?: boolean;
}) {
  const [modelFailed, setModelFailed] = useState(false);
  
  const position: [number, number, number] = [
    item.position?.x || 0, 
    item.position?.y || 0, 
    item.position?.z || 0
  ];
  const rotation: [number, number, number] = [
    item.rotation?.x || 0, 
    item.rotation?.y || 0, 
    item.rotation?.z || 0
  ];
  const modelScale: [number, number, number] = [
    item.scale?.x || 1, 
    item.scale?.y || 1, 
    item.scale?.z || 1
  ];
  const boxScale: [number, number, number] = item.dimensions 
    ? [item.dimensions.width || 1, item.dimensions.height || 1, item.dimensions.depth || 1]
    : modelScale;

  const label = showLabel 
    ? ('furniture_type' in item ? item.furniture_type : item.label) || item.label 
    : undefined;

  return (
    <group>
      {/* 하이라이트 링 */}
      {isHighlighted && showHighlightRing && (
        <HighlightRing 
          position={position} 
          color={highlightColor} 
          radius={Math.max(boxScale[0], boxScale[2]) * 0.8}
        />
      )}
      
      {item.model_url && !modelFailed ? (
        <Suspense fallback={
          <FallbackBox 
            position={position} rotation={rotation} scale={boxScale}
            color={(item as FurnitureItem).color || '#888'}
            label={label} isHighlighted={isHighlighted} highlightColor={highlightColor}
            isProduct={isProduct}
          />
        }>
          <GLBModel 
            url={item.model_url}
            position={position} rotation={rotation} scale={modelScale}
            isHighlighted={isHighlighted} highlightColor={highlightColor}
            onError={() => setModelFailed(true)}
          />
        </Suspense>
      ) : (
        <FallbackBox 
          position={position} rotation={rotation} scale={boxScale}
          color={(item as FurnitureItem).color || '#888'}
          label={label} isHighlighted={isHighlighted} highlightColor={highlightColor}
          isProduct={isProduct}
        />
      )}
    </group>
  );
}

// 🆕 씬 렌더러 (제품 하이라이트 지원)
function SceneRenderer({ 
  recipe, 
  changes = [], 
  productPlacements = [],
  isToBeView = false 
}: { 
  recipe: SceneRecipe | null; 
  changes?: LayoutChange[]; 
  productPlacements?: ProductPlacement[];
  isToBeView?: boolean;
}) {
  if (!recipe || !recipe.furniture || recipe.furniture.length === 0) {
    return (
      <Html center>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📦</div>
          <div>가구 데이터 없음</div>
        </div>
      </Html>
    );
  }
  
  const changedFurnitureIds = new Set((changes || []).map(c => c.entityId));
  const changedProductIds = new Set((productPlacements || []).map(p => p.productId));

  return (
    <>
      <Grid 
        args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6e6e6e"
        sectionSize={5} sectionThickness={1} sectionColor="#9d4b4b" fadeDistance={30} 
      />
      
      {/* 매장 공간 */}
      {recipe.space?.model_url ? (
        <Suspense fallback={
          <Plane args={[17.4, 16.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <meshStandardMaterial color="#f0f0f0" />
          </Plane>
        }>
          <GLBModel 
            url={recipe.space.model_url}
            position={[recipe.space.position?.x || 0, recipe.space.position?.y || 0, recipe.space.position?.z || 0]}
            rotation={[recipe.space.rotation?.x || 0, recipe.space.rotation?.y || 0, recipe.space.rotation?.z || 0]}
            scale={[recipe.space.scale?.x || 1, recipe.space.scale?.y || 1, recipe.space.scale?.z || 1]}
            isHighlighted={false}
          />
        </Suspense>
      ) : (
        <Plane args={[17.4, 16.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <meshStandardMaterial color="#f0f0f0" />
        </Plane>
      )}
      
      {/* 가구 렌더링 */}
      {recipe.furniture.map((item, idx) => {
        const isChanged = changedFurnitureIds.has(item.id || '') || item.isChanged;
        return (
          <ItemRenderer
            key={`furniture-${item.id || idx}`}
            item={item}
            isHighlighted={isToBeView && isChanged}
            highlightColor={HIGHLIGHT_COLORS.furnitureChanged}
            isProduct={false}
            showLabel={true}
          />
        );
      })}
      
      {/* 🆕 제품 렌더링 - 변경된 제품 하이라이트 */}
      {recipe.products?.map((item, idx) => {
        const productItem = item as ProductItem;
        const isProductChanged = changedProductIds.has(item.id || '') || productItem.isChanged;
        const isFurnitureChanged = productItem.furnitureChanged;
        
        // 가구 변경된 제품은 보라색, 일반 이동은 파란색
        const highlightColor = isFurnitureChanged 
          ? HIGHLIGHT_COLORS.productFurnitureChanged 
          : HIGHLIGHT_COLORS.productMoved;
        
        return (
          <ItemRenderer
            key={`product-${item.id || idx}`}
            item={item}
            isHighlighted={isToBeView && isProductChanged}
            highlightColor={highlightColor}
            isProduct={true}
            showLabel={isProductChanged}  // 변경된 제품만 라벨 표시
          />
        );
      })}
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
    </>
  );
}

// ============================================================================
// 🆕 변경사항 목록 컴포넌트
// ============================================================================

interface ChangeListProps {
  changes: LayoutChange[];
  productPlacements: ProductPlacement[];
}

function ChangeList({ changes, productPlacements }: ChangeListProps) {
  const [showFurniture, setShowFurniture] = useState(true);
  const [showProducts, setShowProducts] = useState(true);

  const getImpactBadge = (impact: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      high: { bg: 'bg-red-100', text: 'text-red-800', label: '높음' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '중간' },
      low: { bg: 'bg-green-100', text: 'text-green-800', label: '낮음' },
    };
    const c = config[impact] || config.medium;
    return <Badge className={cn(c.bg, c.text, "text-xs")}>{c.label}</Badge>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 가구 변경 섹션 */}
      <div 
        className="flex items-center justify-between p-3 bg-amber-50 border-b cursor-pointer hover:bg-amber-100"
        onClick={() => setShowFurniture(!showFurniture)}
      >
        <div className="flex items-center gap-2">
          <Armchair className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-sm">가구 변경</span>
          <Badge variant="secondary">{changes.length}개</Badge>
        </div>
        {showFurniture ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {showFurniture && changes.length > 0 && (
        <ScrollArea className="max-h-[150px]">
          <div className="divide-y">
            {changes.map((change, idx) => (
              <div key={idx} className="p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{change.entityLabel}</span>
                  {getImpactBadge(change.impact)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{change.reason}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <span>({safeToFixed(change.currentPosition?.x)}, {safeToFixed(change.currentPosition?.z)})</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-amber-600 font-medium">
                    ({safeToFixed(change.suggestedPosition?.x)}, {safeToFixed(change.suggestedPosition?.z)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* 🆕 제품 재배치 섹션 */}
      {productPlacements.length > 0 && (
        <>
          <div 
            className="flex items-center justify-between p-3 bg-purple-50 border-b cursor-pointer hover:bg-purple-100"
            onClick={() => setShowProducts(!showProducts)}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">제품 재배치</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                {productPlacements.length}개
              </Badge>
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                NEW
              </Badge>
            </div>
            {showProducts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {showProducts && (
            <ScrollArea className="max-h-[150px]">
              <div className="divide-y">
                {productPlacements.map((placement, idx) => {
                  const isFurnitureChanged = placement.suggestedFurnitureId !== placement.currentFurnitureId;
                  return (
                    <div key={idx} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{placement.productLabel}</span>
                        {getImpactBadge(placement.impact)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{placement.reason}</p>
                      
                      {/* 가구 변경 표시 */}
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <span className="text-gray-500">{placement.currentFurnitureLabel || '없음'}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className={cn(
                          "font-medium",
                          isFurnitureChanged ? "text-purple-600" : "text-blue-600"
                        )}>
                          {placement.suggestedFurnitureLabel || '없음'}
                        </span>
                        {isFurnitureChanged && (
                          <Badge className="ml-1 bg-purple-100 text-purple-700 text-[10px] px-1">
                            ⚡ 가구 변경
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {changes.length === 0 && productPlacements.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-sm">현재 레이아웃이 최적입니다</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 🆕 예상 효과 요약 컴포넌트
// ============================================================================

function OptimizationSummaryCard({ summary }: { summary: OptimizationSummary }) {
  const metrics = [
    { 
      label: '트래픽', 
      value: summary.expectedTrafficIncrease || 0, 
      icon: TrendingUp,
      color: 'text-green-600'
    },
    { 
      label: '매출', 
      value: summary.expectedRevenueIncrease || 0, 
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    { 
      label: '전환율', 
      value: summary.expectedConversionIncrease || 0, 
      icon: TrendingUp,
      color: 'text-purple-600'
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
      {metrics.map((metric) => (
        <div key={metric.label} className="text-center">
          <div className={cn("text-lg font-bold flex items-center justify-center gap-1", metric.color)}>
            +{metric.value}%
          </div>
          <div className="text-xs text-muted-foreground">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function LayoutComparisonView({
  currentRecipe, 
  suggestedRecipe, 
  changes = [], 
  productPlacements = [],  // 🆕
  optimizationSummary, 
  onApplySuggestion, 
  isApplying = false
}: LayoutComparisonViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'current' | 'suggested'>('split');

  const safeChanges = Array.isArray(changes) ? changes : [];
  const safeProductPlacements = Array.isArray(productPlacements) ? productPlacements : [];
  
  const totalChanges = safeChanges.length + safeProductPlacements.length;

  return (
    <div className="space-y-4">
      {/* 🆕 신뢰도 게이지 + 예상 효과 */}
      {optimizationSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OptimizationSummaryCard summary={optimizationSummary} />
          <ConfidenceGauge 
            confidence={optimizationSummary.confidence || 0}
            factors={optimizationSummary.confidenceFactors}
            explanation={optimizationSummary.confidenceExplanation}
          />
        </div>
      )}

      {/* 뷰 모드 탭 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="split">
            <ArrowLeftRight className="h-4 w-4 mr-1" />비교
          </TabsTrigger>
          <TabsTrigger value="current">
            <Eye className="h-4 w-4 mr-1" />현재
          </TabsTrigger>
          <TabsTrigger value="suggested">
            <Sparkles className="h-4 w-4 mr-1" />추천
            {totalChanges > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{totalChanges}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-3 border rounded-lg overflow-hidden" style={{ height: '350px' }}>
          <TabsContent value="split" className="h-full m-0">
            <div className="grid grid-cols-2 gap-1 h-full">
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  현재 (As-Is)
                </div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}>
                    <SceneRenderer 
                      recipe={currentRecipe} 
                      changes={safeChanges} 
                      productPlacements={safeProductPlacements}
                    />
                  </Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-blue-600/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  추천 (To-Be)
                  {safeProductPlacements.length > 0 && (
                    <Badge className="bg-purple-500 text-[10px] px-1">+제품</Badge>
                  )}
                </div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}>
                    <SceneRenderer 
                      recipe={suggestedRecipe} 
                      changes={safeChanges} 
                      productPlacements={safeProductPlacements}
                      isToBeView 
                    />
                  </Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="current" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}>
                  <SceneRenderer 
                    recipe={currentRecipe} 
                    changes={safeChanges}
                    productPlacements={safeProductPlacements}
                  />
                </Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
          
          <TabsContent value="suggested" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              {/* 범례 */}
              <div className="absolute top-2 right-2 z-10 bg-black/70 text-white p-2 rounded text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>가구 변경</span>
                </div>
                {safeProductPlacements.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>제품 이동</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span>가구→가구 이동</span>
                    </div>
                  </>
                )}
              </div>
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}>
                  <SceneRenderer 
                    recipe={suggestedRecipe} 
                    changes={safeChanges}
                    productPlacements={safeProductPlacements}
                    isToBeView 
                  />
                </Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 🆕 변경사항 목록 (가구 + 제품) */}
      <ChangeList 
        changes={safeChanges} 
        productPlacements={safeProductPlacements} 
      />

      {/* 적용 버튼 */}
      {totalChanges > 0 && onApplySuggestion && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {safeChanges.length}개 가구 변경
            {safeProductPlacements.length > 0 && `, ${safeProductPlacements.length}개 제품 재배치`}
          </p>
          <Button onClick={onApplySuggestion} disabled={isApplying}>
            {isApplying ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />적용 중...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />추천 적용</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default LayoutComparisonView;
