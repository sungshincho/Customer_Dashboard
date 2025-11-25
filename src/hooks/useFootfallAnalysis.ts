import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface FootfallData {
  date: string;
  hour: number;
  visit_count: number;
  unique_visitors: number;
  avg_duration_minutes: number;
  // 컨텍스트 데이터
  weather_condition?: string;
  temperature?: number;
  is_holiday?: boolean;
  event_name?: string;
  event_type?: string;
  regional_traffic?: number;
}

export interface FootfallStats {
  total_visits: number;
  unique_visitors: number;
  avg_visits_per_hour: number;
  peak_hour: number | null;
  peak_hour_visits: number;
  daily_trend: number; // % change from previous period
  // 컨텍스트 인사이트
  weather_impact?: string;
  holiday_impact?: string;
  regional_comparison?: string;
}

export function useFootfallAnalysis(storeId?: string, startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['footfall-analysis', storeId, startDate, endDate],
    queryFn: async () => {
      if (!user || !storeId) {
        return {
          data: [],
          stats: {
            total_visits: 0,
            unique_visitors: 0,
            avg_visits_per_hour: 0,
            peak_hour: null,
            peak_hour_visits: 0,
            daily_trend: 0,
          }
        };
      }

      const start = startDate || subDays(new Date(), 7);
      const end = endDate || new Date();

      // wifi_tracking 데이터에서 유입 분석 (실제 임포트된 데이터만 사용)
      const { data: trackingData, error: trackingError } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .gte('timestamp', startOfDay(start).toISOString())
        .lte('timestamp', endOfDay(end).toISOString());

      if (trackingError) {
        console.error('WiFi tracking data fetch error:', trackingError);
        throw new Error('WiFi 트래킹 데이터를 불러오는데 실패했습니다.');
      }

      // graph_entities에서 방문 데이터 가져오기 (실제 임포트된 온톨로지 데이터만 사용)
      const { data: visits, error: visitsError } = await supabase
        .from('graph_entities')
        .select('properties, created_at')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .gte('created_at', startOfDay(start).toISOString())
        .lte('created_at', endOfDay(end).toISOString());

      if (visitsError) {
        console.error('Graph entities data fetch error:', visitsError);
        throw new Error('방문 데이터를 불러오는데 실패했습니다.');
      }

      // Skip weather and regional data until tables are created
      // TODO: Implement weather_data and regional_data tables
      const weatherData: any[] = [];
      const regionalData: any[] = [];
      
      // Fetch holidays
      const { data: holidaysData } = await supabase
        .from('holidays_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      // 시간대별 집계 (컨텍스트 데이터 포함)
      const hourlyData = new Map<string, FootfallData>();
      
      visits?.forEach((visit) => {
        const timestamp = new Date(visit.created_at);
        const dateKey = format(timestamp, 'yyyy-MM-dd');
        const hour = timestamp.getHours();
        const key = `${dateKey}-${hour}`;

        if (!hourlyData.has(key)) {
          const weather = null; // weatherData disabled
          const holiday = holidaysData?.find(h => h.date === dateKey);
          const regional = null; // regionalData disabled

          hourlyData.set(key, {
            date: dateKey,
            hour,
            visit_count: 0,
            unique_visitors: 0,
            avg_duration_minutes: 0,
            weather_condition: weather?.weather_condition,
            temperature: weather?.temperature ? Number(weather.temperature) : undefined,
            is_holiday: !!holiday,
            event_name: holiday?.event_name,
            event_type: holiday?.event_type,
            regional_traffic: regional?.value ? Number(regional.value) : undefined,
          });
        }

        const data = hourlyData.get(key)!;
        data.visit_count += 1;
      });

      // WiFi 트래킹으로 고유 방문자 및 체류시간 계산
      const sessionMap = new Map<string, { start: Date; end: Date }>();
      trackingData?.forEach((point) => {
        const dateKey = format(new Date(point.timestamp), 'yyyy-MM-dd');
        const hour = new Date(point.timestamp).getHours();
        const key = `${dateKey}-${hour}-${point.session_id}`;

        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            start: new Date(point.timestamp),
            end: new Date(point.timestamp),
          });
        } else {
          const session = sessionMap.get(key)!;
          const timestamp = new Date(point.timestamp);
          if (timestamp > session.end) {
            session.end = timestamp;
          }
        }
      });

      // 세션 데이터를 hourlyData에 통합
      sessionMap.forEach((session, key) => {
        const [dateKey, hourStr] = key.split('-');
        const hour = parseInt(hourStr);
        const hourKey = `${dateKey}-${hour}`;
        
        if (hourlyData.has(hourKey)) {
          const data = hourlyData.get(hourKey)!;
          data.unique_visitors += 1;
          const durationMinutes = (session.end.getTime() - session.start.getTime()) / (1000 * 60);
          data.avg_duration_minutes = (data.avg_duration_minutes + durationMinutes) / 2;
        }
      });

      const footfallData = Array.from(hourlyData.values()).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.hour - b.hour;
      });

      // 통계 계산
      const totalVisits = footfallData.reduce((sum, d) => sum + d.visit_count, 0);
      const totalUniqueVisitors = footfallData.reduce((sum, d) => sum + d.unique_visitors, 0);
      const hoursWithData = footfallData.filter(d => d.visit_count > 0).length;
      
      // 피크 시간대 찾기 (데이터가 없으면 null 처리)
      let peakHour: number | null = null;
      let peakHourVisits = 0;

      if (footfallData.length > 0) {
        const peakData = footfallData.reduce(
          (max, d) => (d.visit_count > max.visit_count ? d : max),
          footfallData[0]
        );
        peakHour = peakData.hour;
        peakHourVisits = peakData.visit_count;
      }

      // 컨텍스트 기반 인사이트 생성
      const weatherImpact = generateWeatherImpact(footfallData);
      const holidayImpact = generateHolidayImpact(footfallData);
      const regionalComparison = generateRegionalComparison(footfallData);

      const stats: FootfallStats = {
        total_visits: totalVisits,
        unique_visitors: totalUniqueVisitors,
        avg_visits_per_hour: hoursWithData > 0 ? totalVisits / hoursWithData : 0,
        peak_hour: peakHour,
        peak_hour_visits: peakHourVisits,
        daily_trend: 0, // TODO: 이전 기간과 비교
        weather_impact: weatherImpact,
        holiday_impact: holidayImpact,
        regional_comparison: regionalComparison,
      };

      return {
        data: footfallData,
        stats,
      };
    },
    enabled: !!user && !!storeId,
  });
}

