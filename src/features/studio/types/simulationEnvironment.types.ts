/**
 * simulationEnvironment.types.ts
 *
 * 시뮬레이션 환경 설정 타입 정의
 * - 실시간 vs 시뮬레이션 모드
 * - 날씨, 날짜, 휴일 설정
 * - 영향도 계산
 */

// ============================================================================
// 기본 타입
// ============================================================================

// 환경 모드
export type EnvironmentMode = 'realtime' | 'simulation';

// 날씨 조건 옵션
export type WeatherOption =
  | 'clear' // ☀️ 맑음
  | 'cloudy' // ☁️ 흐림
  | 'overcast' // 🌥️ 잔뜩 흐림
  | 'rain' // 🌧️ 비
  | 'heavyRain' // ⛈️ 폭우
  | 'snow' // ❄️ 눈
  | 'heavySnow' // 🌨️ 폭설
  | 'fog' // 🌫️ 안개
  | 'haze'; // 😷 미세먼지

// 요일 옵션
export type DayOfWeekOption =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// 휴일/이벤트 옵션
export type HolidayOption =
  | 'none' // 평일
  | 'weekend' // 주말
  | 'holiday' // 일반 공휴일
  | 'christmas' // 크리스마스
  | 'lunarNewYear' // 설날
  | 'chuseok' // 추석
  | 'blackFriday' // 블랙프라이데이
  | 'summerSale' // 여름 세일
  | 'winterSale'; // 겨울 세일

// 시간대 옵션
export type TimeOfDayOption = 'morning' | 'afternoon' | 'evening' | 'night';

// ============================================================================
// 시뮬레이션 환경 설정
// ============================================================================

export interface SimulationEnvironmentConfig {
  // 모드
  mode: EnvironmentMode;

  // 날짜/시간 설정
  date: Date;
  timeOfDay: TimeOfDayOption;
  dayOfWeek: DayOfWeekOption;

  // 날씨 설정
  weather: WeatherOption;
  temperature: number; // -20 ~ 40°C
  humidity: number; // 0 ~ 100%

  // 휴일/이벤트 설정
  holidayType: HolidayOption;
  customEventName?: string; // 커스텀 이벤트명

  // 계산된 영향도 (읽기 전용)
  calculatedImpact?: {
    trafficMultiplier: number;
    dwellTimeMultiplier: number;
    conversionMultiplier: number;
  };
}

// ============================================================================
// 메타데이터: 날씨 옵션
// ============================================================================

export interface WeatherOptionMeta {
  value: WeatherOption;
  label: string;
  emoji: string;
  trafficImpact: number;
  dwellTimeImpact: number;
}

export const WEATHER_OPTIONS: WeatherOptionMeta[] = [
  { value: 'clear', label: '맑음', emoji: '☀️', trafficImpact: 1.1, dwellTimeImpact: 0.95 },
  { value: 'cloudy', label: '흐림', emoji: '☁️', trafficImpact: 1.0, dwellTimeImpact: 1.0 },
  { value: 'overcast', label: '잔뜩 흐림', emoji: '🌥️', trafficImpact: 0.95, dwellTimeImpact: 1.05 },
  { value: 'rain', label: '비', emoji: '🌧️', trafficImpact: 0.7, dwellTimeImpact: 1.25 },
  { value: 'heavyRain', label: '폭우', emoji: '⛈️', trafficImpact: 0.4, dwellTimeImpact: 1.5 },
  { value: 'snow', label: '눈', emoji: '❄️', trafficImpact: 0.65, dwellTimeImpact: 1.2 },
  { value: 'heavySnow', label: '폭설', emoji: '🌨️', trafficImpact: 0.4, dwellTimeImpact: 1.4 },
  { value: 'fog', label: '안개', emoji: '🌫️', trafficImpact: 0.85, dwellTimeImpact: 1.1 },
  { value: 'haze', label: '미세먼지', emoji: '😷', trafficImpact: 0.75, dwellTimeImpact: 1.0 },
];

// ============================================================================
// 메타데이터: 휴일 옵션
// ============================================================================

export interface HolidayOptionMeta {
  value: HolidayOption;
  label: string;
  emoji: string;
  trafficImpact: number;
  conversionImpact: number;
  categories?: string[];
}

