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
  contextInsights?: string[];
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
    const hour = v.visit_hour ? parseInt(v.visit_hour) : 12;
    return Math.abs(hour - timeOfDay) <= 1;
  });

  // 방문 데이터가 있으면 실제 데이터 기반으로 히트맵 생성
  if (visitsData.length > 0) {
    // 시간대별 방문자 수로 전체 밀도 계산
    const timeMultiplier = timeVisits.length / Math.max(1, visitsData.length);
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        // 입구 영역 (상단) - 방문 데이터 기반 밀도
        const entranceBoost = y < 3 ? timeMultiplier * 0.6 : 0;
        // 중앙 통로 - 이동 경로 밀도
        const aisleBoost = (x > 7 && x < 12) ? timeMultiplier * 0.4 : 0;
        // 상품 진열 구역 - 체류 시간 기반
        const displayBoost = ((x < 7 || x > 12) && y > 3 && y < 17) ? timeMultiplier * 0.3 : 0;
        
        const intensity = Math.min(1, entranceBoost + aisleBoost + displayBoost);
        data.push({ x, y, intensity });
      }
    }
  } else {
    // 데이터가 없으면 기본 패턴
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        data.push({ x, y, intensity: 0 });
      }
    }
  }

  return data;
};

export const TrafficHeatmap = ({ 
  visitsData = [], 
  heatPoints = [],
  timeOfDay: externalTimeOfDay,
  contextInsights = []
}: TrafficHeatmapProps) => {
  const [internalTimeOfDay, setInternalTimeOfDay] = useState(14);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 외부에서 timeOfDay를 제공하면 그것을 사용, 아니면 내부 상태 사용
  const timeOfDay = externalTimeOfDay !== undefined ? externalTimeOfDay : internalTimeOfDay;

  // 현재 시간대에 해당하는 컨텍스트 정보 필터링
  const currentTimeContexts = useMemo(() => {
    const contexts: { icon: string; text: string; variant: "default" | "secondary" | "destructive" | "outline" }[] = [];
    
    contextInsights.forEach(insight => {
      if (insight.includes('🌧️') || insight.includes('비')) {
        contexts.push({ icon: '🌧️', text: '비 오는 날', variant: 'secondary' });
      }
      if (insight.includes('☀️') || insight.includes('폭염')) {
        contexts.push({ icon: '☀️', text: '폭염', variant: 'destructive' });
      }
      if (insight.includes('🎉') || insight.includes('이벤트')) {
        contexts.push({ icon: '🎉', text: '이벤트', variant: 'default' });
      }
      if (insight.includes('🏖️') || insight.includes('공휴일')) {
        contexts.push({ icon: '🏖️', text: '공휴일', variant: 'outline' });
      }
    });
    
    return contexts;
  }, [contextInsights]);
  
  const [heatmapData, setHeatmapData] = useState(() => 
    generateHeatmapData(timeOfDay, visitsData, heatPoints)
  );

  // timeOfDay나 heatPoints가 변경되면 히트맵 재생성
  useEffect(() => {
    setHeatmapData(generateHeatmapData(timeOfDay, visitsData, heatPoints));
  }, [timeOfDay, visitsData, heatPoints]);

  // 실제 데이터 기반 시간대별 통계 계산
  const timeSlotStats = useMemo(() => {
    if (visitsData.length === 0) {
      return {
        morning: 0,
        lunch: 0,
        afternoon: 0,
        evening: 0
      };
    }

    const slots = {
      morning: visitsData.filter((v: any) => {
        const hour = v.visit_hour ? parseInt(v.visit_hour) : 12;
        return hour >= 9 && hour < 12;
      }).length,
      lunch: visitsData.filter((v: any) => {
        const hour = v.visit_hour ? parseInt(v.visit_hour) : 12;
        return hour >= 12 && hour < 15;
      }).length,
      afternoon: visitsData.filter((v: any) => {
        const hour = v.visit_hour ? parseInt(v.visit_hour) : 12;
        return hour >= 15 && hour < 18;
      }).length,
      evening: visitsData.filter((v: any) => {
        const hour = v.visit_hour ? parseInt(v.visit_hour) : 12;
        return hour >= 18 && hour <= 23;
      }).length,
    };

    // 비율로 변환 (최대값 대비)
    const maxVisits = Math.max(slots.morning, slots.lunch, slots.afternoon, slots.evening, 1);
    return {
      morning: Math.round((slots.morning / maxVisits) * 100),
      lunch: Math.round((slots.lunch / maxVisits) * 100),
      afternoon: Math.round((slots.afternoon / maxVisits) * 100),
      evening: Math.round((slots.evening / maxVisits) * 100),
    };
  }, [visitsData]);

  // 실제 데이터 기반 인사이트 생성
  const insight = useMemo(() => {
    if (visitsData.length === 0) {
      return "데이터가 없습니다. 방문 데이터를 업로드해주세요.";
    }

    const peakSlot = Object.entries(timeSlotStats).reduce((max, [key, value]) => 
      value > max.value ? { key, value } : max
    , { key: 'lunch', value: 0 });

    const slotNames: Record<string, string> = {
      morning: '오전(09-12시)',
      lunch: '점심(12-15시)',
      afternoon: '오후(15-18시)',
      evening: '저녁(18-23시)'
    };

    const peakName = slotNames[peakSlot.key] || '점심시간';
    
    // 핫스팟 위치 분석
    const hotspotCells = heatmapData.filter(d => d.intensity > 0.7);
    let locationHint = "매장 전체에 고르게 분포";
    
    if (hotspotCells.length > 0) {
      const avgX = hotspotCells.reduce((sum, cell) => sum + cell.x, 0) / hotspotCells.length;
      const avgY = hotspotCells.reduce((sum, cell) => sum + cell.y, 0) / hotspotCells.length;
      
      if (avgY < 7) locationHint = "입구 근처에 집중";
      else if (avgX > 12) locationHint = "우측 구역에 집중";
      else if (avgX < 8) locationHint = "좌측 구역에 집중";
      else locationHint = "중앙 통로에 집중";
    }

    return `${peakName} 트래픽 집중. ${locationHint}되어 있어 해당 구역에 인기 상품 배치를 권장합니다.`;
  }, [visitsData, timeSlotStats, heatmapData]);

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
              {/* Context Badges */}
              {currentTimeContexts.map((ctx, idx) => (
                <Badge key={idx} variant={ctx.variant} className="text-xs">
                  {ctx.icon} {ctx.text}
                </Badge>
              ))}
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
                <span className={`font-medium ${timeSlotStats.morning === Math.max(timeSlotStats.morning, timeSlotStats.lunch, timeSlotStats.afternoon, timeSlotStats.evening) ? 'text-primary' : ''}`}>
                  {timeSlotStats.morning}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">점심 (12-15)</span>
                <span className={`font-medium ${timeSlotStats.lunch === Math.max(timeSlotStats.morning, timeSlotStats.lunch, timeSlotStats.afternoon, timeSlotStats.evening) ? 'text-primary' : ''}`}>
                  {timeSlotStats.lunch}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">오후 (15-18)</span>
                <span className={`font-medium ${timeSlotStats.afternoon === Math.max(timeSlotStats.morning, timeSlotStats.lunch, timeSlotStats.afternoon, timeSlotStats.evening) ? 'text-primary' : ''}`}>
                  {timeSlotStats.afternoon}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">저녁 (18-23)</span>
                <span className={`font-medium ${timeSlotStats.evening === Math.max(timeSlotStats.morning, timeSlotStats.lunch, timeSlotStats.afternoon, timeSlotStats.evening) ? 'text-primary' : ''}`}>
                  {timeSlotStats.evening}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="glass p-4 bg-primary/5 border-primary/20">
            <p className="text-xs">
              <span className="font-semibold">인사이트:</span> {insight}
            </p>
          </Card>

          {/* Context Insights */}
          {contextInsights.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold">컨텍스트 분석</h5>
              {contextInsights.map((contextInsight, idx) => (
                <Card key={idx} className="glass p-3">
                  <p className="text-xs leading-relaxed">{contextInsight}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
