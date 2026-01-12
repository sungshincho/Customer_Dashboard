/**
 * GlobalDateFilter.tsx
 *
 * 전역 기간 필터 컴포넌트
 * - 모든 페이지에서 동일한 기간 필터 사용
 * - 프리셋 버튼 (오늘, 7일, 30일, 90일)
 * - 커스텀 날짜 범위 선택
 */

import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDateFilterStore, PresetPeriod, PRESET_LABELS } from '@/store/dateFilterStore';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';

const presets: PresetPeriod[] = ['today', '7d', '30d', '90d'];

interface GlobalDateFilterProps {
  className?: string;
  showCustom?: boolean;
  compact?: boolean;
}

export function GlobalDateFilter({
  className,
  showCustom = true,
  compact = false,
}: GlobalDateFilterProps) {
  const { dateRange, setPreset, setCustomRange } = useDateFilterStore();
  const [isOpen, setIsOpen] = useState(false);

  // H-6: 임시 선택 상태 (팝오버 열릴 때 리셋됨)
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);

  // 팝오버 열릴 때 임시 상태 초기화
  useEffect(() => {
    if (isOpen) {
      // "오늘" 프리셋인 경우 시작 날짜만 선택된 상태로 설정
      if (dateRange.preset === 'today') {
        setTempRange({
          from: parseISO(dateRange.startDate),
          to: undefined,
        });
      } else {
        // 다른 프리셋(7일, 30일, 90일, custom)은 범위로 설정
        setTempRange({
          from: parseISO(dateRange.startDate),
          to: parseISO(dateRange.endDate),
        });
      }
    }
  }, [isOpen, dateRange.startDate, dateRange.endDate, dateRange.preset]);

  // 날짜 클릭 핸들러 - 시작/종료가 모두 선택된 상태에서 새 날짜 클릭 시 초기화
  const handleDayClick = useCallback((day: Date) => {
    if (tempRange?.from && tempRange?.to) {
      // 기존 범위가 완성된 상태에서 새로 클릭하면 시작 날짜로 초기화
      setTempRange({
        from: day,
        to: undefined,
      });
    }
  }, [tempRange]);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    // 시작/종료 날짜가 모두 선택된 상태에서는 onDayClick에서 처리됨
    if (tempRange?.from && tempRange?.to) {
      return;
    }

    // 임시 상태 업데이트 (자동 닫힘 제거됨 - 적용 버튼으로 닫음)
    setTempRange(range);
  }, [tempRange]);

  // 초기화 버튼 핸들러 - 선택된 날짜 해제
  const handleReset = useCallback(() => {
    setTempRange({ from: undefined, to: undefined });
  }, []);

  // 적용 버튼 핸들러
  const handleApply = useCallback(() => {
    if (tempRange?.from && tempRange?.to) {
      setCustomRange(
        format(tempRange.from, 'yyyy-MM-dd'),
        format(tempRange.to, 'yyyy-MM-dd')
      );
      setIsOpen(false);
    }
  }, [tempRange, setCustomRange]);

  // 팝오버 외부 클릭 시 (onOpenChange)
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && tempRange?.from && tempRange?.to) {
      // 닫힐 때 시작/종료 날짜가 모두 선택되어 있으면 적용
      setCustomRange(
        format(tempRange.from, 'yyyy-MM-dd'),
        format(tempRange.to, 'yyyy-MM-dd')
      );
    }
    setIsOpen(open);
  }, [tempRange, setCustomRange]);

  const displayRange: DateRange = tempRange ?? {
    from: parseISO(dateRange.startDate),
    to: parseISO(dateRange.endDate),
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!compact && (
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      )}
      <div className="flex gap-1">
        {presets.map((preset) => (
          <Button
            key={preset}
            variant={dateRange.preset === preset ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreset(preset)}
            className={cn(
              'h-7 px-2 text-xs',
              dateRange.preset === preset && 'shadow-sm'
            )}
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      {showCustom && (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant={dateRange.preset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-7 gap-1 text-xs',
                dateRange.preset === 'custom' && 'shadow-sm'
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {dateRange.preset === 'custom' ? (
                <>
                  {format(parseISO(dateRange.startDate), 'M/d', { locale: ko })} -{' '}
                  {format(parseISO(dateRange.endDate), 'M/d', { locale: ko })}
                </>
              ) : (
                '직접 설정'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-xs text-black dark:text-white">
                {tempRange?.from && !tempRange?.to
                  ? '종료일을 선택하세요'
                  : '날짜 범위 선택'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-black dark:text-white"
                  onClick={handleReset}
                >
                  초기화
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-black dark:text-white"
                  onClick={handleApply}
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  적용
                </Button>
              </div>
            </div>
            <Calendar
              key={`${dateRange.startDate}-${dateRange.preset}`}
              initialFocus
              mode="range"
              defaultMonth={displayRange.from}
              selected={displayRange}
              onSelect={handleDateRangeSelect}
              onDayClick={handleDayClick}
              numberOfMonths={2}
              locale={ko}
              modifiers={{
                todayInRange: (day) =>
                  isToday(day) &&
                  !isSameDay(day, tempRange?.from ?? new Date(0)) &&
                  !isSameDay(day, tempRange?.to ?? new Date(0)),
              }}
              modifiersClassNames={{
                todayInRange: "!bg-blue-500/20 !text-blue-600 !ring-1 !ring-blue-500/40 dark:!bg-blue-500/30 dark:!text-blue-300 dark:!ring-blue-400/50 rounded-full",
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {!compact && (
        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
          {format(parseISO(dateRange.startDate), 'M월 d일', { locale: ko })} ~{' '}
          {format(parseISO(dateRange.endDate), 'M월 d일', { locale: ko })}
        </span>
      )}
    </div>
  );
}