export const HOLIDAY_OPTIONS: HolidayOptionMeta[] = [
  { value: 'none', label: '평일', emoji: '📅', trafficImpact: 1.0, conversionImpact: 1.0 },
  { value: 'weekend', label: '주말', emoji: '🎉', trafficImpact: 1.35, conversionImpact: 1.05 },
  { value: 'holiday', label: '공휴일', emoji: '🏖️', trafficImpact: 1.2, conversionImpact: 1.0 },
  {
    value: 'christmas',
    label: '크리스마스',
    emoji: '🎄',
    trafficImpact: 1.8,
    conversionImpact: 1.2,
    categories: ['선물', '의류'],
  },
  {
    value: 'lunarNewYear',
    label: '설날',
    emoji: '🧧',
    trafficImpact: 0.4,
    conversionImpact: 0.9,
    categories: ['한복', '선물세트'],
  },
  {
    value: 'chuseok',
    label: '추석',
    emoji: '🥮',
    trafficImpact: 0.4,
    conversionImpact: 0.9,
    categories: ['선물세트'],
  },
  {
    value: 'blackFriday',
    label: '블랙프라이데이',
    emoji: '🛒',
    trafficImpact: 2.5,
    conversionImpact: 1.3,
    categories: ['전체'],
  },
  {
    value: 'summerSale',
    label: '여름 세일',
    emoji: '🌴',
    trafficImpact: 1.6,
    conversionImpact: 1.15,
    categories: ['여름의류'],
  },
  {
    value: 'winterSale',
    label: '겨울 세일',
    emoji: '🧥',
    trafficImpact: 1.6,
    conversionImpact: 1.15,
    categories: ['겨울의류'],
  },
];

// ============================================================================
// 메타데이터: 요일 옵션
// ============================================================================

export interface DayOfWeekOptionMeta {
  value: DayOfWeekOption;
  label: string;
  shortLabel: string;
  trafficImpact: number;
}

export const DAY_OF_WEEK_OPTIONS: DayOfWeekOptionMeta[] = [
  { value: 'monday', label: '월요일', shortLabel: '월', trafficImpact: 0.8 },
  { value: 'tuesday', label: '화요일', shortLabel: '화', trafficImpact: 0.85 },
  { value: 'wednesday', label: '수요일', shortLabel: '수', trafficImpact: 0.9 },
  { value: 'thursday', label: '목요일', shortLabel: '목', trafficImpact: 0.95 },
  { value: 'friday', label: '금요일', shortLabel: '금', trafficImpact: 1.1 },
  { value: 'saturday', label: '토요일', shortLabel: '토', trafficImpact: 1.4 },
  { value: 'sunday', label: '일요일', shortLabel: '일', trafficImpact: 1.3 },
];

// ============================================================================
// 메타데이터: 시간대 옵션
// ============================================================================

export interface TimeOfDayOptionMeta {
  value: TimeOfDayOption;
  label: string;
  emoji: string;
  hours: string;
  trafficImpact: number;
}

