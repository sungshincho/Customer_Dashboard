/**
 * LayoutComparisonView.tsx
 * As-Is vs To-Be 레이아웃 비교 뷰
 */

import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Plane, Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeftRight, Eye, Sparkles, ArrowRight, Save, MoveRight, Loader2 
} from 'lucide-react';

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

interface SceneRecipe {
  space?: any;
  furniture: any[];
  products: any[];
}

interface LayoutComparisonViewProps {
  currentRecipe: SceneRecipe | null;
  suggestedRecipe: SceneRecipe | null;
  changes: LayoutChange[];
  optimizationSummary?: {
    expectedTrafficIncrease?: number;
    expectedRevenueIncrease?: number;
    confidence?: number;
  };
  onApplySuggestion?: () => void;
  isApplying?: boolean;
}

// 안전한 숫자 포맷
function safeToFixed(value: any, digits: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0.0';
  return Number(value).toFixed(digits);
}

function FurnitureBox({ 
  position, rotation, scale, color = '#8B4513', label, isHighlighted = false 
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  label?: string;
  isHighlighted?: boolean;
}) {
  const adjustedY = (position[1] || 0) + (scale[1] || 1) / 2;
  return (
    <group 
      position={[position[0] || 0, adjustedY, position[2] || 0]} 
      rotation={(rotation || [0, 0, 0]).map(r => (r || 0) * Math.PI / 180) as [number, number, number]}
    >
      <Box args={scale}>
        <meshStandardMaterial color={isHighlighted ? '#FFD700' : color} transparent opacity={0.85} />
      </Box>
      <Box args={[(scale[0] || 1) + 0.02, (scale[1] || 1) + 0.02, (scale[2] || 1) + 0.02]}>
        <meshBasicMaterial color={isHighlighted ? '#FF6600' : '#333'} wireframe />
      </Box>
      {label && (
        <Html position={[0, (scale[1] || 1) / 2 + 0.3, 0]} center>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{label}</div>
        </Html>
      )}
    </group>
  );
}

function SceneRenderer({ recipe, changes = [], isToBeView = false }: { 
  recipe: SceneRecipe | null; changes?: LayoutChange[]; isToBeView?: boolean;
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
  
  const changedIds = new Set((changes || []).map(c => c.entityId));

  return (
    <>
      <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6e6e6e"
        sectionSize={5} sectionThickness={1} sectionColor="#9d4b4b" fadeDistance={30} />
      <Plane args={[17.4, 16.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <meshStandardMaterial color="#f0f0f0" />
      </Plane>
      {recipe.furniture.map((item, idx) => (
        <FurnitureBox
          key={`f-${idx}-${item.id || idx}`}
          position={[item.position?.x || 0, item.position?.y || 0, item.position?.z || 0]}
          rotation={[item.rotation?.x || 0, item.rotation?.y || 0, item.rotation?.z || 0]}
          scale={[item.scale?.x || 1, item.scale?.y || 1, item.scale?.z || 1]}
          color={item.color || '#888'}
          label={item.furniture_type || item.label}
          isHighlighted={changedIds.has(item.id) && isToBeView}
        />
      ))}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
    </>
  );
}

export function LayoutComparisonView({
  currentRecipe, suggestedRecipe, changes = [], optimizationSummary, onApplySuggestion, isApplying = false
}: LayoutComparisonViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'current' | 'suggested'>('split');

  // 안전한 changes 배열
  const safeChanges = Array.isArray(changes) ? changes : [];

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800'
    };
    const labels: Record<string, string> = { high: '높음', medium: '중간', low: '낮음' };
    return <Badge className={colors[impact] || 'bg-gray-100'}>{labels[impact] || impact}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* 요약 */}
      {optimizationSummary && (
        <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">+{optimizationSummary.expectedTrafficIncrease || 0}%</div>
            <div className="text-xs text-muted-foreground">예상 트래픽</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">+{optimizationSummary.expectedRevenueIncrease || 0}%</div>
            <div className="text-xs text-muted-foreground">예상 매출</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{optimizationSummary.confidence || 0}%</div>
            <div className="text-xs text-muted-foreground">신뢰도</div>
          </div>
        </div>
      )}

      {/* 뷰 모드 탭 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="split"><ArrowLeftRight className="h-4 w-4 mr-1" />비교</TabsTrigger>
          <TabsTrigger value="current"><Eye className="h-4 w-4 mr-1" />현재</TabsTrigger>
          <TabsTrigger value="suggested"><Sparkles className="h-4 w-4 mr-1" />추천</TabsTrigger>
        </TabsList>

        <div className="mt-3 border rounded-lg overflow-hidden" style={{ height: '350px' }}>
          <TabsContent value="split" className="h-full m-0">
            <div className="grid grid-cols-2 gap-1 h-full">
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white px-2 py-1 rounded text-xs">현재 (As-Is)</div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}><SceneRenderer recipe={currentRecipe} changes={safeChanges} /></Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-blue-600/80 text-white px-2 py-1 rounded text-xs">추천 (To-Be)</div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}><SceneRenderer recipe={suggestedRecipe} changes={safeChanges} isToBeView /></Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="current" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}><SceneRenderer recipe={currentRecipe} changes={safeChanges} /></Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
          <TabsContent value="suggested" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}><SceneRenderer recipe={suggestedRecipe} changes={safeChanges} isToBeView /></Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 변경 사항 목록 */}
      {safeChanges.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MoveRight className="h-4 w-4" />변경 제안 ({safeChanges.length}개)
          </h4>
          <ScrollArea className="h-[140px]">
            <div className="space-y-2">
              {safeChanges.map((change, idx) => (
                <div key={idx} className="p-2 rounded border bg-gray-50 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{change.entityLabel || 'Unknown'}</span>
                    {getImpactBadge(change.impact || 'medium')}
                  </div>
                  <p className="text-muted-foreground text-xs">{change.reason || ''}</p>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    ({safeToFixed(change.currentPosition?.x)}, {safeToFixed(change.currentPosition?.z)})
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-blue-600">
                      ({safeToFixed(change.suggestedPosition?.x)}, {safeToFixed(change.suggestedPosition?.z)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* 적용 버튼 */}
      {safeChanges.length > 0 && onApplySuggestion && (
        <div className="flex justify-end">
          <Button onClick={onApplySuggestion} disabled={isApplying}>
            {isApplying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />적용 중...</> : <><Save className="h-4 w-4 mr-2" />추천 적용</>}
          </Button>
        </div>
      )}
    </div>
  );
}

export default LayoutComparisonView;
