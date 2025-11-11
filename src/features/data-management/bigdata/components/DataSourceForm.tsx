import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface DataSourceFormData {
  name: string;
  source_type: string;
  api_url: string;
  api_key: string;
  description: string;
  is_active: boolean;
}

interface DataSourceFormProps {
  onSuccess?: () => void;
  editData?: any;
}

export function DataSourceForm({ onSuccess, editData }: DataSourceFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch } = useForm<DataSourceFormData>({
    defaultValues: editData || {
      name: "",
      source_type: "custom",
      api_url: "",
      api_key: "",
      description: "",
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  const onSubmit = async (data: DataSourceFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const payload = {
        user_id: user.id,
        name: data.name,
        source_type: data.source_type,
        api_url: data.api_url,
        api_key_encrypted: data.api_key, // TODO: Implement proper encryption
        description: data.description,
        is_active: data.is_active,
      };

      if (editData?.id) {
        const { error } = await supabase
          .from("external_data_sources")
          .update(payload)
          .eq("id", editData.id);
        if (error) throw error;
        toast({ title: "데이터 소스가 업데이트되었습니다." });
      } else {
        const { error } = await supabase
          .from("external_data_sources")
          .insert(payload);
        if (error) throw error;
        toast({ title: "데이터 소스가 등록되었습니다." });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "오류가 발생했습니다",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editData ? "데이터 소스 수정" : "외부 데이터 소스 등록"}</CardTitle>
        <CardDescription>
          외부 빅데이터 API와 연동하여 데이터를 수집합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">데이터 소스 이름</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="예: 날씨 API"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">데이터 소스 유형</Label>
            <Select
              onValueChange={(value) => setValue("source_type", value)}
              defaultValue={editData?.source_type || "custom"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weather">날씨</SelectItem>
                <SelectItem value="demographics">인구통계</SelectItem>
                <SelectItem value="economic">경제 지표</SelectItem>
                <SelectItem value="social">소셜 미디어</SelectItem>
                <SelectItem value="custom">커스텀</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_url">API URL</Label>
            <Input
              id="api_url"
              {...register("api_url")}
              placeholder="https://api.example.com/data"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              {...register("api_key")}
              placeholder="API 키를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="데이터 소스에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">활성화</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "저장 중..." : editData ? "수정" : "등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
