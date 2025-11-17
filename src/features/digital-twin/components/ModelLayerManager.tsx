import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Box, Layers, Package, Store, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ModelLayer {
  id: string;
  name: string;
  type: 'space' | 'furniture' | 'product' | 'other';
  model_url: string;
  dimensions?: { width: number; height: number; depth: number };
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  metadata?: any;
}

interface ModelLayerManagerProps {
  models: ModelLayer[];
  activeLayers: string[];
  onLayersChange: (layerIds: string[]) => void;
}

export function ModelLayerManager({ models, activeLayers, onLayersChange }: ModelLayerManagerProps) {
  const [localActive, setLocalActive] = useState<string[]>(activeLayers);

  useEffect(() => {
    setLocalActive(activeLayers);
  }, [activeLayers]);

  // 레이어 타입별 그룹화
  const groupedModels = {
    space: models.filter(m => m.type === 'space'),
    furniture: models.filter(m => m.type === 'furniture'),
    product: models.filter(m => m.type === 'product'),
    other: models.filter(m => m.type === 'other')
  };

  const handleToggle = (modelId: string, checked: boolean) => {
    const updated = checked
      ? [...localActive, modelId]
      : localActive.filter(id => id !== modelId);
    
    setLocalActive(updated);
    onLayersChange(updated);
  };

  const handleToggleAll = (type: keyof typeof groupedModels, checked: boolean) => {
    const typeModels = groupedModels[type].map(m => m.id);
    const updated = checked
      ? [...new Set([...localActive, ...typeModels])]
      : localActive.filter(id => !typeModels.includes(id));
    
    setLocalActive(updated);
    onLayersChange(updated);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'space': return <Store className="w-4 h-4" />;
      case 'furniture': return <Box className="w-4 h-4" />;
      case 'product': return <Package className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'space': return '공간';
      case 'furniture': return '가구';
      case 'product': return '제품';
      default: return '기타';
    }
  };

  if (models.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>모델 레이어</CardTitle>
          <CardDescription>3D 모델이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              '3D 데이터 설정' 페이지에서 3D 모델을 업로드하거나, 
              온톨로지 엔티티 타입에 3D 모델을 추가하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          모델 레이어 관리
        </CardTitle>
        <CardDescription>
          {localActive.length}/{models.length}개 레이어 활성화됨
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* 공간 레이어 */}
            {groupedModels.space.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon('space')}
                    <h4 className="font-semibold">{getTypeName('space')}</h4>
                    <Badge variant="secondary">{groupedModels.space.length}</Badge>
                  </div>
                  <Checkbox
                    checked={groupedModels.space.every(m => localActive.includes(m.id))}
                    onCheckedChange={(checked) => handleToggleAll('space', checked as boolean)}
                  />
                </div>
                <div className="space-y-2 ml-6">
                  {groupedModels.space.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium text-sm">{model.name}</div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* 가구 레이어 */}
            {groupedModels.furniture.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon('furniture')}
                    <h4 className="font-semibold">{getTypeName('furniture')}</h4>
                    <Badge variant="secondary">{groupedModels.furniture.length}</Badge>
                  </div>
                  <Checkbox
                    checked={groupedModels.furniture.every(m => localActive.includes(m.id))}
                    onCheckedChange={(checked) => handleToggleAll('furniture', checked as boolean)}
                  />
                </div>
                <div className="space-y-2 ml-6">
                  {groupedModels.furniture.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium text-sm">{model.name}</div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* 제품 레이어 */}
            {groupedModels.product.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon('product')}
                    <h4 className="font-semibold">{getTypeName('product')}</h4>
                    <Badge variant="secondary">{groupedModels.product.length}</Badge>
                  </div>
                  <Checkbox
                    checked={groupedModels.product.every(m => localActive.includes(m.id))}
                    onCheckedChange={(checked) => handleToggleAll('product', checked as boolean)}
                  />
                </div>
                <div className="space-y-2 ml-6">
                  {groupedModels.product.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium text-sm">{model.name}</div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )}

            {/* 기타 레이어 */}
            {groupedModels.other.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon('other')}
                    <h4 className="font-semibold">{getTypeName('other')}</h4>
                    <Badge variant="secondary">{groupedModels.other.length}</Badge>
                  </div>
                  <Checkbox
                    checked={groupedModels.other.every(m => localActive.includes(m.id))}
                    onCheckedChange={(checked) => handleToggleAll('other', checked as boolean)}
                  />
                </div>
                <div className="space-y-2 ml-6">
                  {groupedModels.other.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div>
                          <div className="font-medium text-sm">{model.name}</div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
