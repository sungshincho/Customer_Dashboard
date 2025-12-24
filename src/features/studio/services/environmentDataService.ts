/**
 * environmentDataService.ts
 *
 * 환경 데이터 외부 API 서비스
 * - OpenWeatherMap: 실시간 날씨 데이터
 * - 공공데이터포털 / Calendarific: 공휴일 데이터
 * - Supabase: 매장 이벤트 데이터
 *
 * 📌 모든 데이터는 실제 외부 API 또는 DB 기반
 * 📌 하드코딩/Mock 데이터 사용 금지
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RealWeatherData,
  HolidayData,
  StoreEventData,
  WeatherCondition,
  HolidayType,
  OpenWeatherMapResponse,
  DataGoKrHolidayResponse,
  CalendarificResponse,
  EnvironmentServiceConfig,
  EnvironmentDataError,
} from '../types/environment.types';

// ============================================================================
// 환경 변수 및 설정
// ============================================================================

const getConfig = (): EnvironmentServiceConfig => ({
  // OpenWeatherMap
  weatherApiKey: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '',
  weatherApiBaseUrl: 'https://api.openweathermap.org/data/2.5',
  weatherCacheMinutes: 30,

  // 공휴일 API
  holidayApiKey: import.meta.env.VITE_DATA_GO_KR_API_KEY || '',
  holidayCalendarificKey: import.meta.env.VITE_CALENDARIFIC_API_KEY || '',
  holidayCacheHours: 24,

  // 기본 위치 (서울)
  defaultLocation: {
    lat: 37.5665,
    lon: 126.9780,
    city: 'Seoul',
    country: 'KR',
  },

  // 5분마다 자동 갱신
  autoRefreshIntervalMs: 5 * 60 * 1000,
});

// ============================================================================
// 캐시 시스템
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache: {
  weather: CacheEntry<RealWeatherData> | null;
  holidays: CacheEntry<HolidayData[]> | null;
  events: Map<string, CacheEntry<StoreEventData[]>>;
} = {
  weather: null,
  holidays: null,
  events: new Map(),
};

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

// ============================================================================
// 1. 날씨 데이터 서비스 (OpenWeatherMap)
// ============================================================================

/**
 * OpenWeatherMap condition code → WeatherCondition 변환
 */
function mapWeatherCondition(code: number): WeatherCondition {
  // https://openweathermap.org/weather-conditions
  if (code >= 200 && code < 300) return 'thunderstorm';
  if (code >= 300 && code < 400) return 'drizzle';
  if (code >= 500 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code === 701) return 'mist';
  if (code === 741) return 'fog';
  if (code === 721) return 'haze';
  if (code >= 700 && code < 800) return 'mist';
  if (code === 800) return 'clear';
  if (code > 800) return 'clouds';
  return 'clear';
}

/**
 * OpenWeatherMap API Response → RealWeatherData 변환
 */
