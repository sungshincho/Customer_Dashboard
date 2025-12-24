/**
 * SimulationEnvironmentSettings.tsx
 *
 * 시뮬레이션 환경 설정 UI 컴포넌트
 * - 실시간 / 시뮬레이션 모드 전환
 * - 날씨, 날짜, 시간, 휴일 설정
 * - 영향도 실시간 계산 및 표시
 */

import React, { useCallback, useMemo } from 'react';
import {
  Cloud,
  Sun,
  Calendar,
  Clock,
  Thermometer,
  Droplets,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SimulationEnvironmentConfig,
  WeatherOption,
  DayOfWeekOption,
  HolidayOption,
  TimeOfDayOption,
} from '../types/simulationEnvironment.types';
import {
  WEATHER_OPTIONS,
  HOLIDAY_OPTIONS,
  DAY_OF_WEEK_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  calculateSimulationImpacts,
  createDefaultSimulationConfig,
} from '../types/simulationEnvironment.types';

// ============================================================================
// Props
// ============================================================================

interface SimulationEnvironmentSettingsProps {
  config: SimulationEnvironmentConfig;
  onChange: (config: SimulationEnvironmentConfig) => void;
  className?: string;
  compact?: boolean; // 컴팩트 모드
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export const SimulationEnvironmentSettings: React.FC<SimulationEnvironmentSettingsProps> = ({
  config,
  onChange,
  className,
  compact = false,
}) => {
  // 설정 업데이트 헬퍼
  const updateConfig = useCallback(
    (updates: Partial<SimulationEnvironmentConfig>) => {
      const newConfig = { ...config, ...updates };
      // 영향도 재계산
      newConfig.calculatedImpact = calculateSimulationImpacts(newConfig);
      onChange(newConfig);
    },
    [config, onChange]
  );

  // 리셋
  const handleReset = useCallback(() => {
    const defaultConfig = createDefaultSimulationConfig();
    defaultConfig.calculatedImpact = calculateSimulationImpacts(defaultConfig);
    onChange(defaultConfig);
  }, [onChange]);

  // 계산된 영향도
  const impacts = useMemo(() => {
    return config.calculatedImpact || calculateSimulationImpacts(config);
  }, [config]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 모드 토글 */}
      <ModeToggle
        mode={config.mode}
        onChange={(mode) => updateConfig({ mode })}
      />

      {/* 시뮬레이션 모드일 때만 상세 설정 표시 */}
      {config.mode === 'simulation' && (
        <>
          {/* 날짜/시간 설정 */}
          <DateTimeSettings
            date={config.date}
            dayOfWeek={config.dayOfWeek}
            timeOfDay={config.timeOfDay}
            onDateChange={(date) => updateConfig({ date })}
            onDayChange={(dayOfWeek) => updateConfig({ dayOfWeek })}
            onTimeChange={(timeOfDay) => updateConfig({ timeOfDay })}
            compact={compact}
          />

          {/* 날씨 설정 */}
          <WeatherSettings
            weather={config.weather}
            temperature={config.temperature}
            humidity={config.humidity}
            onWeatherChange={(weather) => updateConfig({ weather })}
            onTemperatureChange={(temperature) => updateConfig({ temperature })}
            onHumidityChange={(humidity) => updateConfig({ humidity })}
            compact={compact}
          />

          {/* 휴일/이벤트 설정 */}
          <HolidaySettings
            holidayType={config.holidayType}
            customEventName={config.customEventName}
            onChange={(holidayType, customEventName) =>
              updateConfig({ holidayType, customEventName })
            }
            compact={compact}
          />

          {/* 영향도 표시 */}
          <ImpactDisplay impacts={impacts} />

          {/* 리셋 버튼 */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition"
          >
            <RefreshCw className="w-3 h-3" />
            기본값으로 초기화
          </button>
        </>
      )}
    </div>
  );
};

// ============================================================================
// 모드 토글
// ============================================================================

interface ModeToggleProps {
  mode: 'realtime' | 'simulation';
  onChange: (mode: 'realtime' | 'simulation') => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <button
        onClick={() => onChange('realtime')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition',
          mode === 'realtime'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        )}
      >
        <Activity className="w-4 h-4" />
        실시간
      </button>
      <button
        onClick={() => onChange('simulation')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm transition',
          mode === 'simulation'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted'
        )}
      >
        <Cloud className="w-4 h-4" />
        시뮬레이션
      </button>
    </div>
  );
};

// ============================================================================
// 날짜/시간 설정
// ============================================================================

interface DateTimeSettingsProps {
  date: Date;
  dayOfWeek: DayOfWeekOption;
  timeOfDay: TimeOfDayOption;
  onDateChange: (date: Date) => void;
  onDayChange: (day: DayOfWeekOption) => void;
  onTimeChange: (time: TimeOfDayOption) => void;
  compact?: boolean;
}

