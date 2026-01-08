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
import { format, parseISO } from 'date-fns';
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
      // 팝오버가 열리면 임시 선택 상태를 현재 저장된 범위로 설정
      setTempRange({
        from: parseISO(dateRange.startDate),
        to: parseISO(dateRange.endDate),
      });
    }
  }, [isOpen, dateRange.startDate, dateRange.endDate]);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    // 임시 상태 업데이트
    setTempRange(range);

    // 두 날짜가 모두 선택되면 저장하고 팝오버 닫기
    if (range?.from && range?.to) {
      setCustomRange(
        format(range.from, 'yyyy-MM-dd'),
        format(range.to, 'yyyy-MM-dd')
      );
      setIsOpen(false);
    }
  }, [setCustomRange]);

  // 초기화 버튼 핸들러
  const handleReset = useCallback(() => {
    setTempRange(undefined);
  }, []);

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
        <Popover open={isOpen} onOpenChange={setIsOpen}>
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
              <span className="text-xs text-muted-foreground">
                {tempRange?.from && !tempRange?.to
                  ? '종료일을 선택하세요'
                  : '날짜 범위 선택'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleReset}
              >
                초기화
              </Button>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={displayRange.from}
              selected={displayRange}
              onSelect={handleDateRangeSelect}
              numberOfMonths={2}
              locale={ko}
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
