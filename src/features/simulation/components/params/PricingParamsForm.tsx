import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface PricingParamsFormProps {
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function PricingParamsForm({ params, onChange }: PricingParamsFormProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">가격 최적화 파라미터</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priceChangePercent">가격 변경률 (%)</Label>
          <Input
            id="priceChangePercent"
            type="number"
            placeholder="-10 (할인) 또는 +5 (인상)"
            value={params.priceChangePercent || ''}
            onChange={(e) => updateParam('priceChangePercent', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetMargin">목표 마진율 (%)</Label>
          <Input
            id="targetMargin"
            type="number"
            placeholder="30"
            value={params.targetMargin || ''}
            onChange={(e) => updateParam('targetMargin', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discountStrategy">할인 전략</Label>
          <Select
            value={params.discountStrategy || 'fixed'}
            onValueChange={(v) => updateParam('discountStrategy', v)}
          >
            <SelectTrigger id="discountStrategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">고정 할인</SelectItem>
              <SelectItem value="percentage">비율 할인</SelectItem>
              <SelectItem value="dynamic">동적 가격</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">적용 기간 (일)</Label>
          <Input
            id="duration"
            type="number"
            placeholder="7"
            value={params.duration || ''}
            onChange={(e) => updateParam('duration', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="considerInventory">재고 수준 고려</Label>
          <p className="text-xs text-muted-foreground">재고가 많은 상품 우선 할인</p>
        </div>
        <Switch
          id="considerInventory"
          checked={params.considerInventory || false}
          onCheckedChange={(v) => updateParam('considerInventory', v)}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        💡 가격 변경 시 수요 탄력성을 고려하여 매출/마진 영향을 예측합니다.
      </p>
    </div>
  );
}