export const TIME_OF_DAY_OPTIONS: TimeOfDayOptionMeta[] = [
  { value: 'morning', label: '오전', emoji: '🌅', hours: '09:00-12:00', trafficImpact: 0.7 },
  { value: 'afternoon', label: '오후', emoji: '☀️', hours: '12:00-18:00', trafficImpact: 1.2 },
  { value: 'evening', label: '저녁', emoji: '🌆', hours: '18:00-21:00', trafficImpact: 0.9 },
  { value: 'night', label: '야간', emoji: '🌙', hours: '21:00-09:00', trafficImpact: 0.3 },
];

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * Date 객체에서 요일 옵션 추출
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeekOption {
  const days: DayOfWeekOption[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[date.getDay()];
}

/**
 * 날씨 옵션에서 설명 텍스트 가져오기
 */
export function getWeatherDescription(weather: WeatherOption): string {
  const meta = WEATHER_OPTIONS.find((w) => w.value === weather);
  return meta?.label || '맑음';
}

/**
 * 휴일 옵션에서 이름 가져오기
 */
export function getHolidayName(holiday: HolidayOption): string {
  const meta = HOLIDAY_OPTIONS.find((h) => h.value === holiday);
  return meta?.label || '';
}

/**
 * 시뮬레이션 환경 설정에서 영향도 계산
 */
export function calculateSimulationImpacts(config: SimulationEnvironmentConfig): {
  trafficMultiplier: number;
  dwellTimeMultiplier: number;
  conversionMultiplier: number;
} {
  const weatherMeta = WEATHER_OPTIONS.find((w) => w.value === config.weather);
  const holidayMeta = HOLIDAY_OPTIONS.find((h) => h.value === config.holidayType);
  const dayMeta = DAY_OF_WEEK_OPTIONS.find((d) => d.value === config.dayOfWeek);
  const timeMeta = TIME_OF_DAY_OPTIONS.find((t) => t.value === config.timeOfDay);

  // 기온 영향
  let tempImpact = 1.0;
  if (config.temperature < 0) tempImpact = 0.85;
  else if (config.temperature > 33) tempImpact = 0.8;
  else if (config.temperature >= 18 && config.temperature <= 25) tempImpact = 1.05;

  // 트래픽 영향 계산
  const trafficMultiplier =
    (weatherMeta?.trafficImpact || 1) *
    (holidayMeta?.trafficImpact || 1) *
    (dayMeta?.trafficImpact || 1) *
    (timeMeta?.trafficImpact || 1) *
    tempImpact;

  // 체류시간 영향
  const dwellTimeMultiplier = weatherMeta?.dwellTimeImpact || 1;

  // 전환율 영향
  const conversionMultiplier = holidayMeta?.conversionImpact || 1;

  return {
    trafficMultiplier: Math.round(trafficMultiplier * 100) / 100,
    dwellTimeMultiplier: Math.round(dwellTimeMultiplier * 100) / 100,
    conversionMultiplier: Math.round(conversionMultiplier * 100) / 100,
  };
}

/**
 * 기본 시뮬레이션 환경 설정 생성
 */
export function createDefaultSimulationConfig(): SimulationEnvironmentConfig {
  const now = new Date();
  return {
    mode: 'realtime',
    date: now,
    timeOfDay: 'afternoon',
    dayOfWeek: getDayOfWeekFromDate(now),
    weather: 'clear',
    temperature: 20,
    humidity: 50,
    holidayType: 'none',
  };
}

// ============================================================================
// 3D 렌더링 설정 변환
// ============================================================================

/**
 * 시간대별 조명 프리셋
 */
const TIME_OF_DAY_LIGHTING: Record<
  TimeOfDayOption,
  {
    ambientIntensity: number;
    ambientColor: string;
    directionalIntensity: number;
    directionalColor: string;
    directionalPosition: [number, number, number];
    environmentPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'studio';
  }
> = {
  morning: {
    ambientIntensity: 0.5,
    ambientColor: '#ffeedd',
    directionalIntensity: 0.8,
    directionalColor: '#ffeecc',
    directionalPosition: [-10, 15, 10],
    environmentPreset: 'dawn',
  },
  afternoon: {
    ambientIntensity: 0.6,
    ambientColor: '#ffffff',
    directionalIntensity: 1.0,
    directionalColor: '#ffffff',
    directionalPosition: [0, 20, 10],
    environmentPreset: 'city',
  },
  evening: {
    ambientIntensity: 0.4,
    ambientColor: '#ffddbb',
    directionalIntensity: 0.6,
    directionalColor: '#ff9955',
    directionalPosition: [15, 10, -5],
    environmentPreset: 'sunset',
  },
  night: {
    ambientIntensity: 0.2,
    ambientColor: '#334466',
    directionalIntensity: 0.1,
    directionalColor: '#6688aa',
    directionalPosition: [5, 15, 5],
    environmentPreset: 'night',
  },
};

/**
 * 날씨별 파티클 설정
 */
function getWeatherParticles(
  weather: WeatherOption
): {
  enabled: boolean;
  type: 'rain' | 'snow' | 'dust' | 'none';
  count: number;
  speed: number;
  intensity: number;
} {
  switch (weather) {
    case 'rain':
      return { enabled: true, type: 'rain', count: 2000, speed: 1.5, intensity: 0.7 };
    case 'heavyRain':
      return { enabled: true, type: 'rain', count: 5000, speed: 2.0, intensity: 1.0 };
    case 'snow':
      return { enabled: true, type: 'snow', count: 1500, speed: 0.3, intensity: 0.8 };
    case 'heavySnow':
      return { enabled: true, type: 'snow', count: 4000, speed: 0.5, intensity: 1.0 };
    case 'haze':
      return { enabled: true, type: 'dust', count: 500, speed: 0.1, intensity: 0.3 };
    default:
      return { enabled: false, type: 'none', count: 0, speed: 0, intensity: 0 };
  }
}

/**
 * 날씨별 안개/대기 설정
 */
function getAtmosphericEffects(weather: WeatherOption): {
  enabled: boolean;
  fog: { enabled: boolean; color: string; density: number };
} {
  switch (weather) {
    case 'fog':
      return {
        enabled: true,
        fog: { enabled: true, color: '#cccccc', density: 0.03 },
      };
    case 'haze':
      return {
        enabled: true,
        fog: { enabled: true, color: '#ddddcc', density: 0.015 },
      };
    case 'rain':
    case 'heavyRain':
      return {
        enabled: true,
        fog: { enabled: true, color: '#aabbcc', density: 0.008 },
      };
    case 'snow':
    case 'heavySnow':
      return {
        enabled: true,
        fog: { enabled: true, color: '#eeeeff', density: 0.01 },
      };
    default:
      return {
        enabled: false,
        fog: { enabled: false, color: '#ffffff', density: 0 },
      };
  }
}

import type { RenderingConfig, TimeOfDay, SeasonType, WeatherCondition } from './environment.types';

/**
 * TimeOfDayOption → TimeOfDay 변환
 */
function convertTimeOfDay(time: TimeOfDayOption): TimeOfDay {
  const mapping: Record<TimeOfDayOption, TimeOfDay> = {
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  };
  return mapping[time];
}

/**
 * WeatherOption → WeatherCondition 변환
 */
function convertWeatherCondition(weather: WeatherOption): WeatherCondition {
  const mapping: Record<WeatherOption, WeatherCondition> = {
    clear: 'clear',
    cloudy: 'clouds',
    overcast: 'clouds',
    rain: 'rain',
    heavyRain: 'thunderstorm',
    snow: 'snow',
    heavySnow: 'snow',
    fog: 'fog',
    haze: 'haze',
  };
  return mapping[weather];
}

/**
 * 현재 월에서 계절 추출
 */
function getSeasonFromDate(date: Date): SeasonType {
  const month = date.getMonth() + 1; // 0-indexed
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * SimulationEnvironmentConfig → RenderingConfig 변환
 * 3D 씬에서 사용할 렌더링 설정 생성
 */
export function convertToRenderingConfig(config: SimulationEnvironmentConfig): RenderingConfig {
  const timeLighting = TIME_OF_DAY_LIGHTING[config.timeOfDay];
  const weatherParticles = getWeatherParticles(config.weather);
  const atmosphericEffects = getAtmosphericEffects(config.weather);

  // 날씨에 따른 조명 조정
  let lightingModifier = 1.0;
  if (['rain', 'heavyRain', 'overcast'].includes(config.weather)) {
    lightingModifier = 0.6;
  } else if (['cloudy', 'fog', 'haze'].includes(config.weather)) {
    lightingModifier = 0.8;
  } else if (['snow', 'heavySnow'].includes(config.weather)) {
    lightingModifier = 0.9;
  }

  return {
    lighting: {
      ambientIntensity: timeLighting.ambientIntensity * lightingModifier,
      ambientColor: timeLighting.ambientColor,
      directionalIntensity: timeLighting.directionalIntensity * lightingModifier,
      directionalColor: timeLighting.directionalColor,
      directionalPosition: timeLighting.directionalPosition,
      shadowEnabled: config.timeOfDay !== 'night',
      shadowIntensity: 0.3,
      fillLightEnabled: true,
      fillLightIntensity: 0.3,
      fillLightColor: '#aaccff',
      environmentPreset: timeLighting.environmentPreset,
      environmentIntensity: lightingModifier,
    },
    particles: {
      weatherParticles: {
        enabled: weatherParticles.enabled,
        type: weatherParticles.type === 'dust' ? 'none' : weatherParticles.type as 'rain' | 'snow' | 'none',
        count: weatherParticles.count,
        speed: weatherParticles.speed,
        intensity: weatherParticles.intensity,
      },
      atmosphericEffects: {
        enabled: atmosphericEffects.enabled,
        fog: {
          enabled: atmosphericEffects.fog.enabled,
          color: atmosphericEffects.fog.color,
          near: 10,
          far: 100,
          density: atmosphericEffects.fog.density,
        },
        dust: {
          enabled: weatherParticles.type === 'dust',
          intensity: weatherParticles.type === 'dust' ? weatherParticles.intensity : 0,
        },
      },
    },
    postProcessing: {
      bloom: {
        enabled: config.timeOfDay === 'evening' || config.timeOfDay === 'night',
        intensity: config.timeOfDay === 'night' ? 0.4 : 0.2,
        threshold: 0.8,
        radius: 0.4,
      },
      vignette: {
        enabled: config.timeOfDay === 'night',
        intensity: 0.3,
      },
      colorCorrection: {
        enabled: true,
        saturation: 1.0,
        brightness: config.timeOfDay === 'night' ? 0.8 : 1.0,
        contrast: 1.0,
        temperature: config.timeOfDay === 'evening' ? 0.1 : 0,
      },
      depthOfField: {
        enabled: false,
        focusDistance: 10,
        focalLength: 50,
        bokehScale: 2,
      },
    },
    timeOfDay: convertTimeOfDay(config.timeOfDay),
    season: getSeasonFromDate(config.date),
    weatherCondition: convertWeatherCondition(config.weather),
    generatedAt: new Date().toISOString(),
    basedOn: {
      weather: true,
      holiday: config.holidayType !== 'none',
      event: !!config.customEventName,
      timeOfDay: true,
    },
  };
}
