import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZoomIn, ZoomOut, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { useState } from "react";
import { ResponsiveContainer, LineChart, BarChart, PieChart, Pie, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";

export type ChartType = "line" | "bar" | "pie";

interface EnhancedChartProps {
  data: any[];
  title: string;
  defaultChartType?: ChartType;
  xAxisKey: string;
  yAxisKeys: { key: string; name: string; color: string }[];
  onDataPointClick?: (data: any) => void;
}

export const EnhancedChart = ({ 
  data, 
  title, 
  defaultChartType = "line",
  xAxisKey,
  yAxisKeys,
  onDataPointClick 
}: EnhancedChartProps) => {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.6));

  const renderChart = () => {
    // yAxisKeys가 비어있거나 유효하지 않으면 빈 상태 반환
    if (!yAxisKeys || yAxisKeys.length === 0 || !yAxisKeys[0]) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          데이터를 불러올 수 없습니다
        </div>
      );
    }

    const commonProps = {
      data,
      onClick: onDataPointClick,
      style: { fontSize: `${12 * zoomLevel}px` }
    };

    switch (chartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            {yAxisKeys.map((axis) => axis && (
              <Line 
                key={axis.key}
                type="monotone" 
                dataKey={axis.key} 
                name={axis.name}
                stroke={axis.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            {yAxisKeys.map((axis) => axis && (
              <Bar key={axis.key} dataKey={axis.key} name={axis.name} fill={axis.color} />
            ))}
          </BarChart>
        );
      
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yAxisKeys[0].key}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80 * zoomLevel}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={yAxisKeys[index % yAxisKeys.length]?.color || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          </PieChart>
        );
    }
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4" />
                  라인 차트
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  바 차트
                </div>
              </SelectItem>
              <SelectItem value="pie">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4" />
                  파이 차트
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  );
};
