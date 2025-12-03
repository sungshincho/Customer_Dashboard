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
  const { user, orgId } = useAuth();

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

      // L2 visits 테이블에서 직접 방문 데이터 조회 (3-Layer Architecture)
      // org_id 기반 조회 (조직 내 데이터 공유)
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('visit_date', startOfDay(start).toISOString())
        .lte('visit_date', endOfDay(end).toISOString());

      if (visitsError) {
        console.error('Visits data fetch error:', visitsError);
        throw new Error('방문 데이터를 불러오는데 실패했습니다.');
      }

      // wifi_tracking 데이터에서 추가 분석 (있는 경우에만)
      const { data: trackingData } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('timestamp', startOfDay(start).toISOString())
        .lte('timestamp', endOfDay(end).toISOString());

      // Fetch weather data
      const { data: weatherData } = await supabase
        .from('weather_data')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      // Fetch regional data
      const { data: regionalData } = await supabase
        .from('regional_data')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      
      // Fetch holidays
      const { data: holidaysData } = await supabase
        .from('holidays_events')
        .select('*')
        .eq('org_id', orgId)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      // 시간대별 집계 (컨텍스트 데이터 포함)
      const hourlyData = new Map<string, FootfallData>();
      const uniqueVisitors = new Set<string>();
      
      visits?.forEach((visit: any) => {
        const timestamp = new Date(visit.visit_date);
        const dateKey = format(timestamp, 'yyyy-MM-dd');
        const hour = timestamp.getHours();
        const key = `${dateKey}-${hour}`;

        if (!hourlyData.has(key)) {
          const weather = weatherData?.find(w => w.date === dateKey);
          const holiday = holidaysData?.find(h => h.date === dateKey);
          const regional = regionalData?.find(r => r.date === dateKey);

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
            regional_traffic: regional?.population ? Number(regional.population) : undefined,
          });
        }

        const data = hourlyData.get(key)!;
        data.visit_count += 1;
        
        // 고유 방문자 카운트 (customer_id 또는 visitor_id 기반)
        const visitorKey = visit.customer_id || visit.visitor_id || visit.id;
        if (visitorKey && !uniqueVisitors.has(visitorKey)) {
          uniqueVisitors.add(visitorKey);
          data.unique_visitors += 1;
        }
        
        // 체류 시간 계산 (duration_minutes 컬럼이 있는 경우)
        if (visit.duration_minutes) {
          const currentAvg = data.avg_duration_minutes;
          data.avg_duration_minutes = currentAvg > 0 
            ? (currentAvg + visit.duration_minutes) / 2 
            : visit.duration_minutes;
        }
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
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hourly-footfall', storeId, date],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const targetDate = date || new Date();
      
      // L2 visits 테이블에서 직접 조회 (org_id 기반)
      const { data: visits, error } = await supabase
        .from('visits')
        .select('*')
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .gte('visit_date', startOfDay(targetDate).toISOString())
        .lte('visit_date', endOfDay(targetDate).toISOString());

      if (error) throw error;

      // 시간대별 집계
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        visits: 0,
        time: `${hour.toString().padStart(2, '0')}:00`,
      }));

      visits?.forEach((visit: any) => {
        const hour = new Date(visit.visit_date).getHours();
        hourlyData[hour].visits += 1;
      });

      return hourlyData;
    },
    enabled: !!user && !!storeId,
  });
}