function transformWeatherResponse(response: OpenWeatherMapResponse): RealWeatherData {
  const weather = response.weather[0];

  return {
    condition: mapWeatherCondition(weather.id),
    conditionCode: weather.id,
    description: weather.description,
    icon: weather.icon,

    temperature: response.main.temp,
    feelsLike: response.main.feels_like,
    tempMin: response.main.temp_min,
    tempMax: response.main.temp_max,

    humidity: response.main.humidity,
    pressure: response.main.pressure,
    visibility: response.visibility,
    windSpeed: response.wind.speed,
    windDeg: response.wind.deg,
    clouds: response.clouds.all,

    rain1h: response.rain?.['1h'],
    rain3h: response.rain?.['3h'],
    snow1h: response.snow?.['1h'],
    snow3h: response.snow?.['3h'],

    timestamp: response.dt,
    sunrise: response.sys.sunrise,
    sunset: response.sys.sunset,
    timezone: response.timezone,
    cityName: response.name,
    countryCode: response.sys.country,

    source: 'openweathermap',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * 실시간 날씨 데이터 조회
 */
export async function fetchWeatherData(
  lat?: number,
  lon?: number
): Promise<{ data: RealWeatherData | null; error: EnvironmentDataError | null }> {
  const config = getConfig();

  // ✅ 프론트엔드에서는 환경변수(API 키)를 직접 읽지 않고, Edge Function을 통해 프록시 호출
  // (Settings > Environment Variables 값은 Edge Functions에서만 사용)

  // 캐시 확인
  if (isCacheValid(cache.weather)) {
    return { data: cache.weather!.data, error: null };
  }

  const latitude = lat ?? config.defaultLocation.lat;
  const longitude = lon ?? config.defaultLocation.lon;

  try {
    const { data, error } = await supabase.functions.invoke('environment-proxy', {
      body: { type: 'weather', lat: latitude, lon: longitude },
    });

    if (error) {
      throw new Error(error.message);
    }

    const rawData = data as OpenWeatherMapResponse;
    const weatherData = transformWeatherResponse(rawData);

    // 캐시 업데이트
    cache.weather = {
      data: weatherData,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.weatherCacheMinutes * 60 * 1000,
    };

    console.log('[EnvironmentData] 날씨 데이터 조회 성공:', weatherData.condition, weatherData.temperature + '°C');
    return { data: weatherData, error: null };
  } catch (error) {
    console.error('[EnvironmentData] 날씨 데이터 조회 실패:', error);
    return {
      data: null,
      error: {
        type: 'WEATHER_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown weather API error',
      },
    };
  }
}

// ============================================================================
// 2. 공휴일 데이터 서비스
// ============================================================================

/**
 * 공공데이터포털 API Response → HolidayData 변환
 */
function transformDataGoKrResponse(response: DataGoKrHolidayResponse): HolidayData[] {
  const items = response.response?.body?.items?.item;
  if (!items || !Array.isArray(items)) return [];

  return items.map((item) => {
    const dateStr = String(item.locdate);
    const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

    // 쇼핑 시즌 판별
    const shoppingHolidays = ['설날', '추석', '크리스마스', '어린이날', '어버이날'];
    const isShoppingHoliday = shoppingHolidays.some((h) => item.dateName.includes(h));

    return {
      date: formattedDate,
      name: item.dateName,
      localName: item.dateName,
      type: item.isHoliday === 'Y' ? 'public' : 'observance',
      isHoliday: item.isHoliday === 'Y',
      countryCode: 'KR',
      isShoppingHoliday,
      expectedTrafficMultiplier: isShoppingHoliday ? 1.5 : item.isHoliday === 'Y' ? 1.2 : 1.0,
      source: 'data-go-kr',
      fetchedAt: new Date().toISOString(),
    } as HolidayData;
  });
}

/**
 * Calendarific API Response → HolidayData 변환
 */
function transformCalendarificResponse(response: CalendarificResponse): HolidayData[] {
  const holidays = response.response?.holidays;
  if (!holidays || !Array.isArray(holidays)) return [];

  return holidays.map((item) => {
    const typeMapping: Record<string, HolidayType> = {
      'National holiday': 'national',
      'Public holiday': 'public',
      'Observance': 'observance',
      'Common local holiday': 'public',
    };

    const isPublicHoliday = item.type.some(
      (t) => t.includes('National') || t.includes('Public') || t.includes('holiday')
    );

    // 쇼핑 시즌 판별
    const shoppingHolidays = ['Chuseok', 'Seollal', 'Christmas', 'Children', 'Parents'];
    const isShoppingHoliday = shoppingHolidays.some((h) =>
      item.name.toLowerCase().includes(h.toLowerCase())
    );

    return {
      date: item.date.iso.split('T')[0],
      name: item.name,
      localName: item.name,
      type: typeMapping[item.primary_type] || 'observance',
      isHoliday: isPublicHoliday,
      countryCode: item.country.id,
      isShoppingHoliday,
      expectedTrafficMultiplier: isShoppingHoliday ? 1.5 : isPublicHoliday ? 1.2 : 1.0,
      source: 'calendarific',
      fetchedAt: new Date().toISOString(),
    } as HolidayData;
  });
}

/**
 * 공휴일 데이터 조회 (공공데이터포털 우선, Calendarific 폴백)
 */
export async function fetchHolidayData(
  year?: number,
  month?: number,
  countryCode: string = 'KR'
): Promise<{ data: HolidayData[]; error: EnvironmentDataError | null }> {
  const config = getConfig();
  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth() + 1;

  // 캐시 확인
  if (isCacheValid(cache.holidays)) {
    return { data: cache.holidays!.data, error: null };
  }

  let holidays: HolidayData[] = [];
  let error: EnvironmentDataError | null = null;

  // 1. 공공데이터포털 API 시도 (한국)
  if (countryCode === 'KR' && config.holidayApiKey) {
    try {
      const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${config.holidayApiKey}&solYear=${targetYear}&solMonth=${String(targetMonth).padStart(2, '0')}&_type=json`;

      const response = await fetch(url);
      if (response.ok) {
        const rawData: DataGoKrHolidayResponse = await response.json();
        holidays = transformDataGoKrResponse(rawData);
        console.log('[EnvironmentData] 공공데이터포털 공휴일 조회 성공:', holidays.length, '건');
      }
    } catch (e) {
      console.warn('[EnvironmentData] 공공데이터포털 API 실패, Calendarific 폴백:', e);
    }
  }

  // 2. Calendarific API 폴백
  if (holidays.length === 0 && config.holidayCalendarificKey) {
    try {
      const url = `https://calendarific.com/api/v2/holidays?api_key=${config.holidayCalendarificKey}&country=${countryCode}&year=${targetYear}&month=${targetMonth}`;

      const response = await fetch(url);
      if (response.ok) {
        const rawData: CalendarificResponse = await response.json();
        holidays = transformCalendarificResponse(rawData);
        console.log('[EnvironmentData] Calendarific 공휴일 조회 성공:', holidays.length, '건');
      }
    } catch (e) {
      console.warn('[EnvironmentData] Calendarific API 실패:', e);
      error = {
        type: 'HOLIDAY_API_ERROR',
        message: e instanceof Error ? e.message : 'Holiday API error',
      };
    }
  }

  // API 키가 모두 없는 경우
  if (!config.holidayApiKey && !config.holidayCalendarificKey) {
    console.warn('[EnvironmentData] 공휴일 API 키가 설정되지 않았습니다.');
    error = {
      type: 'CONFIG_ERROR',
      message: 'VITE_DATA_GO_KR_API_KEY 또는 VITE_CALENDARIFIC_API_KEY 환경 변수가 필요합니다.',
    };
  }

  // 캐시 업데이트
  if (holidays.length > 0) {
    cache.holidays = {
      data: holidays,
      timestamp: Date.now(),
      expiresAt: Date.now() + config.holidayCacheHours * 60 * 60 * 1000,
    };
  }

  return { data: holidays, error };
}

/**
 * 오늘 공휴일 여부 확인
 */
export async function getTodayHoliday(): Promise<HolidayData | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data: holidays } = await fetchHolidayData();

  return holidays.find((h) => h.date === today) || null;
}

