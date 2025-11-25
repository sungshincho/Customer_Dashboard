import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useState } from "react";

interface DashboardFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
  onAggregateRange?: (startDate: string, endDate: string) => void;
}

export function DashboardFilters({ selectedDate, onDateChange, onAggregateRange }: DashboardFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isAggregating, setIsAggregating] = useState(false);

  const handleRangeAggregate = async () => {
    if (!dateRange?.from || !onAggregateRange) return;
    
    setIsAggregating(true);
    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate;
    
    await onAggregateRange(startDate, endDate);
    setIsAggregating(false);
  };

  return (
    <div className="flex items-center gap-4">
      {/* 단일 날짜 선택 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {format(selectedDate, "PPP", { locale: ko })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
            initialFocus
            locale={ko}
          />
        </PopoverContent>
      </Popover>

      {/* 날짜 범위 KPI 집계 */}
      {onAggregateRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              범위 집계
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">날짜 범위 선택</p>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                  locale={ko}
                  numberOfMonths={2}
                />
              </div>
              {dateRange?.from && (
                <Button 
                  onClick={handleRangeAggregate}
                  disabled={isAggregating}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4" />
                  {isAggregating ? 'KPI 집계 중...' : 'KPI 집계 실행'}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
