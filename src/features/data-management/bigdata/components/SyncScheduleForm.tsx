import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface SyncScheduleFormData {
  data_source_id: string;
  schedule_name: string;
  cron_expression: string;
  is_enabled: boolean;
}

interface SyncScheduleFormProps {
  onSuccess?: () => void;
}

export function SyncScheduleForm({ onSuccess }: SyncScheduleFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const { register, handleSubmit, setValue, watch } = useForm<SyncScheduleFormData>({
    defaultValues: {
      schedule_name: "",
      cron_expression: "0 0 * * *",
      is_enabled: true,
    },
  });

  const isEnabled = watch("is_enabled");

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    const { data } = await supabase
      .from("external_data_sources")
      .select("id, name")
      .eq("is_active", true);
    setDataSources(data || []);
  };

  const onSubmit = async (data: SyncScheduleFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("data_sync_schedules").insert({
        user_id: user.id,
        data_source_id: data.data_source_id,
        schedule_name: data.schedule_name,
        cron_expression: data.cron_expression,
        is_enabled: data.is_enabled,
      });

      if (error) throw error;
      toast({ title: "동기화 스케줄이 생성되었습니다." });
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

  const cronPresets = [
    { label: "매 시간", value: "0 * * * *" },
    { label: "매일 자정", value: "0 0 * * *" },
    { label: "매주 월요일", value: "0 0 * * 1" },
    { label: "매월 1일", value: "0 0 1 * *" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>동기화 스케줄 생성</CardTitle>
        <CardDescription>데이터 소스의 자동 동기화 일정을 설정합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_source_id">데이터 소스</Label>
            <Select onValueChange={(value) => setValue("data_source_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="데이터 소스 선택" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule_name">스케줄 이름</Label>
            <Input
              id="schedule_name"
              {...register("schedule_name", { required: true })}
              placeholder="예: 일일 날씨 데이터 수집"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cron_expression">Cron 표현식</Label>
            <Select
              onValueChange={(value) => setValue("cron_expression", value)}
              defaultValue="0 0 * * *"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cronPresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label} ({preset.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_enabled"
              checked={isEnabled}
              onCheckedChange={(checked) => setValue("is_enabled", checked)}
            />
            <Label htmlFor="is_enabled">활성화</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "생성 중..." : "스케줄 생성"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
