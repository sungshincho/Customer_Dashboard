import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Pause } from "lucide-react";
import { format } from "date-fns";

interface SyncSchedule {
  id: string;
  schedule_name: string;
  cron_expression: string;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  last_status: string | null;
  data_source: {
    name: string;
  };
}

interface SyncScheduleListProps {
  refresh?: number;
}

export function SyncScheduleList({ refresh }: SyncScheduleListProps) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<SyncSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("data_sync_schedules")
        .select(`
          *,
          data_source:external_data_sources(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast({
        title: "스케줄 로드 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 스케줄을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("data_sync_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "스케줄이 삭제되었습니다." });
      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("data_sync_schedules")
        .update({ is_enabled: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: currentStatus ? "스케줄이 일시정지되었습니다" : "스케줄이 활성화되었습니다" });
      fetchSchedules();
    } catch (error: any) {
      toast({
        title: "상태 변경 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">대기중</Badge>;
    if (status === "success") return <Badge variant="default">성공</Badge>;
    if (status === "failed") return <Badge variant="destructive">실패</Badge>;
    if (status === "running") return <Badge variant="outline">실행중</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (loading) {
    return <div className="text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 스케줄이 없습니다
          </CardContent>
        </Card>
      ) : (
        schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{schedule.schedule_name}</CardTitle>
                  <CardDescription>
                    데이터 소스: {schedule.data_source?.name || "N/A"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(schedule.last_status)}
                  <Badge variant={schedule.is_enabled ? "default" : "secondary"}>
                    {schedule.is_enabled ? "활성" : "일시정지"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Cron:</strong> {schedule.cron_expression}
                </p>
                {schedule.last_run_at && (
                  <p className="text-sm text-muted-foreground">
                    <strong>마지막 실행:</strong>{" "}
                    {format(new Date(schedule.last_run_at), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                )}
                {schedule.next_run_at && (
                  <p className="text-sm text-muted-foreground">
                    <strong>다음 실행:</strong>{" "}
                    {format(new Date(schedule.next_run_at), "yyyy-MM-dd HH:mm:ss")}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(schedule.id, schedule.is_enabled)}
                  >
                    {schedule.is_enabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        일시정지
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        활성화
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
