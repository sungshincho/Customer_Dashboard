import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ArrowRight, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RelationType {
  id: string;
  name: string;
  label: string;
  description: string | null;
  source_entity_type: string;
  target_entity_type: string;
  directionality: string | null;
}

export const RelationTypeManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<RelationType | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    source_entity_type: "",
    target_entity_type: "",
    directionality: "directed",
  });

  const { data: relations, isLoading: relationsLoading } = useQuery({
    queryKey: ["relation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_relation_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RelationType[];
    },
  });

  const { data: entityTypes } = useQuery({
    queryKey: ["entity-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ontology_entity_types")
        .select("*")
        .order("label");

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("ontology_relation_types")
        .insert({
          name: data.name,
          label: data.label,
          description: data.description,
          source_entity_type: data.source_entity_type,
          target_entity_type: data.target_entity_type,
          directionality: data.directionality,
          properties: [],
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relation-types"] });
      toast({ title: "관계 타입이 생성되었습니다" });
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
        .from("ontology_relation_types")
        .update({
          name: data.name,
          label: data.label,
          description: data.description,
          source_entity_type: data.source_entity_type,
          target_entity_type: data.target_entity_type,
          directionality: data.directionality,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relation-types"] });
      toast({ title: "관계 타입이 수정되었습니다" });
      setIsOpen(false);
      setEditingRelation(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ontology_relation_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relation-types"] });
      toast({ title: "관계 타입이 삭제되었습니다" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      description: "",
      source_entity_type: "",
      target_entity_type: "",
      directionality: "directed",
    });
  };

  const handleEdit = (relation: RelationType) => {
    setEditingRelation(relation);
    setFormData({
      name: relation.name,
      label: relation.label,
      description: relation.description || "",
      source_entity_type: relation.source_entity_type,
      target_entity_type: relation.target_entity_type,
      directionality: relation.directionality || "directed",
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (editingRelation) {
      updateMutation.mutate({ id: editingRelation.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getEntityLabel = (name: string) => {
    return entityTypes?.find(e => e.name === name)?.label || name;
  };

  if (relationsLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">관계 타입 관리</h3>
          <p className="text-sm text-muted-foreground">
            엔티티 간의 관계를 정의합니다 (예: 고객이 상품을 구매)
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRelation(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              새 관계 타입
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRelation ? "관계 타입 수정" : "새 관계 타입 생성"}
              </DialogTitle>
              <DialogDescription>
                엔티티 간의 관계를 정의하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 (영문, 고유)</Label>
                  <Input
                    id="name"
                    placeholder="purchases"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">표시명 (한글)</Label>
                  <Input
                    id="label"
                    placeholder="구매한다"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="이 관계 타입에 대한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">출발 엔티티</Label>
                  <Select 
                    value={formData.source_entity_type} 
                    onValueChange={(value) => setFormData({ ...formData, source_entity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.name}>
                          {entity.label} ({entity.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target">도착 엔티티</Label>
                  <Select 
                    value={formData.target_entity_type} 
                    onValueChange={(value) => setFormData({ ...formData, target_entity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes?.map((entity) => (
                        <SelectItem key={entity.id} value={entity.name}>
                          {entity.label} ({entity.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="directionality">방향성</Label>
                <Select 
                  value={formData.directionality} 
                  onValueChange={(value) => setFormData({ ...formData, directionality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="directed">방향성 있음 (A → B)</SelectItem>
                    <SelectItem value="undirected">방향성 없음 (A ↔ B)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingRelation ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {relations?.map((relation) => (
          <Card key={relation.id} className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {getEntityLabel(relation.source_entity_type)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge className="bg-primary/10">
                      {relation.label}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">
                      {getEntityLabel(relation.target_entity_type)}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {relation.name}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(relation)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteMutation.mutate(relation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {relation.description && (
                <p className="text-sm text-muted-foreground mt-2">{relation.description}</p>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {relations?.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 관계 타입이 없습니다</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              첫 관계 타입 생성
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
