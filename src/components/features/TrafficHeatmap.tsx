import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

const generateHeatmapData = (timeOfDay: number): HeatmapCell[] => {
  const data: HeatmapCell[] = [];
  const gridSize = 10;

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      // Entrance area (top) has higher traffic
      const entranceBoost = y < 2 ? 0.5 : 0;
      // Center aisle has higher traffic
      const aisleBoost = x > 3 && x < 6 ? 0.3 : 0;
      // Time-based variation
      const timeMultiplier = Math.sin((timeOfDay / 24) * Math.PI) * 0.5 + 0.5;

      const baseIntensity = Math.random() * 0.3;
      const intensity = Math.min(
        1,
        (baseIntensity + entranceBoost + aisleBoost) * timeMultiplier
      );

      data.push({ x, y, intensity });
    }
  }

  return data;
};

export const TrafficHeatmap = () => {
  const [timeOfDay, setTimeOfDay] = useState(14); // 2 PM
  const [isPlaying, setIsPlaying] = useState(false);
  const [heatmapData, setHeatmapData] = useState(() => generateHeatmapData(14));

  const updateHeatmap = (newTime: number) => {
    setTimeOfDay(newTime);
    setHeatmapData(generateHeatmapData(newTime));
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    updateHeatmap(14);
  };

  useState(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => {
        const next = prev >= 23 ? 9 : prev + 1;
        setHeatmapData(generateHeatmapData(next));
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  });

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
      <div className="grid md:grid-cols-3 gap-6">
        {/* Heatmap Visualization */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">실시간 히트맵</h4>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {String(timeOfDay).padStart(2, "0")}:00
              </Badge>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handlePlay}>
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Card className="glass p-6">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 grid grid-cols-10 gap-1">
                {heatmapData.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`rounded-sm transition-all duration-300 ${getHeatColor(
                      cell.intensity
                    )}`}
                  />
                ))}
              </div>
              <div className="absolute top-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
                입구
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/10 rounded" />
                낮음
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500/50 rounded" />
                중간
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/90 rounded" />
                높음
              </span>
            </div>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">시간대 선택</label>
            <Slider
              value={[timeOfDay]}
              onValueChange={(v) => updateHeatmap(v[0])}
              min={9}
              max={23}
              step={1}
              disabled={isPlaying}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>09:00</span>
              <span>23:00</span>
            </div>
          </div>
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
