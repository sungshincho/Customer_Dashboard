import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LayoutParamsFormProps {
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function LayoutParamsForm({ params, onChange }: LayoutParamsFormProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">레이아웃 변경 파라미터</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zoneType">변경 대상 존 타입</Label>
          <Select
            value={params.zoneType || 'main'}
            onValueChange={(v) => updateParam('zoneType', v)}
          >
            <SelectTrigger id="zoneType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">메인 진열존</SelectItem>
              <SelectItem value="sale">세일존</SelectItem>
              <SelectItem value="fitting">피팅룸</SelectItem>
              <SelectItem value="cashier">계산대</SelectItem>
              <SelectItem value="entrance">입구</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="moveDistance">이동 거리 (m)</Label>
          <Input
            id="moveDistance"
            type="number"
            placeholder="3.0"
            value={params.moveDistance || ''}
            onChange={(e) => updateParam('moveDistance', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="facingChange">페이싱 변경률 (%)</Label>
          <Input
            id="facingChange"
            type="number"
            placeholder="20"
            value={params.facingChange || ''}
            onChange={(e) => updateParam('facingChange', parseFloat(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pathComplexity">동선 복잡도 (1-10)</Label>
          <Input
            id="pathComplexity"
            type="number"
            min="1"
            max="10"
            placeholder="5"
            value={params.pathComplexity || ''}
            onChange={(e) => updateParam('pathComplexity', parseInt(e.target.value))}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 레이아웃 변경 시 동선 흐름, 체류시간, 전환율에 미치는 영향을 예측합니다.
      </p>
    </div>
  );
}
