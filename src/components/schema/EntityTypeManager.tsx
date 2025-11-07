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
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntityType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  properties: any;
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

const COLOR_PRESETS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

export const EntityTypeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityType | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    color: "#3b82f6",
    icon: "Store",
  });

  const { data: entities, isLoading } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EntityType[];
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
          properties: [],
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
    });
  };

  const handleEdit = (entity: EntityType) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      label: entity.label,
      description: entity.description || "",
      color: entity.color || "#3b82f6",
      icon: entity.icon || "Store",
    });
    setIsOpen(true);
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? "엔티티 타입 수정" : "새 엔티티 타입 생성"}
              </DialogTitle>
              <DialogDescription>
                리테일 비즈니스의 주요 개체를 정의하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
            </div>

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
                    <Tag className="h-5 w-5" style={{ color: entity.color || undefined }} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{entity.label}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {entity.name}
                    </Badge>
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
