import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryParamsFormProps {
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function InventoryParamsForm({ params, onChange }: InventoryParamsFormProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">재고 최적화 파라미터</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetServiceLevel">목표 서비스 수준 (%)</Label>
          <Input
            id="targetServiceLevel"
            type="number"
            placeholder="95"
            min="0"
            max="100"
            value={params.targetServiceLevel || ''}
            onChange={(e) => updateParam('targetServiceLevel', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadTimeDays">리드타임 (일)</Label>
          <Input
            id="leadTimeDays"
            type="number"
            placeholder="7"
            value={params.leadTimeDays || ''}
            onChange={(e) => updateParam('leadTimeDays', parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderFrequency">발주 주기 (일)</Label>
          <Input
            id="orderFrequency"
            type="number"
            placeholder="14"
            value={params.orderFrequency || ''}
            onChange={(e) => updateParam('orderFrequency', parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="safetyStockMultiplier">안전재고 계수</Label>
          <Input
            id="safetyStockMultiplier"
            type="number"
            step="0.1"
            placeholder="1.5"
            value={params.safetyStockMultiplier || ''}
            onChange={(e) => updateParam('safetyStockMultiplier', parseFloat(e.target.value))}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="policyType">발주 정책</Label>
          <Select
            value={params.policyType || 'reorder_point'}
            onValueChange={(v) => updateParam('policyType', v)}
          >
            <SelectTrigger id="policyType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reorder_point">재주문점 방식</SelectItem>
              <SelectItem value="periodic_review">정기 검토 방식</SelectItem>
              <SelectItem value="min_max">Min-Max 방식</SelectItem>
              <SelectItem value="just_in_time">JIT 방식</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 재고 정책 변경 시 품절률, 재고비용, 자본 효율성 변화를 예측합니다.
      </p>
    </div>
  );
}
