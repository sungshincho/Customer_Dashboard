import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/types/analysis.types";

// Export for backward compatibility
export type { FilterState };

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  stores?: string[];
  categories?: string[];
}

export const AdvancedFilters = ({ 
  filters, 
  onFiltersChange,
  stores = ["전체", "강남점", "홍대점", "명동점", "판교점"],
  categories = ["전체", "의류", "식품", "전자제품", "생활용품"]
}: AdvancedFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-3 items-center p-4 glass-card rounded-lg">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">필터</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("justify-start text-left font-normal", !filters.dateRange && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "PPP", { locale: ko })} - {format(filters.dateRange.to, "PPP", { locale: ko })}
                </>
              ) : (
                format(filters.dateRange.from, "PPP", { locale: ko })
              )
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={filters.dateRange}
            onSelect={(range) => onFiltersChange({ ...filters, dateRange: range })}
            numberOfMonths={2}
            locale={ko}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Select value={filters.store} onValueChange={(value) => onFiltersChange({ ...filters, store: value })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="매장 선택" />
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store} value={store}>{store}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>{category}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onFiltersChange({ dateRange: undefined, store: "전체", category: "전체" })}
      >
        초기화
      </Button>
    </div>
  );
};
