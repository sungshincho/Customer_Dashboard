import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ZoneCoordinate {
  zone_id: string;
  zone_name: string;
  x: number;
  y: number;
  z?: number;
  type?: string;
}

interface TrafficData {
  person_id: string;
  zones: string[];
  timestamp_start: string;
  timestamp_end: string;
  dwell_times?: number[];
}

interface StoreHeatmapProps {
  zoneCoordinates: ZoneCoordinate[];
  trafficData: TrafficData[];
}

export const StoreHeatmap = ({ zoneCoordinates, trafficData }: StoreHeatmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [intensity, setIntensity] = useState([50]);
  const [radius, setRadius] = useState([30]);

  // 데이터 유효성 검증
  const validTrafficData = Array.isArray(trafficData) ? trafficData : [];
  const validZoneCoordinates = Array.isArray(zoneCoordinates) ? zoneCoordinates : [];

  useEffect(() => {
    if (!canvasRef.current || validZoneCoordinates.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const width = canvas.width = 800;
    const height = canvas.height = 600;

    // 좌표 정규화
    const xCoords = validZoneCoordinates.map(z => z.x).filter(x => typeof x === 'number' && !isNaN(x));
    const yCoords = validZoneCoordinates.map(z => z.y).filter(y => typeof y === 'number' && !isNaN(y));
    
    if (xCoords.length === 0 || yCoords.length === 0) return;
    
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const normalizeX = (x: number) => ((x - minX) / (maxX - minX || 1)) * (width - 100) + 50;
    const normalizeY = (y: number) => ((y - minY) / (maxY - minY || 1)) * (height - 100) + 50;

    // Zone별 방문 빈도 계산
    const zoneVisits = new Map<string, number>();
    validTrafficData.forEach(traffic => {
      const zones = Array.isArray(traffic.zones) ? traffic.zones : [];
      zones.forEach(zoneId => {
        if (zoneId) {
          zoneVisits.set(zoneId, (zoneVisits.get(zoneId) || 0) + 1);
        }
      });
    });

    const maxVisits = Math.max(...Array.from(zoneVisits.values()), 1);

    // 배경 그리기
    ctx.fillStyle = '#0A1020';
    ctx.fillRect(0, 0, width, height);

    // 히트맵 그리기 (방사형 그라디언트)
    validZoneCoordinates.forEach(zone => {
      if (typeof zone.x !== 'number' || typeof zone.y !== 'number' || isNaN(zone.x) || isNaN(zone.y)) return;
      
      const visits = zoneVisits.get(zone.zone_id) || 0;
      const heatIntensity = maxVisits > 0 ? visits / maxVisits : 0;
      const x = normalizeX(zone.x);
      const y = normalizeY(zone.y);
      const r = radius[0];

      // 방사형 그라디언트
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      const alpha = (heatIntensity * intensity[0]) / 100;
      
      gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });

    // Zone 포인트 및 라벨 그리기
    validZoneCoordinates.forEach(zone => {
      if (typeof zone.x !== 'number' || typeof zone.y !== 'number' || isNaN(zone.x) || isNaN(zone.y)) return;
      
      const visits = zoneVisits.get(zone.zone_id) || 0;
      const x = normalizeX(zone.x);
      const y = normalizeY(zone.y);

      // 포인트
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1B6BFF';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 라벨 (방문 빈도가 높은 경우만)
      if (visits > maxVisits * 0.3) {
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.zone_name || zone.zone_id, x, y - 10);
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#1B6BFF';
        ctx.fillText(`${visits}회`, x, y + 20);
      }
    });

  }, [validZoneCoordinates, validTrafficData, intensity, radius]);

  const totalVisits = validTrafficData.reduce((sum, t) => {
    const zones = Array.isArray(t.zones) ? t.zones : [];
    return sum + zones.length;
  }, 0);
  const uniqueCustomers = new Set(validTrafficData.map(t => t.person_id).filter(Boolean)).size;
  const avgZonesPerCustomer = uniqueCustomers > 0 ? totalVisits / uniqueCustomers : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          매장 히트맵
          <Badge variant="outline">실시간 동선 분석</Badge>
        </CardTitle>
        <CardDescription>
          고객 동선 데이터를 기반으로 한 Zone별 방문 빈도 히트맵
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-1">총 방문 수</p>
            <p className="text-2xl font-bold">{totalVisits}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-1">고유 고객 수</p>
            <p className="text-2xl font-bold">{uniqueCustomers}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-muted-foreground mb-1">평균 경유 Zone</p>
            <p className="text-2xl font-bold">{avgZonesPerCustomer.toFixed(1)}</p>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-background/50">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded"
            style={{ maxHeight: '600px' }}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>히트맵 강도</span>
              <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
            </Label>
            <Slider
              value={intensity}
              onValueChange={setIntensity}
              min={10}
              max={100}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>방사형 반경</span>
              <span className="text-sm text-muted-foreground">{radius[0]}px</span>
            </Label>
            <Slider
              value={radius}
              onValueChange={setRadius}
              min={10}
              max={80}
              step={5}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
            <span>낮은 빈도</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500/60 border border-blue-500" />
            <span>중간 빈도</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-500" />
            <span>높은 빈도</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
