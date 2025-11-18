import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { HeatPoint } from "@/features/digital-twin/types/iot.types";

interface TrafficHeatmapProps {
  visitsData?: any[];
  heatPoints?: HeatPoint[];
  timeOfDay?: number;
}

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

const generateHeatmapData = (
  timeOfDay: number, 
  visitsData: any[], 
  heatPoints?: HeatPoint[]
): HeatmapCell[] => {
  const data: HeatmapCell[] = [];
  const gridSize = 20; // 더 세밀한 그리드

  // WiFi 히트 포인트가 있으면 우선 사용
  if (heatPoints && heatPoints.length > 0) {
    // 그리드 셀별로 히트 포인트를 집계
    const cellMap = new Map<string, number[]>();
    
    heatPoints.forEach(point => {
      // 실제 좌표를 그리드 좌표로 변환 (0-20 범위)
      const gridX = Math.floor((point.realCoords.x / 20) * gridSize);
      const gridZ = Math.floor((point.realCoords.z / 20) * gridSize);
      const key = `${gridX},${gridZ}`;
      
      if (!cellMap.has(key)) {
        cellMap.set(key, []);
      }
      cellMap.get(key)!.push(point.intensity);
    });
    
    // 모든 그리드 셀 생성
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`;
        const intensities = cellMap.get(key);
        
        let intensity = 0;
        if (intensities && intensities.length > 0) {
          // 해당 셀의 평균 밀도
          intensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
          // 방문 횟수에 따라 가중치 추가
          intensity = Math.min(1, intensity + (intensities.length * 0.05));
        }
        
        data.push({ x, y, intensity });
      }
    }
    
    return data;
  }

  // WiFi 데이터가 없으면 방문 데이터 기반으로 생성
  const timeVisits = visitsData.filter((v: any) => {
    const hour = v.visit_hour ? parseInt(v.visit_hour) : Math.floor(Math.random() * 14) + 9;
    return Math.abs(hour - timeOfDay) <= 1;
  });

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      // Entrance area (top) has higher traffic
      const entranceBoost = y < 3 ? 0.5 : 0;
      // Center aisle has higher traffic
      const aisleBoost = x > 7 && x < 12 ? 0.3 : 0;
      // Time-based variation
      const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;
      // Data-based boost
      const dataBoost = timeVisits.length > 0 ? Math.min(0.4, timeVisits.length / visitsData.length) : 0;

      const baseIntensity = Math.random() * 0.3;
      const intensity = Math.min(
        1,
        (baseIntensity + entranceBoost + aisleBoost + dataBoost) * timeMultiplier
      );

      data.push({ x, y, intensity });
    }
  }

  return data;
};

export const TrafficHeatmap = ({ 
  visitsData = [], 
  heatPoints = [],
  timeOfDay: externalTimeOfDay 
}: TrafficHeatmapProps) => {
  const [internalTimeOfDay, setInternalTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 외부에서 timeOfDay를 제공하면 그것을 사용, 아니면 내부 상태 사용
  const timeOfDay = externalTimeOfDay !== undefined ? externalTimeOfDay : internalTimeOfDay;
  
  const [heatmapData, setHeatmapData] = useState(() => 
    generateHeatmapData(timeOfDay, visitsData, heatPoints)
  );

  // timeOfDay나 heatPoints가 변경되면 히트맵 재생성
  useEffect(() => {
    setHeatmapData(generateHeatmapData(timeOfDay, visitsData, heatPoints));
  }, [timeOfDay, visitsData, heatPoints]);

  const updateHeatmap = (newTime: number) => {
    setInternalTimeOfDay(newTime);
    setHeatmapData(generateHeatmapData(newTime, visitsData, heatPoints));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    updateHeatmap(14);
  };

  // 애니메이션 효과 (외부 timeOfDay가 없을 때만)
  useEffect(() => {
    if (!isPlaying || externalTimeOfDay !== undefined) return;

    const interval = setInterval(() => {
      setInternalTimeOfDay((prev) => {
        const next = prev >= 23 ? 9 : prev + 1;
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, externalTimeOfDay]);

  const getHeatColor = (intensity: number) => {
    if (intensity < 0.2) return "bg-blue-500/10";
    if (intensity < 0.4) return "bg-cyan-500/30";
    if (intensity < 0.6) return "bg-yellow-500/50";
    if (intensity < 0.8) return "bg-orange-500/70";
    return "bg-red-500/90";
  };

  const maxIntensity = Math.max(...heatmapData.map((d) => d.intensity));
  const avgIntensity = heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length;
  const hotspots = heatmapData.filter((d) => d.intensity > 0.7).length;

  return (
    <div className="space-y-6">
      {/* Controls - 외부에서 timeOfDay를 제공하지 않을 때만 표시 */}
      {externalTimeOfDay === undefined && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-semibold">
                {String(timeOfDay).padStart(2, "0")}:00
              </Badge>
            </div>
            <Slider
              value={[timeOfDay]}
              onValueChange={([value]) => updateHeatmap(value)}
              min={9}
              max={23}
              step={1}
              className="flex-1 max-w-md"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handlePlay} variant={isPlaying ? "secondary" : "default"}>
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Heatmap Visualization */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">매장 히트맵</h4>
            {heatPoints && heatPoints.length > 0 && (
              <Badge variant="outline">WiFi 트래킹: {heatPoints.length}개 포인트</Badge>
            )}
          </div>

          <Card className="p-4">
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `repeat(20, 1fr)`,
                aspectRatio: "1",
              }}
            >
              {heatmapData.map((cell, i) => (
                <div
                  key={i}
                  className={`${getHeatColor(
                    cell.intensity
                  )} rounded-[1px] transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer hover:shadow-lg`}
                  title={`위치: (${cell.x}, ${cell.y})\n밀집도: ${(cell.intensity * 100).toFixed(0)}%`}
                />
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/10" />
                <span className="text-xs text-muted-foreground">낮음</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500/30" />
                <span className="text-xs text-muted-foreground">보통</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/50" />
                <span className="text-xs text-muted-foreground">높음</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500/70" />
                <span className="text-xs text-muted-foreground">매우 높음</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/90" />
                <span className="text-xs text-muted-foreground">최고</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Analytics */}
        <div className="space-y-4">
          <h4 className="font-semibold">분석 결과</h4>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">피크 강도</div>
            <div className="text-2xl font-bold">{(maxIntensity * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">최대 혼잡도</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">평균 트래픽</div>
            <div className="text-2xl font-bold">{(avgIntensity * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">전체 평균</div>
          </Card>

          <Card className="glass p-4 space-y-2">
            <div className="text-sm text-muted-foreground">핫스팟</div>
            <div className="text-2xl font-bold">{hotspots}개</div>
            <div className="text-xs text-muted-foreground">고밀도 구역</div>
          </Card>

          <Card className="glass p-4 space-y-3">
            <h5 className="text-sm font-semibold">시간대별 추이</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">오전 (09-12)</span>
                <span className="font-medium">35%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">점심 (12-15)</span>
                <span className="font-medium text-primary">72%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오후 (15-18)</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">저녁 (18-23)</span>
                <span className="font-medium">45%</span>
              </div>
            </div>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-xs">
              <span className="font-semibold">인사이트:</span> 점심시간(12-15시) 트래픽 집중.
              입구 우측 구역에 인기 상품 배치 권장.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
