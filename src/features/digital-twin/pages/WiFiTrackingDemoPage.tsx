import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Store3DViewer } from '../components/Store3DViewer';
import { WiFiTrackingOverlay } from '../components/overlays/WiFiTrackingOverlay';
import { loadWiFiTrackingData, filterByTimeRange, convertToHeatmapData, extractCustomerPaths, groupBySession, estimateUniqueVisitors } from '@/utils/wifiDataLoader';
import { trilaterate } from '../utils/coordinateMapper';
import type { TrackingData, SensorPosition } from '../types/iot.types';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';

export default function WiFiTrackingDemoPage() {
  const { user } = useAuth();
  const { selectedStore } = useSelectedStore();
  
  const [sensors, setSensors] = useState<SensorPosition[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [processedData, setProcessedData] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'realtime' | 'heatmap' | 'paths'>('realtime');
  
  // 재생 컨트롤
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [user, selectedStore]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await loadWiFiTrackingData(
        user?.id,
        selectedStore?.id
      );
      
      setSensors(data.sensors);
      setTrackingData(data.trackingData);
      
      // 좌표가 없는 데이터는 Trilateration으로 추정
      const processed = data.trackingData.map(point => {
        if (point.x !== undefined && point.z !== undefined) {
          return point;
        }
        
        // 같은 시간대의 다른 센서 데이터 찾기
        const relatedData = data.trackingData.filter(
          d => d.customer_id === point.customer_id &&
               Math.abs(d.timestamp - point.timestamp) < 2000
        );
        
        const position = trilaterate(relatedData, data.sensors);
        
        return {
          ...point,
          x: position?.x || 5,
          z: position?.z || 5,
          accuracy: position?.accuracy || 10
        };
      });
      
      setProcessedData(processed);
      
      if (processed.length > 0) {
        setCurrentTime(processed[0].timestamp);
      }
    } catch (error) {
      console.error('WiFi 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 재생 애니메이션
  useEffect(() => {
    if (!isPlaying || processedData.length === 0) return;
    
    const minTime = Math.min(...processedData.map(d => d.timestamp));
    const maxTime = Math.max(...processedData.map(d => d.timestamp));
    
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + (100 * playbackSpeed);
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, processedData]);

  const handleReset = () => {
    if (processedData.length > 0) {
      setCurrentTime(Math.min(...processedData.map(d => d.timestamp)));
    }
    setIsPlaying(false);
  };

  const timeRange = processedData.length > 0
    ? [
        Math.min(...processedData.map(d => d.timestamp)),
        Math.max(...processedData.map(d => d.timestamp))
      ]
    : [0, 0];

  // 세션 기반 통계 (MAC 랜덤화 대응)
  const sessions = groupBySession(processedData);
  const estimatedVisitors = estimateUniqueVisitors(processedData);
  
  const stats = {
    totalPoints: processedData.length,
    uniqueMACs: new Set(processedData.map(d => d.customer_id)).size,
    estimatedSessions: sessions.size,
    estimatedVisitors: estimatedVisitors,
    sensors: sensors.length,
    timeSpan: timeRange[1] - timeRange[0]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold">WiFi 트래킹 데이터 로드 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WiFi Probe Request 시각화</h1>
        <p className="text-muted-foreground">라즈베리파이 WiFi 트래킹 데이터 3D 시각화</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">총 신호</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">데이터 포인트</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">고유 MAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueMACs}</div>
            <p className="text-xs text-muted-foreground mt-1">⚠️ 랜덤화됨</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">추정 세션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.estimatedSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">그룹핑 결과</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">추정 방문자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.estimatedVisitors}</div>
            <p className="text-xs text-muted-foreground mt-1">시간당 평균</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">센서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sensors}</div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round(stats.timeSpan / 1000)}초 수집</p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 시각화 */}
      <Card>
        <CardHeader>
          <CardTitle>3D 시각화</CardTitle>
          <CardDescription>WiFi 신호 기반 실시간 위치 추적</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 시각화 모드 선택 */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="realtime">실시간</TabsTrigger>
              <TabsTrigger value="heatmap">히트맵</TabsTrigger>
              <TabsTrigger value="paths">경로</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 재생 컨트롤 */}
          {mode === 'realtime' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  {new Date(currentTime).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm">속도:</span>
                  <Button
                    size="sm"
                    variant={playbackSpeed === 1 ? 'default' : 'outline'}
                    onClick={() => setPlaybackSpeed(1)}
                  >
                    1x
                  </Button>
                  <Button
                    size="sm"
                    variant={playbackSpeed === 2 ? 'default' : 'outline'}
                    onClick={() => setPlaybackSpeed(2)}
                  >
                    2x
                  </Button>
                  <Button
                    size="sm"
                    variant={playbackSpeed === 5 ? 'default' : 'outline'}
                    onClick={() => setPlaybackSpeed(5)}
                  >
                    5x
                  </Button>
                </div>
              </div>
              
              <Slider
                value={[currentTime]}
                min={timeRange[0]}
                max={timeRange[1]}
                step={1000}
                onValueChange={([value]) => setCurrentTime(value)}
                className="w-full"
              />
            </div>
          )}

          {/* 3D 뷰어 */}
          <div className="border rounded-lg overflow-hidden">
            <Store3DViewer
              height="600px"
              overlay={
                <WiFiTrackingOverlay
                  trackingData={processedData}
                  mode={mode}
                  currentTime={mode === 'realtime' ? currentTime : undefined}
                  timeWindow={30000}
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 센서 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>센서 배치</CardTitle>
          <CardDescription>매장 내 WiFi 센서 위치 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sensors.map(sensor => (
              <div key={sensor.sensor_id} className="border rounded-lg p-3">
                <div className="font-semibold">{sensor.sensor_id}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  위치: ({sensor.x.toFixed(1)}, {sensor.y.toFixed(1)}, {sensor.z.toFixed(1)})
                </div>
                <div className="text-sm text-muted-foreground">
                  반경: {sensor.coverage_radius}m
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