/**
 * 다가오는 공휴일 조회 (향후 N일)
 */
export async function getUpcomingHolidays(days: number = 30): Promise<HolidayData[]> {
  const { data: holidays } = await fetchHolidayData();

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return holidays.filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate >= today && holidayDate <= futureDate;
  });
}

// ============================================================================
// 3. 매장 이벤트 데이터 서비스 (Supabase)
// ============================================================================

/**
 * 매장 이벤트 조회
 */
export async function fetchStoreEvents(
  storeId: string,
  options?: {
    status?: 'active' | 'scheduled' | 'all';
    startDate?: string;
    endDate?: string;
  }
): Promise<{ data: StoreEventData[]; error: EnvironmentDataError | null }> {
  // 캐시 확인
  const cacheKey = `${storeId}-${options?.status || 'all'}`;
  const cachedEntry = cache.events.get(cacheKey);
  if (cachedEntry && isCacheValid(cachedEntry)) {
    return { data: cachedEntry.data, error: null };
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    let query = (supabase
      .from('zone_events' as any)
      .select('*')
      .eq('store_id', storeId)) as any;

    // 상태 필터 (zone_events는 "예정" 이벤트가 아닌 로그 성격이므로 날짜 기준으로 단순 매핑)
    if (options?.status === 'active') {
      query = query.eq('event_date', today);
    } else if (options?.status === 'scheduled') {
      query = query.gt('event_date', today);
    }

    // 날짜 범위 필터 (event_timestamp 기준)
    if (options?.startDate) {
      query = query.gte('event_timestamp', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('event_timestamp', options.endDate);
    }

    query = query.order('event_timestamp', { ascending: false }).limit(200);

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        console.warn('[EnvironmentData] zone_events 테이블이 없습니다. 빈 배열 반환.');
        return { data: [], error: null };
      }
      throw error;
    }

    const rows = (data || []) as any[];
    const events: StoreEventData[] = rows.map((row) => {
      const start = String(row.event_timestamp ?? new Date().toISOString());
      const durationSeconds = typeof row.duration_seconds === 'number' ? row.duration_seconds : 0;
      const end = new Date(new Date(start).getTime() + durationSeconds * 1000).toISOString();

      const status: StoreEventData['status'] =
        row.event_date === today ? 'active' : String(row.event_date) > today ? 'scheduled' : 'completed';

      return {
        id: String(row.id),
        store_id: String(row.store_id),
        event_name: `${row.event_type ?? 'event'} (zone ${row.zone_id ?? '-'})`,
        event_type: 'special',
        description: row.metadata ? JSON.stringify(row.metadata) : undefined,
        start_date: start,
        end_date: end,
        expected_traffic_increase: 0,
        expected_conversion_boost: 0,
        status,
        created_at: String(row.created_at ?? start),
        updated_at: String(row.created_at ?? start),
      };
    });

    // 캐시 업데이트 (5분)
    cache.events.set(cacheKey, {
      data: events,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log('[EnvironmentData] zone_events 기반 이벤트 조회 성공:', events.length, '건');
    return { data: events, error: null };
  } catch (error) {
    console.error('[EnvironmentData] 매장 이벤트 조회 실패:', error);
    return {
      data: [],
      error: {
        type: 'EVENTS_DB_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
      },
    };
  }
}

/**
 * 현재 활성 이벤트 조회
 */
export async function getActiveEvents(storeId: string): Promise<StoreEventData[]> {
  const { data } = await fetchStoreEvents(storeId, { status: 'active' });
  return data;
}

/**
 * 다가오는 이벤트 조회
 */
export async function getUpcomingEvents(storeId: string): Promise<StoreEventData[]> {
  const { data } = await fetchStoreEvents(storeId, { status: 'scheduled' });
  return data;
}

// ============================================================================
// 4. 매장 위치 조회 (날씨 API용)
// ============================================================================

interface StoreLocation {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

/**
 * 매장 위치 정보 조회
 */
export async function getStoreLocation(storeId: string): Promise<StoreLocation | null> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('metadata')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return null;
    }

    const metadata = data.metadata as Record<string, any> | null;
    if (metadata?.location) {
      return {
        lat: metadata.location.lat || getConfig().defaultLocation.lat,
        lon: metadata.location.lon || getConfig().defaultLocation.lon,
        city: metadata.location.city || getConfig().defaultLocation.city,
        country: metadata.location.country || getConfig().defaultLocation.country,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// 5. 통합 환경 데이터 조회
// ============================================================================

export interface EnvironmentDataBundle {
  weather: RealWeatherData | null;
  todayHoliday: HolidayData | null;
  upcomingHolidays: HolidayData[];
  activeEvents: StoreEventData[];
  upcomingEvents: StoreEventData[];
  errors: EnvironmentDataError[];
  fetchedAt: string;
}

/**
 * 모든 환경 데이터 통합 조회
 */
export async function fetchAllEnvironmentData(storeId: string): Promise<EnvironmentDataBundle> {
  const errors: EnvironmentDataError[] = [];

  // 매장 위치 조회
  const location = await getStoreLocation(storeId);

  // 병렬 데이터 조회
  const [weatherResult, holidaysResult, activeEventsResult, upcomingEventsResult] =
    await Promise.all([
      fetchWeatherData(location?.lat, location?.lon),
      fetchHolidayData(),
      fetchStoreEvents(storeId, { status: 'active' }),
      fetchStoreEvents(storeId, { status: 'scheduled' }),
    ]);

  // 에러 수집
  if (weatherResult.error) errors.push(weatherResult.error);
  if (holidaysResult.error) errors.push(holidaysResult.error);
  if (activeEventsResult.error) errors.push(activeEventsResult.error);
  if (upcomingEventsResult.error) errors.push(upcomingEventsResult.error);

  // 오늘 공휴일 확인
  const today = new Date().toISOString().split('T')[0];
  const todayHoliday = holidaysResult.data.find((h) => h.date === today) || null;

  // 다가오는 공휴일 (향후 30일)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const upcomingHolidays = holidaysResult.data.filter((h) => {
    const holidayDate = new Date(h.date);
    return holidayDate > new Date() && holidayDate <= futureDate;
  });

  return {
    weather: weatherResult.data,
    todayHoliday,
    upcomingHolidays,
    activeEvents: activeEventsResult.data,
    upcomingEvents: upcomingEventsResult.data,
    errors,
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 6. 캐시 관리
// ============================================================================

/**
 * 캐시 초기화
 */
export function clearEnvironmentCache(): void {
  cache.weather = null;
  cache.holidays = null;
  cache.events.clear();
  console.log('[EnvironmentData] 캐시가 초기화되었습니다.');
}

/**
 * 캐시 상태 확인
 */
export function getCacheStatus(): {
  weather: { valid: boolean; expiresIn?: number };
  holidays: { valid: boolean; expiresIn?: number };
  events: { count: number };
} {
  return {
    weather: {
      valid: isCacheValid(cache.weather),
      expiresIn: cache.weather ? Math.max(0, cache.weather.expiresAt - Date.now()) : undefined,
    },
    holidays: {
      valid: isCacheValid(cache.holidays),
      expiresIn: cache.holidays ? Math.max(0, cache.holidays.expiresAt - Date.now()) : undefined,
    },
    events: {
      count: cache.events.size,
    },
  };
}