// 컨텍스트 인사이트 생성 함수들
function generateWeatherImpact(data: FootfallData[]): string | undefined {
  const rainyDays = data.filter(d => d.weather_condition === 'rainy');
  const sunnyDays = data.filter(d => d.weather_condition === 'sunny');
  
  if (rainyDays.length === 0 || sunnyDays.length === 0) return undefined;
  
  const rainyAvg = rainyDays.reduce((sum, d) => sum + d.visit_count, 0) / rainyDays.length;
  const sunnyAvg = sunnyDays.reduce((sum, d) => sum + d.visit_count, 0) / sunnyDays.length;
  const diff = ((rainyAvg - sunnyAvg) / sunnyAvg) * 100;
  
  if (Math.abs(diff) < 5) return undefined;
  
  return diff < 0
    ? `비 오는 날 방문 ${Math.abs(diff).toFixed(0)}% 감소`
    : `비 오는 날 방문 ${diff.toFixed(0)}% 증가`;
}

function generateHolidayImpact(data: FootfallData[]): string | undefined {
  const holidays = data.filter(d => d.is_holiday);
  const regularDays = data.filter(d => !d.is_holiday);
  
  if (holidays.length === 0 || regularDays.length === 0) return undefined;
  
  const holidayAvg = holidays.reduce((sum, d) => sum + d.visit_count, 0) / holidays.length;
  const regularAvg = regularDays.reduce((sum, d) => sum + d.visit_count, 0) / regularDays.length;
  const diff = ((holidayAvg - regularAvg) / regularAvg) * 100;
  
  if (Math.abs(diff) < 10) return undefined;
  
  const eventName = holidays[0]?.event_name || '공휴일/이벤트';
  return diff < 0
    ? `${eventName} 기간 방문 ${Math.abs(diff).toFixed(0)}% 감소`
    : `${eventName} 기간 방문 ${diff.toFixed(0)}% 증가`;
}

function generateRegionalComparison(data: FootfallData[]): string | undefined {
  const withRegional = data.filter(d => d.regional_traffic);
  
  if (withRegional.length === 0) return undefined;
  
  const avgStoreVisits = withRegional.reduce((sum, d) => sum + d.visit_count, 0) / withRegional.length;
  const avgRegionalTraffic = withRegional.reduce((sum, d) => sum + (d.regional_traffic || 0), 0) / withRegional.length;
  
  if (avgRegionalTraffic === 0) return undefined;
  
  const captureRate = (avgStoreVisits / avgRegionalTraffic) * 100;
  
  return `상권 유동인구 대비 ${captureRate.toFixed(1)}% 유입률`;
}

export function useHourlyFootfall(storeId?: string, date?: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hourly-footfall', storeId, date],
    queryFn: async () => {
      if (!user || !storeId) return [];

      const targetDate = date || new Date();
      
      const { data: visits, error } = await supabase
        .from('graph_entities')
        .select('properties, created_at')
        .eq('user_id', user.id)
        .eq('store_id', storeId)
        .gte('created_at', startOfDay(targetDate).toISOString())
        .lte('created_at', endOfDay(targetDate).toISOString());

      if (error) throw error;

      // 시간대별 집계
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        visits: 0,
        time: `${hour.toString().padStart(2, '0')}:00`,
      }));

      visits?.forEach((visit) => {
        const hour = new Date(visit.created_at).getHours();
        hourlyData[hour].visits += 1;
      });

      return hourlyData;
    },
    enabled: !!user && !!storeId,
  });
}
