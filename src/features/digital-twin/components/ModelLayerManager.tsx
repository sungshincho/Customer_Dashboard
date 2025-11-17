import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Box, Layers, Package, Store, AlertCircle, Upload, Trash2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { upload3DModel, delete3DModel } from "../utils/modelStorageManager";
import { toast } from "sonner";

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
  userId?: string;
  storeId?: string;
  onModelsReload?: () => void;
}

export function ModelLayerManager({ 
  models, 
  activeLayers, 
  onLayersChange,
  userId,
  storeId,
  onModelsReload
}: ModelLayerManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId || !storeId) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      const result = await upload3DModel(userId, storeId, file);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast.error(`${file.name} 업로드 실패: ${result.error}`);
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount}개 파일 업로드 완료`);
      onModelsReload?.();
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (modelId: string, modelName: string) => {
    if (!userId || !storeId) return;
    
    // Storage에서 온 모델인지 확인
    if (!modelId.startsWith('storage-')) {
      toast.error('온톨로지 엔티티 모델은 여기서 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`"${modelName}" 모델을 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(modelId));

    const fileName = modelName + (modelName.endsWith('.glb') || modelName.endsWith('.gltf') ? '' : '.glb');
    const result = await delete3DModel(userId, storeId, fileName);

    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(modelId);
      return next;
    });

    if (result.success) {
      toast.success('모델 삭제 완료');
      onModelsReload?.();
    } else {
      toast.error(`삭제 실패: ${result.error}`);
    }
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              모델 레이어 관리
            </CardTitle>
            <CardDescription>
              {localActive.length}/{models.length}개 레이어 활성화됨
            </CardDescription>
          </div>
          {userId && storeId && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                size="sm"
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    모델 업로드
                  </>
                )}
              </Button>
            </>
          )}
        </div>
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
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.name}</span>
                            {model.metadata?.entityTypeId && (
                              <Badge variant="outline" className="text-xs">Ontology</Badge>
                            )}
                            {model.id.startsWith('storage-') && (
                              <Badge variant="outline" className="text-xs">Storage</Badge>
                            )}
                          </div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                      {model.id.startsWith('storage-') && userId && storeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(model.id, model.name);
                          }}
                          disabled={deletingIds.has(model.id)}
                        >
                          {deletingIds.has(model.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.name}</span>
                            {model.metadata?.entityTypeId && (
                              <Badge variant="outline" className="text-xs">Ontology</Badge>
                            )}
                            {model.id.startsWith('storage-') && (
                              <Badge variant="outline" className="text-xs">Storage</Badge>
                            )}
                          </div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                      {model.id.startsWith('storage-') && userId && storeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(model.id, model.name);
                          }}
                          disabled={deletingIds.has(model.id)}
                        >
                          {deletingIds.has(model.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.name}</span>
                            {model.metadata?.entityTypeId && (
                              <Badge variant="outline" className="text-xs">Ontology</Badge>
                            )}
                            {model.id.startsWith('storage-') && (
                              <Badge variant="outline" className="text-xs">Storage</Badge>
                            )}
                          </div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                      {model.id.startsWith('storage-') && userId && storeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(model.id, model.name);
                          }}
                          disabled={deletingIds.has(model.id)}
                        >
                          {deletingIds.has(model.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={localActive.includes(model.id)}
                          onCheckedChange={(checked) => handleToggle(model.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.name}</span>
                            {model.metadata?.entityTypeId && (
                              <Badge variant="outline" className="text-xs">Ontology</Badge>
                            )}
                            {model.id.startsWith('storage-') && (
                              <Badge variant="outline" className="text-xs">Storage</Badge>
                            )}
                          </div>
                          {model.dimensions && (
                            <div className="text-xs text-muted-foreground">
                              {model.dimensions.width}×{model.dimensions.height}×{model.dimensions.depth}m
                            </div>
                          )}
                        </div>
                      </div>
                      {model.id.startsWith('storage-') && userId && storeId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(model.id, model.name);
                          }}
                          disabled={deletingIds.has(model.id)}
                        >
                          {deletingIds.has(model.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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
