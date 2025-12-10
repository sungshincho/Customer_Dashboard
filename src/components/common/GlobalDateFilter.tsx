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
import { useState } from 'react';
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

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setCustomRange(
        format(range.from, 'yyyy-MM-dd'),
        format(range.to, 'yyyy-MM-dd')
      );
      setIsOpen(false);
    }
  };

  const selectedRange: DateRange = {
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
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={selectedRange.from}
              selected={selectedRange}
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
