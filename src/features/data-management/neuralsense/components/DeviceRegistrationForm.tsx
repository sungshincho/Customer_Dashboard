import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const deviceSchema = z.object({
  deviceName: z.string().min(1, "디바이스 이름을 입력해주세요"),
  deviceId: z.string().min(1, "디바이스 ID를 입력해주세요"),
  location: z.string().optional(),
  raspberryPiModel: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  wifiProbeEnabled: z.boolean().default(true),
  probeIntervalSeconds: z.number().min(1).max(60).default(5),
  probeRangeMeters: z.number().min(1).max(200).default(50),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceRegistrationFormProps {
  onSuccess?: () => void;
}

export function DeviceRegistrationForm({ onSuccess }: DeviceRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceName: "",
      deviceId: "",
      location: "",
      raspberryPiModel: "",
      ipAddress: "",
      macAddress: "",
      wifiProbeEnabled: true,
      probeIntervalSeconds: 5,
      probeRangeMeters: 50,
    },
  });

  const onSubmit = async (data: DeviceFormData) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const { error } = await supabase.from("neuralsense_devices").insert({
        user_id: userData.user.id,
        device_name: data.deviceName,
        device_id: data.deviceId,
        location: data.location || null,
        raspberry_pi_model: data.raspberryPiModel || null,
        ip_address: data.ipAddress || null,
        mac_address: data.macAddress || null,
        wifi_probe_enabled: data.wifiProbeEnabled,
        probe_interval_seconds: data.probeIntervalSeconds,
        probe_range_meters: data.probeRangeMeters,
        status: "offline",
      });

      if (error) throw error;

      toast.success("디바이스가 성공적으로 등록되었습니다");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Device registration error:", error);
      toast.error("디바이스 등록에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 디바이스 등록</CardTitle>
        <CardDescription>
          라즈베리파이 디바이스를 등록하고 WiFi probe 설정을 구성하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>디바이스 이름 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 강남점 입구" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>디바이스 ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: RPI-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>위치</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 1층 매장 입구" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="raspberryPiModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>라즈베리파이 모델</FormLabel>
                    <FormControl>
                      <Input placeholder="예: Raspberry Pi 4 Model B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP 주소</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 192.168.1.100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="macAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC 주소</FormLabel>
                    <FormControl>
                      <Input placeholder="예: AA:BB:CC:DD:EE:FF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">WiFi Probe 설정</h3>

              <FormField
                control={form.control}
                name="wifiProbeEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">WiFi Probe 활성화</FormLabel>
                      <FormDescription>
                        WiFi probe request 추적을 활성화합니다
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="probeIntervalSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>스캔 주기 (초)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>WiFi 스캔 주기 (1-60초)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probeRangeMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>감지 범위 (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={200}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>WiFi 신호 감지 범위 (1-200m)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              디바이스 등록
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
