import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Trash2, Calendar, Loader2 } from 'lucide-react';
import { useScenarioManager } from '../hooks/useScenarioManager';
import { ScenarioType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ScenarioListProps {
  storeId?: string;
  onLoad: (params: Record<string, any>, type: ScenarioType) => void;
}

export function ScenarioList({ storeId, onLoad }: ScenarioListProps) {
  const { scenarios, isLoading, deleteScenario, isDeleting } = useScenarioManager(storeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">저장된 시나리오가 없습니다</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <Card
            key={scenario.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{scenario.name}</h4>
                    {scenario.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {scenario.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteScenario(scenario.id);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{getScenarioTypeLabel(scenario.scenarioType)}</Badge>
                  <Badge variant="outline">{scenario.status}</Badge>
                  {scenario.confidenceScore && (
                    <Badge variant="outline">신뢰도 {scenario.confidenceScore.toFixed(0)}%</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(scenario.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onLoad(scenario.params, scenario.scenarioType)}
                >
                  불러오기
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function getScenarioTypeLabel(type: ScenarioType): string {
  const labels: Record<ScenarioType, string> = {
    layout: '레이아웃',
    pricing: '가격',
    inventory: '재고',
    demand: '수요예측',
    recommendation: '추천',
    staffing: '인력',
    promotion: '프로모션',
  };
  return labels[type] || type;
}
