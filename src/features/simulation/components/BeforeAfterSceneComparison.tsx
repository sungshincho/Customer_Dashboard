import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { LayoutChangeOverlay } from "@/features/simulation/components/overlays/LayoutChangeOverlay";
import { CustomerFlowOverlay } from "@/features/simulation/components/overlays/CustomerFlowOverlay";
import { ZoneChange, FurnitureMove } from '../types/layout.types';

interface BeforeAfterSceneComparisonProps {
  beforeZones?: ZoneChange[];
  afterZones?: ZoneChange[];
  beforeFurniture?: FurnitureMove[];
  afterFurniture?: FurnitureMove[];
  predictedFlowData?: any;
}

export function BeforeAfterSceneComparison({
  beforeZones = [],
  afterZones = [],
  beforeFurniture = [],
  afterFurniture = [],
  predictedFlowData,
}: BeforeAfterSceneComparisonProps) {
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side' | 'overlay'>('slider');
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Before/After 레이아웃 비교</CardTitle>
        <CardDescription>변경 전후 레이아웃을 비교하고 예측된 고객 동선을 확인하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={comparisonMode} onValueChange={(v) => setComparisonMode(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="slider">슬라이더</TabsTrigger>
            <TabsTrigger value="side-by-side">나란히</TabsTrigger>
            <TabsTrigger value="overlay">오버레이</TabsTrigger>
          </TabsList>

          {/* Slider Mode */}
          <TabsContent value="slider" className="space-y-4">
            <div className="space-y-2">
              <Label>변경 비율: {sliderValue[0]}%</Label>
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>변경 전</span>
                <span>변경 후</span>
              </div>
            </div>

            <div className="relative">
              <SharedDigitalTwinScene
                overlayType="none"
                height="500px"
                customOverlay={
                  <>
                    {/* Interpolate between before and after states */}
                    <LayoutChangeOverlay
                      zoneChanges={afterZones.map((after, idx) => {
                        const before = beforeZones[idx] || after;
                        const ratio = sliderValue[0] / 100;
                        
                        return {
                          ...after,
                          newPosition: {
                            x: (before.originalPosition?.x || 0) * (1 - ratio) + (after.newPosition?.x || 0) * ratio,
                            y: (before.originalPosition?.y || 0) * (1 - ratio) + (after.newPosition?.y || 0) * ratio,
                            z: (before.originalPosition?.z || 0) * (1 - ratio) + (after.newPosition?.z || 0) * ratio,
                          },
                        };
                      })}
                      furnitureMoves={afterFurniture.map((after, idx) => {
                        const before = beforeFurniture[idx] || after;
                        const ratio = sliderValue[0] / 100;
                        
                        return {
                          ...after,
                          toPosition: {
                            x: before.fromPosition.x * (1 - ratio) + after.toPosition.x * ratio,
                            y: before.fromPosition.y * (1 - ratio) + after.toPosition.y * ratio,
                            z: before.fromPosition.z * (1 - ratio) + after.toPosition.z * ratio,
                          },
                        };
                      })}
                      showPreview={true}
                    />
                    {predictedFlowData && sliderValue[0] > 50 && (
                      <CustomerFlowOverlay flowData={predictedFlowData} opacity={sliderValue[0] / 100} />
                    )}
                  </>
                }
              />

              {/* Progress indicator */}
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                <div className="text-sm font-semibold">
                  {sliderValue[0] < 50 ? '변경 전' : sliderValue[0] > 50 ? '변경 후' : '전환 중'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sliderValue[0]}% 진행
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Side by Side Mode */}
          <TabsContent value="side-by-side" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold">변경 전</div>
                <SharedDigitalTwinScene
                  overlayType="none"
                  height="400px"
                  customOverlay={
                    <LayoutChangeOverlay
                      zoneChanges={beforeZones.map(z => ({
                        ...z,
                        newPosition: z.originalPosition,
                        newSize: z.originalSize,
                      }))}
                      furnitureMoves={beforeFurniture.map(f => ({
                        ...f,
                        toPosition: f.fromPosition,
                      }))}
                      showPreview={false}
                    />
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">변경 후 (예측)</div>
                <SharedDigitalTwinScene
                  overlayType="none"
                  height="400px"
                  customOverlay={
                    <>
                      <LayoutChangeOverlay
                        zoneChanges={afterZones}
                        furnitureMoves={afterFurniture}
                        showPreview={true}
                      />
                      {predictedFlowData && (
                        <CustomerFlowOverlay flowData={predictedFlowData} opacity={0.8} />
                      )}
                    </>
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Overlay Mode */}
          <TabsContent value="overlay" className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              💡 변경 전후를 겹쳐서 표시합니다. 파란색은 변경 전, 녹색은 변경 후입니다.
            </div>

            <SharedDigitalTwinScene
              overlayType="none"
              height="500px"
              customOverlay={
                <>
                  {/* Before (Blue) */}
                  <group>
                    {beforeZones.map((zone, idx) => {
                      if (!zone.originalPosition) return null;
                      const size = zone.originalSize || { width: 2, depth: 2, height: 0.1 };
                      return (
                        <mesh
                          key={`before-${idx}`}
                          position={[zone.originalPosition.x, 0.05, zone.originalPosition.z]}
                        >
                          <boxGeometry args={[size.width, 0.1, size.depth]} />
                          <meshStandardMaterial color="#0066ff" transparent opacity={0.3} />
                        </mesh>
                      );
                    })}
                  </group>

                  {/* After (Green) */}
                  <group>
                    {afterZones.map((zone, idx) => {
                      if (!zone.newPosition) return null;
                      const size = zone.newSize || { width: 2, depth: 2, height: 0.1 };
                      return (
                        <mesh
                          key={`after-${idx}`}
                          position={[zone.newPosition.x, 0.15, zone.newPosition.z]}
                        >
                          <boxGeometry args={[size.width, 0.1, size.depth]} />
                          <meshStandardMaterial color="#00ff00" transparent opacity={0.4} />
                        </mesh>
                      );
                    })}
                  </group>

                  {predictedFlowData && (
                    <CustomerFlowOverlay flowData={predictedFlowData} opacity={0.6} />
                  )}
                </>
              }
            />
          </TabsContent>
        </Tabs>

        {/* KPI Change Summary */}
        {predictedFlowData?.kpiChanges && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">예측 전환율 변화</div>
              <div className="text-2xl font-bold text-green-600">
                +{predictedFlowData.kpiChanges.conversionRate}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">평균 체류시간 변화</div>
              <div className="text-2xl font-bold text-blue-600">
                +{predictedFlowData.kpiChanges.dwellTime}분
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">동선 효율성</div>
              <div className="text-2xl font-bold text-purple-600">
                {predictedFlowData.kpiChanges.flowEfficiency}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
