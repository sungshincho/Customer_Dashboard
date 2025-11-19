import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
}

export function DashboardFilters({ selectedDate, onDateChange }: DashboardFiltersProps) {
  return (
    <div className="flex items-center gap-4">
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
    </div>
  );
}