const DateTimeSettings: React.FC<DateTimeSettingsProps> = ({
  date,
  dayOfWeek,
  timeOfDay,
  onDateChange,
  onDayChange,
  onTimeChange,
  compact,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="w-4 h-4 text-blue-500" />
        날짜/시간 설정
      </div>

      {/* 날짜 선택 */}
      <input
        type="date"
        value={date.toISOString().split('T')[0]}
        onChange={(e) => onDateChange(new Date(e.target.value))}
        className="w-full px-3 py-2 text-sm bg-muted/50 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      {/* 요일 선택 */}
      <div className="flex flex-wrap gap-1">
        {DAY_OF_WEEK_OPTIONS.map((day) => (
          <button
            key={day.value}
            onClick={() => onDayChange(day.value)}
            className={cn(
              'px-2 py-1 text-xs rounded transition',
              dayOfWeek === day.value
                ? 'bg-blue-500 text-white'
                : 'bg-muted/50 hover:bg-muted'
            )}
          >
            {compact ? day.shortLabel : day.label}
          </button>
        ))}
      </div>

      {/* 시간대 선택 */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <div className="flex flex-1 gap-1">
          {TIME_OF_DAY_OPTIONS.map((time) => (
            <button
              key={time.value}
              onClick={() => onTimeChange(time.value)}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs rounded transition',
                timeOfDay === time.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-muted/50 hover:bg-muted'
              )}
              title={time.hours}
            >
              {time.emoji} {compact ? '' : time.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 날씨 설정
// ============================================================================

interface WeatherSettingsProps {
  weather: WeatherOption;
  temperature: number;
  humidity: number;
  onWeatherChange: (weather: WeatherOption) => void;
  onTemperatureChange: (temp: number) => void;
  onHumidityChange: (humidity: number) => void;
  compact?: boolean;
}

const WeatherSettings: React.FC<WeatherSettingsProps> = ({
  weather,
  temperature,
  humidity,
  onWeatherChange,
  onTemperatureChange,
  onHumidityChange,
  compact,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sun className="w-4 h-4 text-yellow-500" />
        날씨 설정
      </div>

      {/* 날씨 조건 그리드 */}
      <div className="grid grid-cols-3 gap-1">
        {WEATHER_OPTIONS.map((w) => (
          <button
            key={w.value}
            onClick={() => onWeatherChange(w.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded text-xs transition',
              weather === w.value
                ? 'bg-blue-500 text-white'
                : 'bg-muted/50 hover:bg-muted'
            )}
            title={`방문객 영향: ${Math.round((w.trafficImpact - 1) * 100)}%`}
          >
            <span className="text-lg">{w.emoji}</span>
            {!compact && <span>{w.label}</span>}
          </button>
        ))}
      </div>

      {/* 기온 슬라이더 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Thermometer className="w-3 h-3" />
            기온
          </div>
          <span className="font-medium">{temperature}°C</span>
        </div>
        <input
          type="range"
          min="-20"
          max="40"
          value={temperature}
          onChange={(e) => onTemperatureChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-20°C</span>
          <span>40°C</span>
        </div>
      </div>

      {/* 습도 슬라이더 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Droplets className="w-3 h-3" />
            습도
          </div>
          <span className="font-medium">{humidity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={humidity}
          onChange={(e) => onHumidityChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 휴일/이벤트 설정
// ============================================================================

interface HolidaySettingsProps {
  holidayType: HolidayOption;
  customEventName?: string;
  onChange: (holiday: HolidayOption, customEvent?: string) => void;
  compact?: boolean;
}

const HolidaySettings: React.FC<HolidaySettingsProps> = ({
  holidayType,
  customEventName,
  onChange,
  compact,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="w-4 h-4 text-red-500" />
        휴일/이벤트 설정
      </div>

      {/* 휴일/이벤트 선택 */}
      <div className="grid grid-cols-3 gap-1">
        {HOLIDAY_OPTIONS.map((h) => (
          <button
            key={h.value}
            onClick={() => onChange(h.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded text-xs transition',
              holidayType === h.value
                ? 'bg-red-500 text-white'
                : 'bg-muted/50 hover:bg-muted'
            )}
            title={`방문객 영향: ${Math.round((h.trafficImpact - 1) * 100)}%, 전환율 영향: ${Math.round((h.conversionImpact - 1) * 100)}%`}
          >
            <span className="text-lg">{h.emoji}</span>
            {!compact && <span>{h.label}</span>}
          </button>
        ))}
      </div>

      {/* 커스텀 이벤트명 입력 */}
      <input
        type="text"
        placeholder="커스텀 이벤트명 (선택사항)"
        value={customEventName || ''}
        onChange={(e) => onChange(holidayType, e.target.value || undefined)}
        className="w-full px-3 py-2 text-sm bg-muted/50 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
};

// ============================================================================
// 영향도 표시
// ============================================================================

interface ImpactDisplayProps {
  impacts: {
    trafficMultiplier: number;
    dwellTimeMultiplier: number;
    conversionMultiplier: number;
  };
}

const ImpactDisplay: React.FC<ImpactDisplayProps> = ({ impacts }) => {
  const formatChange = (value: number) => {
    const percent = Math.round((value - 1) * 100);
    return percent >= 0 ? `+${percent}%` : `${percent}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 1) return 'text-green-500';
    if (value < 1) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getIcon = (value: number) => {
    if (value > 1) return <TrendingUp className="w-3 h-3" />;
    if (value < 1) return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg border">
      <div className="text-xs font-medium mb-2 text-muted-foreground">
        예상 영향도
      </div>
      <div className="grid grid-cols-3 gap-2">
        {/* 방문객 영향 */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">방문객</div>
          <div
            className={cn(
              'flex items-center justify-center gap-1 font-bold',
              getChangeColor(impacts.trafficMultiplier)
            )}
          >
            {getIcon(impacts.trafficMultiplier)}
            {formatChange(impacts.trafficMultiplier)}
          </div>
        </div>

        {/* 체류시간 영향 */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">체류시간</div>
          <div
            className={cn(
              'flex items-center justify-center gap-1 font-bold',
              getChangeColor(impacts.dwellTimeMultiplier)
            )}
          >
            {getIcon(impacts.dwellTimeMultiplier)}
            {formatChange(impacts.dwellTimeMultiplier)}
          </div>
        </div>

        {/* 전환율 영향 */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">전환율</div>
          <div
            className={cn(
              'flex items-center justify-center gap-1 font-bold',
              getChangeColor(impacts.conversionMultiplier)
            )}
          >
            {getIcon(impacts.conversionMultiplier)}
            {formatChange(impacts.conversionMultiplier)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationEnvironmentSettings;
