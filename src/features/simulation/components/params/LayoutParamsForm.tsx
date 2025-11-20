import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ZoneChange, FurnitureMove } from '@/features/simulation/types/layout.types';

interface LayoutParamsFormProps {
  params: {
    changedZones?: ZoneChange[];
    movedFurniture?: FurnitureMove[];
  };
  onChange: (params: any) => void;
}

export function LayoutParamsForm({ params, onChange }: LayoutParamsFormProps) {
  const addZoneChange = () => {
    const newZone: ZoneChange = {
      zoneId: `zone-${Date.now()}`,
      zoneName: '새 존',
      zoneType: 'main',
      originalPosition: { x: 0, y: 0, z: 0 },
      newPosition: { x: 2, y: 0, z: 2 },
      originalSize: { width: 3, depth: 3, height: 0.1 },
      newSize: { width: 3, depth: 3, height: 0.1 },
      facingCount: 10,
      changeReason: '고객 동선 최적화',
    };
    onChange({
      ...params,
      changedZones: [...(params.changedZones || []), newZone],
    });
  };

  const removeZoneChange = (index: number) => {
    onChange({
      ...params,
      changedZones: params.changedZones?.filter((_, i) => i !== index) || [],
    });
  };

  const updateZoneChange = (index: number, field: keyof ZoneChange, value: any) => {
    const updated = [...(params.changedZones || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...params, changedZones: updated });
  };

  const addFurnitureMove = () => {
    const newMove: FurnitureMove = {
      furnitureId: `furniture-${Date.now()}`,
      furnitureType: 'shelf',
      fromPosition: { x: 0, y: 0, z: 0 },
      toPosition: { x: 3, y: 0, z: 3 },
      movable: true,
    };
    onChange({
      ...params,
      movedFurniture: [...(params.movedFurniture || []), newMove],
    });
  };

  const removeFurnitureMove = (index: number) => {
    onChange({
      ...params,
      movedFurniture: params.movedFurniture?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">레이아웃 변경 설정</h3>
        <p className="text-sm text-muted-foreground">
          존과 가구의 위치를 변경하여 매장 레이아웃을 시뮬레이션합니다.
        </p>
      </div>

      {/* Zone Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            존 변경
            <Button onClick={addZoneChange} size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              존 추가
            </Button>
          </CardTitle>
          <CardDescription>매장 내 존의 위치와 크기를 변경합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.changedZones?.map((zone, idx) => (
            <Card key={idx} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>존 #{idx + 1}</Label>
                  <Button
                    onClick={() => removeZoneChange(idx)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>존 이름</Label>
                    <Input
                      value={zone.zoneName}
                      onChange={(e) => updateZoneChange(idx, 'zoneName', e.target.value)}
                      placeholder="존 이름"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>존 타입</Label>
                    <Select
                      value={zone.zoneType}
                      onValueChange={(v) => updateZoneChange(idx, 'zoneType', v)}
                    >
                      <SelectTrigger>
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
                    <Label>새 위치 X</Label>
                    <Input
                      type="number"
                      value={zone.newPosition?.x || 0}
                      onChange={(e) =>
                        updateZoneChange(idx, 'newPosition', {
                          ...zone.newPosition,
                          x: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>새 위치 Z</Label>
                    <Input
                      type="number"
                      value={zone.newPosition?.z || 0}
                      onChange={(e) =>
                        updateZoneChange(idx, 'newPosition', {
                          ...zone.newPosition,
                          z: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>너비 (m)</Label>
                    <Input
                      type="number"
                      value={zone.newSize?.width || 3}
                      onChange={(e) =>
                        updateZoneChange(idx, 'newSize', {
                          ...zone.newSize,
                          width: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>깊이 (m)</Label>
                    <Input
                      type="number"
                      value={zone.newSize?.depth || 3}
                      onChange={(e) =>
                        updateZoneChange(idx, 'newSize', {
                          ...zone.newSize,
                          depth: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>변경 이유</Label>
                    <Input
                      value={zone.changeReason || ''}
                      onChange={(e) => updateZoneChange(idx, 'changeReason', e.target.value)}
                      placeholder="예: 고객 동선 최적화"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {(!params.changedZones || params.changedZones.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              변경할 존을 추가해주세요
            </div>
          )}
        </CardContent>
      </Card>

      {/* Furniture Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            가구 이동
            <Button onClick={addFurnitureMove} size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              가구 추가
            </Button>
          </CardTitle>
          <CardDescription>매장 내 가구의 위치를 변경합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.movedFurniture?.map((furniture, idx) => (
            <Card key={idx} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>가구 #{idx + 1}</Label>
                  <Button
                    onClick={() => removeFurnitureMove(idx)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 col-span-2">
                    <Label>가구 타입</Label>
                    <Input
                      value={furniture.furnitureType}
                      onChange={(e) =>
                        onChange({
                          ...params,
                          movedFurniture: params.movedFurniture?.map((f, i) =>
                            i === idx ? { ...f, furnitureType: e.target.value } : f
                          ),
                        })
                      }
                      placeholder="예: shelf, rack, table"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>이동 후 X</Label>
                    <Input
                      type="number"
                      value={furniture.toPosition.x}
                      onChange={(e) =>
                        onChange({
                          ...params,
                          movedFurniture: params.movedFurniture?.map((f, i) =>
                            i === idx
                              ? {
                                  ...f,
                                  toPosition: { ...f.toPosition, x: parseFloat(e.target.value) },
                                }
                              : f
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>이동 후 Z</Label>
                    <Input
                      type="number"
                      value={furniture.toPosition.z}
                      onChange={(e) =>
                        onChange({
                          ...params,
                          movedFurniture: params.movedFurniture?.map((f, i) =>
                            i === idx
                              ? {
                                  ...f,
                                  toPosition: { ...f.toPosition, z: parseFloat(e.target.value) },
                                }
                              : f
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {(!params.movedFurniture || params.movedFurniture.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              이동할 가구를 추가해주세요
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 레이아웃 변경 시 AI가 고객 동선, 체류시간, 전환율에 미치는 영향을 예측합니다.
        </p>
      </div>
    </div>
  );
}
