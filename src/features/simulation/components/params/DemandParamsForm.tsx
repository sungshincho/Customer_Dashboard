import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface DemandParamsFormProps {
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function DemandParamsForm({ params, onChange }: DemandParamsFormProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">수요 예측 파라미터</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="forecastHorizon">예측 기간 (일)</Label>
          <Input
            id="forecastHorizon"
            type="number"
            placeholder="30"
            value={params.forecastHorizonDays || ''}
            onChange={(e) => updateParam('forecastHorizonDays', parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weatherScenario">날씨 시나리오</Label>
          <Select
            value={params.weatherScenario || 'realistic'}
            onValueChange={(v) => updateParam('weatherScenario', v)}
          >
            <SelectTrigger id="weatherScenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="optimistic">낙관적 (맑음)</SelectItem>
              <SelectItem value="realistic">현실적 (평년)</SelectItem>
              <SelectItem value="pessimistic">비관적 (악천후)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="includeWeather">날씨 데이터 반영</Label>
            <p className="text-xs text-muted-foreground">날씨가 수요에 미치는 영향 고려</p>
          </div>
          <Switch
            id="includeWeather"
            checked={params.includeWeather || false}
            onCheckedChange={(v) => updateParam('includeWeather', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="includeEvents">이벤트 데이터 반영</Label>
            <p className="text-xs text-muted-foreground">휴일, 프로모션 등 이벤트 고려</p>
          </div>
          <Switch
            id="includeEvents"
            checked={params.includeEvents || false}
            onCheckedChange={(v) => updateParam('includeEvents', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="includeEconomic">경제 지표 반영</Label>
            <p className="text-xs text-muted-foreground">소비자 심리, 물가 등 고려</p>
          </div>
          <Switch
            id="includeEconomic"
            checked={params.includeEconomicIndicators || false}
            onCheckedChange={(v) => updateParam('includeEconomicIndicators', v)}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 외부 컨텍스트를 반영하여 더 정확한 수요 예측을 제공합니다.
      </p>
    </div>
  );
}
