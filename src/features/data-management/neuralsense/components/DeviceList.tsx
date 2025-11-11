import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, RefreshCw, Circle, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Device {
  id: string;
  device_name: string;
  device_id: string;
  location: string | null;
  status: string;
  raspberry_pi_model: string | null;
  ip_address: string | null;
  mac_address: string | null;
  last_seen: string | null;
  wifi_probe_enabled: boolean;
  probe_interval_seconds: number;
  probe_range_meters: number;
  created_at: string;
}

interface DeviceListProps {
  refreshTrigger?: number;
}

export function DeviceList({ refreshTrigger }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("neuralsense_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("디바이스 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("neuralsense_devices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("디바이스가 삭제되었습니다");
      fetchDevices();
    } catch (error) {
      console.error("Error deleting device:", error);
      toast.error("디바이스 삭제에 실패했습니다");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { label: "온라인", variant: "default" as const, color: "text-green-500" },
      offline: { label: "오프라인", variant: "secondary" as const, color: "text-gray-500" },
      error: { label: "오류", variant: "destructive" as const, color: "text-red-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Circle className={`h-2 w-2 fill-current ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>등록된 디바이스</CardTitle>
            <CardDescription>
              총 {devices.length}개의 디바이스가 등록되어 있습니다
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 디바이스가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>디바이스 ID</TableHead>
                  <TableHead>위치</TableHead>
                  <TableHead>IP 주소</TableHead>
                  <TableHead>WiFi Probe</TableHead>
                  <TableHead>마지막 확인</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell className="font-medium">{device.device_name}</TableCell>
                    <TableCell className="font-mono text-sm">{device.device_id}</TableCell>
                    <TableCell>{device.location || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{device.ip_address || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={device.wifi_probe_enabled ? "default" : "secondary"}>
                        {device.wifi_probe_enabled ? "활성화" : "비활성화"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.last_seen
                        ? formatDistanceToNow(new Date(device.last_seen), {
                            addSuffix: true,
                            locale: ko,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>디바이스 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                정말로 이 디바이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 관련된 모든 WiFi probe 데이터도 함께 삭제됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(device.id)}>
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
