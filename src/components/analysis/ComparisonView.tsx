import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonData {
  label: string;
  current: number;
  previous: number;
  unit?: string;
}

interface ComparisonViewProps {
  data: ComparisonData[];
  comparisonType: "period" | "store";
  onComparisonTypeChange: (type: "period" | "store") => void;
  periodOptions?: string[];
  storeOptions?: string[];
  selectedPeriod?: string;
  selectedStore?: string;
  onPeriodChange?: (period: string) => void;
  onStoreChange?: (store: string) => void;
}

export const ComparisonView = ({
  data,
  comparisonType,
  onComparisonTypeChange,
  periodOptions = ["지난주", "지난달", "작년 동기"],
  storeOptions = ["강남점", "홍대점", "명동점"],
  selectedPeriod = "지난주",
  selectedStore = "강남점",
  onPeriodChange,
  onStoreChange
}: ComparisonViewProps) => {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">비교 분석</h3>
        </div>
        
        <div className="flex gap-2">
          <Select value={comparisonType} onValueChange={(v) => onComparisonTypeChange(v as "period" | "store")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="period">기간 비교</SelectItem>
              <SelectItem value="store">매장 비교</SelectItem>
            </SelectContent>
          </Select>
          
          {comparisonType === "period" && onPeriodChange && (
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {comparisonType === "store" && onStoreChange && (
            <Select value={selectedStore} onValueChange={onStoreChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storeOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const change = calculateChange(item.current, item.previous);
          const isPositive = change > 0;
          
          return (
            <div key={index} className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{item.label}</span>
                <Badge variant={isPositive ? "default" : "secondary"}>
                  {isPositive ? "+" : ""}{change.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  현재: {item.current}{item.unit}
                </span>
                <span className="text-muted-foreground">
                  이전: {item.previous}{item.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
