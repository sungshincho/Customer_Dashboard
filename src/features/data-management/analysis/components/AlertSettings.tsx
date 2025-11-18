import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Alert } from "@/types/analysis.types";

// Export for backward compatibility
export type { Alert };

interface AlertSettingsProps {
  alerts: Alert[];
  onAlertsChange: (alerts: Alert[]) => void;
  availableMetrics: string[];
}

export const AlertSettings = ({ alerts, onAlertsChange, availableMetrics }: AlertSettingsProps) => {
  const [newAlert, setNewAlert] = useState({ metric: "", condition: "above" as const, threshold: 0 });

  const addAlert = () => {
    if (!newAlert.metric || newAlert.threshold <= 0) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }
    
    const alert: Alert = {
      id: Date.now().toString(),
      metric: newAlert.metric,
      condition: newAlert.condition,
      threshold: newAlert.threshold,
      enabled: true
    };
    
    onAlertsChange([...alerts, alert]);
    setNewAlert({ metric: "", condition: "above", threshold: 0 });
    toast.success("알림이 추가되었습니다");
  };

  const removeAlert = (id: string) => {
    onAlertsChange(alerts.filter(a => a.id !== id));
    toast.success("알림이 삭제되었습니다");
  };

  const toggleAlert = (id: string) => {
    onAlertsChange(alerts.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">실시간 알림 설정</h3>
      </div>

      <div className="space-y-4 mb-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {alert.metric} {alert.condition === "above" ? ">" : "<"} {alert.threshold}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3 p-4 border rounded-lg">
        <Label>새 알림 추가</Label>
        <div className="grid grid-cols-3 gap-2">
          <select 
            className="col-span-1 px-3 py-2 rounded-md border bg-background"
            value={newAlert.metric}
            onChange={(e) => setNewAlert({ ...newAlert, metric: e.target.value })}
          >
            <option value="">지표 선택</option>
            {availableMetrics.map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
          
          <select 
            className="col-span-1 px-3 py-2 rounded-md border bg-background"
            value={newAlert.condition}
            onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as any })}
          >
            <option value="above">초과</option>
            <option value="below">미만</option>
          </select>
          
          <Input 
            type="number" 
            placeholder="임계값"
            value={newAlert.threshold || ""}
            onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
          />
        </div>
        
        <Button onClick={addAlert} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          알림 추가
        </Button>
      </div>
    </Card>
  );
};
