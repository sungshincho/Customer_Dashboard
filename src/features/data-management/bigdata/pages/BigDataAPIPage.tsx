import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSourceForm, DataSourceList, SyncScheduleForm, SyncScheduleList } from "../components";
import { Database, Clock } from "lucide-react";

export default function BigDataAPIPage() {
  const [refreshSources, setRefreshSources] = useState(0);
  const [refreshSchedules, setRefreshSchedules] = useState(0);
  const [editingSource, setEditingSource] = useState<any>(null);

  const handleSourceSuccess = () => {
    setRefreshSources((prev) => prev + 1);
    setEditingSource(null);
  };

  const handleScheduleSuccess = () => {
    setRefreshSchedules((prev) => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">빅데이터 API 연동</h1>
          <p className="text-muted-foreground mt-2">
            외부 API와 연동하여 다양한 빅데이터를 수집하고 동기화합니다
          </p>
        </div>
      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            데이터 소스
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            동기화 스케줄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DataSourceForm onSuccess={handleSourceSuccess} editData={editingSource} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">등록된 데이터 소스</h3>
              <DataSourceList
                refresh={refreshSources}
                onEdit={(source) => setEditingSource(source)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SyncScheduleForm onSuccess={handleScheduleSuccess} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">동기화 스케줄</h3>
              <SyncScheduleList refresh={refreshSchedules} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
