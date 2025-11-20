import { ScenarioType } from '../types/scenario.types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3x3, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Target,
  Users,
  Tag
} from 'lucide-react';

interface ScenarioTypeSelectorProps {
  value: ScenarioType;
  onChange: (type: ScenarioType) => void;
}

const scenarioTypes: Array<{
  value: ScenarioType;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'layout', label: '레이아웃', icon: <Grid3x3 className="w-4 h-4" /> },
  { value: 'pricing', label: '가격', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'inventory', label: '재고', icon: <Package className="w-4 h-4" /> },
  { value: 'demand', label: '수요예측', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'recommendation', label: '추천', icon: <Target className="w-4 h-4" /> },
  { value: 'staffing', label: '인력', icon: <Users className="w-4 h-4" /> },
  { value: 'promotion', label: '프로모션', icon: <Tag className="w-4 h-4" /> },
];

export function ScenarioTypeSelector({ value, onChange }: ScenarioTypeSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ScenarioType)}>
      <TabsList className="grid w-full grid-cols-7">
        {scenarioTypes.map((type) => (
          <TabsTrigger
            key={type.value}
            value={type.value}
            className="flex items-center gap-2"
          >
            {type.icon}
            <span className="hidden sm:inline">{type.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
