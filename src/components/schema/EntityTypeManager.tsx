import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Tag, TrendingUp, Settings2, X, Store, ShoppingCart, Users, CreditCard, MapPin, UserCheck, Package, Calendar, LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  enumValues?: string[];
}

interface EntityType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  properties: PropertyField[];
}

// 리테일 비즈니스 도메인 아이콘 프리셋
const ICON_PRESETS = [
  { value: "Store", label: "매장" },
  { value: "ShoppingCart", label: "상품" },
  { value: "Users", label: "고객" },
  { value: "CreditCard", label: "거래" },
  { value: "MapPin", label: "구역" },
  { value: "UserCheck", label: "직원" },
  { value: "Package", label: "재고" },
  { value: "TrendingUp", label: "판매" },
  { value: "Calendar", label: "이벤트" },
  { value: "Tag", label: "카테고리" },
];

// 아이콘 매핑
const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  ShoppingCart,
  Users,
  CreditCard,
  MapPin,
  UserCheck,
  Package,
  TrendingUp,
  Calendar,
  Tag,
};

const COLOR_PRESETS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// 리테일 도메인 데이터 타입
const PROPERTY_TYPES = [
  { value: "string", label: "텍스트" },
  { value: "number", label: "숫자" },
  { value: "currency", label: "금액" },
  { value: "date", label: "날짜" },
  { value: "datetime", label: "날짜+시간" },
  { value: "boolean", label: "참/거짓" },
  { value: "email", label: "이메일" },
  { value: "phone", label: "전화번호" },
  { value: "url", label: "URL" },
  { value: "enum", label: "선택 목록" },
];

export const EntityTypeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityType | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "properties">("basic");

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    color: "#3b82f6",
    icon: "Store",
    properties: [] as PropertyField[],
  });

  const [newProperty, setNewProperty] = useState<Partial<PropertyField>>({
    name: "",
    label: "",
    type: "string",
    required: false,
    description: "",
  });

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        properties: (item.properties || []) as unknown as PropertyField[]
      })) as EntityType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("ontology_entity_types")
        .insert({
          name: data.name,
          label: data.label,
          description: data.description,
          color: data.color,
          icon: data.icon,
          properties: data.properties as any,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 생성되었습니다" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "오류 발생", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: result, error } = await supabase
        .from("ontology_entity_types")
        .update({
          name: data.name,
          label: data.label,
          description: data.description,
          color: data.color,
          icon: data.icon,
          properties: data.properties as any,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 수정되었습니다" });
      setIsOpen(false);
      setEditingEntity(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ontology_entity_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-types"] });
      toast({ title: "엔티티 타입이 삭제되었습니다" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      description: "",
      color: "#3b82f6",
      icon: "Store",
      properties: [],
    });
    setNewProperty({
      name: "",
      label: "",
      type: "string",
      required: false,
      description: "",
    });
    setActiveTab("basic");
  };

  const handleEdit = (entity: EntityType) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      label: entity.label,
      description: entity.description || "",
      color: entity.color || "#3b82f6",
      icon: entity.icon || "Store",
      properties: entity.properties || [],
    });
    setIsOpen(true);
  };

  const handleAddProperty = () => {
    if (!newProperty.name || !newProperty.label) {
      toast({ title: "속성 이름과 표시명을 입력하세요", variant: "destructive" });
      return;
    }

    const property: PropertyField = {
      id: `prop_${Date.now()}`,
      name: newProperty.name || "",
      label: newProperty.label || "",
      type: newProperty.type || "string",
      required: newProperty.required || false,
      description: newProperty.description,
      defaultValue: newProperty.defaultValue,
      enumValues: newProperty.enumValues,
    };

    setFormData({
      ...formData,
      properties: [...formData.properties, property],
    });

    setNewProperty({
      name: "",
      label: "",
      type: "string",
      required: false,
      description: "",
    });

    toast({ title: "속성이 추가되었습니다" });
  };

  const handleRemoveProperty = (id: string) => {
    setFormData({
      ...formData,
      properties: formData.properties.filter((p) => p.id !== id),
    });
  };

  const handleSubmit = () => {
    if (editingEntity) {
      updateMutation.mutate({ id: editingEntity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">엔티티 타입 관리</h3>
          <p className="text-sm text-muted-foreground">
            매장, 상품, 고객 등 비즈니스 개체를 정의합니다
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingEntity(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              새 엔티티 타입
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? "엔티티 타입 수정" : "새 엔티티 타입 생성"}
              </DialogTitle>
              <DialogDescription>
                리테일 비즈니스의 주요 개체를 정의하고 속성을 추가하세요
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  속성 정의
                  {formData.properties.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {formData.properties.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 (영문, 고유)</Label>
                    <Input
                      id="name"
                      placeholder="store"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">표시명 (한글)</Label>
                    <Input
                      id="label"
                      placeholder="매장"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    placeholder="이 엔티티 타입에 대한 설명을 입력하세요"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">아이콘</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_PRESETS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">색상</Label>
                    <div className="flex gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-foreground' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">속성 목록</h4>
                      <p className="text-xs text-muted-foreground">
                        이 엔티티가 가질 데이터 필드를 정의합니다
                      </p>
                    </div>
                  </div>

                  {/* 기존 속성 목록 */}
                  {formData.properties.length > 0 && (
                    <div className="space-y-2">
                      {formData.properties.map((property) => (
                        <Card key={property.id} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{property.label}</Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {PROPERTY_TYPES.find(t => t.value === property.type)?.label}
                                </Badge>
                                {property.required && (
                                  <Badge variant="destructive" className="text-xs">필수</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {property.name}
                              </p>
                              {property.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {property.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveProperty(property.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* 새 속성 추가 폼 */}
                  <Card className="p-4 bg-muted/50">
                    <h4 className="text-sm font-semibold mb-3">새 속성 추가</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">이름 (영문)</Label>
                          <Input
                            placeholder="price"
                            value={newProperty.name}
                            onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">표시명 (한글)</Label>
                          <Input
                            placeholder="가격"
                            value={newProperty.label}
                            onChange={(e) => setNewProperty({ ...newProperty, label: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">데이터 타입</Label>
                          <Select
                            value={newProperty.type}
                            onValueChange={(value) => setNewProperty({ ...newProperty, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="required"
                              checked={newProperty.required}
                              onCheckedChange={(checked) =>
                                setNewProperty({ ...newProperty, required: checked as boolean })
                              }
                            />
                            <Label htmlFor="required" className="text-xs cursor-pointer">
                              필수 항목
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">설명 (선택)</Label>
                        <Textarea
                          placeholder="이 속성에 대한 설명"
                          value={newProperty.description}
                          onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAddProperty}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        속성 추가
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingEntity ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities?.map((entity) => (
          <Card key={entity.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${entity.color}20` }}
                  >
                    {(() => {
                      const IconComponent = ICON_MAP[entity.icon || "Tag"];
                      return IconComponent ? <IconComponent className="h-5 w-5" style={{ color: entity.color || undefined }} /> : <Tag className="h-5 w-5" style={{ color: entity.color || undefined }} />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-base">{entity.label}</CardTitle>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {entity.name}
                      </Badge>
                      {entity.properties && entity.properties.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          속성 {entity.properties.length}개
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(entity)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(entity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {entity.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{entity.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {entities?.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 엔티티 타입이 없습니다</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 엔티티 타입 생성
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
