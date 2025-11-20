import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface RecommendationParamsFormProps {
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}

export function RecommendationParamsForm({ params, onChange }: RecommendationParamsFormProps) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">추천 전략 파라미터</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="algorithm">추천 알고리즘</Label>
          <Select
            value={params.algorithm || 'hybrid'}
            onValueChange={(v) => updateParam('algorithm', v)}
          >
            <SelectTrigger id="algorithm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="collaborative_filtering">협업 필터링</SelectItem>
              <SelectItem value="content_based">콘텐츠 기반</SelectItem>
              <SelectItem value="hybrid">하이브리드</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxRecommendations">추천 슬롯 수</Label>
          <Input
            id="maxRecommendations"
            type="number"
            placeholder="5"
            min="1"
            max="20"
            value={params.maxRecommendations || ''}
            onChange={(e) => updateParam('maxRecommendations', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="trendWeight">트렌드 가중치</Label>
            <span className="text-sm text-muted-foreground">{params.trendWeight || 0.5}</span>
          </div>
          <Slider
            id="trendWeight"
            min={0}
            max={1}
            step={0.1}
            value={[params.trendWeight || 0.5]}
            onValueChange={(v) => updateParam('trendWeight', v[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="diversityWeight">다양성 가중치</Label>
            <span className="text-sm text-muted-foreground">{params.diversityWeight || 0.3}</span>
          </div>
          <Slider
            id="diversityWeight"
            min={0}
            max={1}
            step={0.1}
            value={[params.diversityWeight || 0.3]}
            onValueChange={(v) => updateParam('diversityWeight', v[0])}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="boostNewProducts">신상품 우대</Label>
            <p className="text-xs text-muted-foreground">신상품을 우선 추천</p>
          </div>
          <Switch
            id="boostNewProducts"
            checked={params.boostNewProducts || false}
            onCheckedChange={(v) => updateParam('boostNewProducts', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="boostHighMargin">고마진 상품 우대</Label>
            <p className="text-xs text-muted-foreground">마진이 높은 상품 우선 추천</p>
          </div>
          <Switch
            id="boostHighMargin"
            checked={params.boostHighMargin || false}
            onCheckedChange={(v) => updateParam('boostHighMargin', v)}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 추천 전략 변경 시 CTR, CVR, ATV uplift를 예측합니다.
      </p>
    </div>
  );
}
