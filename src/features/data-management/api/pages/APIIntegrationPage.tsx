import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Database, Clock, Zap, Plus, Trash2, CheckCircle, XCircle, Loader2, Play, Eye, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedStore } from "@/hooks/useSelectedStore";

interface APIConnection {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'webhook';
  url: string;
  method?: string | null;
  headers?: any;
  auth_type?: string;
  auth_value?: string | null;
  is_active: boolean;
  last_sync?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DataSyncSchedule {
  id: string;
  schedule_name: string;
  data_source_id: string;
  cron_expression: string;
  is_enabled: boolean;
  last_run_at?: string | null;
  last_status?: string | null;
  next_run_at?: string | null;
  error_message?: string | null;
  sync_config?: any;
  created_at: string;
  updated_at: string;
}

interface DataSyncLog {
  id: string;
  schedule_id: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  records_synced?: number | null;
  error_message?: string | null;
  metadata?: any;
}

const TARGET_TABLES = [
  { value: 'customers', label: '고객 (customers)' },
  { value: 'products', label: '상품 (products)' },
  { value: 'purchases', label: '구매 (purchases)' },
  { value: 'visits', label: '방문 (visits)' },
  { value: 'inventory_levels', label: '재고 (inventory_levels)' },
];

export default function APIIntegrationPage() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const [activeTab, setActiveTab] = useState("connections");
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [schedules, setSchedules] = useState<DataSyncSchedule[]>([]);
  const [logs, setLogs] = useState<DataSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "rest" as 'rest' | 'graphql' | 'webhook',
    url: "",
    method: "GET",
    headers: "{}",
    auth_type: "none" as 'none' | 'api_key' | 'bearer' | 'basic',
    auth_value: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    schedule_name: "",
    data_source_id: "",
    cron_expression: "0 0 * * *",
    target_table: "",
    data_path: "",
  });

  // Field mapping state
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [apiPreviewData, setApiPreviewData] = useState<any>(null);
  const [fieldMappingConfig, setFieldMappingConfig] = useState<{
    [key: string]: string;
  }>({});

  // Load connections
  const loadConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data || []) as APIConnection[]);
    } catch (error: any) {
      toast.error('API 연동 목록 로딩 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create connection
  const createConnection = async () => {
    if (!user) return;

    if (!formData.name || !formData.url) {
      toast.error('이름과 URL을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      let headers = {};
      try {
        headers = JSON.parse(formData.headers);
      } catch {
        toast.error('헤더는 유효한 JSON 형식이어야 합니다');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('api_connections')
        .insert({
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          url: formData.url,
          method: formData.method,
          headers,
          auth_type: formData.auth_type,
          auth_value: formData.auth_value || null,
          is_active: true,
        });

      if (error) throw error;

      toast.success('API 연동이 생성되었습니다');
      setFormData({
        name: "",
        type: "rest",
        url: "",
        method: "GET",
        headers: "{}",
        auth_type: "none",
        auth_value: "",
      });
      loadConnections();
    } catch (error: any) {
      toast.error('API 연동 생성 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async (connectionId: string) => {
    setTestingId(connectionId);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connection', {
        body: { connectionId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('API 연결 테스트 성공!');
      } else {
        toast.error('API 연결 테스트 실패: ' + data.error);
      }
    } catch (error: any) {
      toast.error('테스트 실패: ' + error.message);
    } finally {
      setTestingId(null);
    }
  };

  // Delete connection
  const deleteConnection = async (id: string) => {
    if (!confirm('정말 이 API 연동을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('api_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('API 연동이 삭제되었습니다');
      loadConnections();
    } catch (error: any) {
      toast.error('삭제 실패: ' + error.message);
    }
  };

  // Toggle active status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_connections')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'API 연동이 비활성화되었습니다' : 'API 연동이 활성화되었습니다');
      loadConnections();
    } catch (error: any) {
      toast.error('상태 변경 실패: ' + error.message);
    }
  };

  // Load schedules
  const loadSchedules = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_sync_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchedules((data || []) as DataSyncSchedule[]);
    } catch (error: any) {
      toast.error('스케줄 목록 로딩 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load logs
  const loadLogs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_sync_logs')
        .select(`
          *,
          schedule:data_sync_schedules(schedule_name)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as DataSyncLog[]);
    } catch (error: any) {
      toast.error('로그 목록 로딩 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Preview API response for field mapping
  const previewApiResponse = async () => {
    if (!scheduleForm.data_source_id) {
      toast.error("API 연결을 먼저 선택해주세요");
      return;
    }

    toast.info("API 응답을 가져오는 중...");
    setLoading(true);

    try {
      const { data: testResult, error } = await supabase.functions.invoke(
        "test-api-connection",
        {
          body: { connectionId: scheduleForm.data_source_id },
        }
      );

      if (error || !testResult?.success) {
        toast.error("API 연결 실패: " + (error?.message || testResult?.message));
        return;
      }

      setApiPreviewData(testResult.data);
      setShowFieldMapping(true);
      toast.success("API 응답을 가져왔습니다");
    } catch (error: any) {
      toast.error("API 응답 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create schedule
  const createSchedule = async () => {
    if (!user) return;

    if (!scheduleForm.schedule_name || !scheduleForm.data_source_id) {
      toast.error("스케줄 이름과 API 연결을 선택해주세요");
      return;
    }

    if (!scheduleForm.target_table || Object.keys(fieldMappingConfig).length === 0) {
      toast.error("대상 테이블과 필드 매핑을 설정해주세요");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('data_sync_schedules')
        .insert({
          user_id: user.id,
          org_id: orgId,
          schedule_name: scheduleForm.schedule_name,
          data_source_id: scheduleForm.data_source_id,
          cron_expression: scheduleForm.cron_expression,
          sync_config: {
            target_table: scheduleForm.target_table,
            data_path: scheduleForm.data_path,
            field_mapping: fieldMappingConfig,
            store_id: selectedStore?.id,
          },
          is_enabled: true,
        });

      if (error) throw error;

      toast.success('스케줄이 생성되었습니다');
      setScheduleForm({
        schedule_name: "",
        data_source_id: "",
        cron_expression: "0 0 * * *",
        target_table: "",
        data_path: "",
      });
      setFieldMappingConfig({});
      setShowFieldMapping(false);
      setApiPreviewData(null);
      loadSchedules();
    } catch (error: any) {
      toast.error('스케줄 생성 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Run schedule now
  const runScheduleNow = async (scheduleId: string) => {
    setRunningScheduleId(scheduleId);
    toast.info("동기화를 시작합니다...");

    try {
      const { data, error } = await supabase.functions.invoke("sync-api-data", {
        body: { scheduleId, manualRun: true },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`동기화 완료: ${data.records_synced}개 레코드 처리됨`);
        loadLogs();
        loadSchedules();
      } else {
        toast.error("동기화 실패: " + data.error);
      }
    } catch (error: any) {
      toast.error("동기화 실패: " + error.message);
    } finally {
      setRunningScheduleId(null);
    }
  };

  // Toggle schedule enabled
  const toggleSchedule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('data_sync_schedules')
        .update({ is_enabled: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? '스케줄이 비활성화되었습니다' : '스케줄이 활성화되었습니다');
      loadSchedules();
    } catch (error: any) {
      toast.error('상태 변경 실패: ' + error.message);
    }
  };

  // Delete schedule
  const deleteSchedule = async (id: string) => {
    if (!confirm('정말 이 스케줄을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('data_sync_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('스케줄이 삭제되었습니다');
      loadSchedules();
    } catch (error: any) {
      toast.error('삭제 실패: ' + error.message);
    }
  };

  // Extract field paths from nested object
  const extractFields = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    const fields: string[] = [];
    
    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        fields.push(...extractFields(value, path));
      } else {
        fields.push(path);
      }
    }
    
    return fields;
  };

  useEffect(() => {
    loadConnections();
    loadSchedules();
    loadLogs();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            API 연동
          </h1>
          <p className="text-muted-foreground mt-2">
            외부 API와 연동하여 실시간으로 데이터를 수집하고 동기화합니다
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              API 연결
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              스케줄 관리
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              동기화 로그
            </TabsTrigger>
          </TabsList>

          {/* API Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    새 API 연동 추가
                  </CardTitle>
                  <CardDescription>
                    REST API, GraphQL, Webhook 등 다양한 형태의 API를 연동할 수 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">연동 이름</Label>
                    <Input
                      id="name"
                      placeholder="예: Google Analytics API"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">API 타입</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rest">REST API</SelectItem>
                        <SelectItem value="graphql">GraphQL</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">API URL</Label>
                    <Input
                      id="url"
                      placeholder="https://api.example.com/data"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                  </div>

                  {formData.type === 'rest' && (
                    <div className="space-y-2">
                      <Label htmlFor="method">HTTP Method</Label>
                      <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="auth_type">인증 방식</Label>
                    <Select value={formData.auth_type} onValueChange={(value: any) => setFormData({ ...formData, auth_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">인증 없음</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.auth_type !== 'none' && (
                    <div className="space-y-2">
                      <Label htmlFor="auth_value">인증 값</Label>
                      <Input
                        id="auth_value"
                        type="password"
                        placeholder="API Key 또는 Token"
                        value={formData.auth_value}
                        onChange={(e) => setFormData({ ...formData, auth_value: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="headers">추가 헤더 (JSON)</Label>
                    <Textarea
                      id="headers"
                      placeholder='{"Content-Type": "application/json"}'
                      value={formData.headers}
                      onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button onClick={createConnection} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        API 연동 추가
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Connections List */}
              <Card>
                <CardHeader>
                  <CardTitle>등록된 API 연결</CardTitle>
                  <CardDescription>
                    {connections.length}개의 API 연동이 등록되어 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading && connections.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>등록된 API 연동이 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {connections.map((conn) => (
                        <div key={conn.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{conn.name}</h4>
                                <Badge variant={conn.is_active ? "default" : "secondary"}>
                                  {conn.is_active ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      활성
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      비활성
                                    </>
                                  )}
                                </Badge>
                                <Badge variant="outline">{conn.type.toUpperCase()}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{conn.url}</p>
                              {conn.last_sync && (
                                <p className="text-xs text-muted-foreground">
                                  마지막 동기화: {new Date(conn.last_sync).toLocaleString('ko-KR')}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteConnection(conn.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testConnection(conn.id)}
                              disabled={testingId === conn.id}
                            >
                              {testingId === conn.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  테스트 중...
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  연결 테스트
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleActive(conn.id, conn.is_active)}
                            >
                              {conn.is_active ? '비활성화' : '활성화'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Schedule Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    새 스케줄 추가
                  </CardTitle>
                  <CardDescription>
                    API 데이터를 자동으로 동기화하는 스케줄을 설정합니다
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule_name">스케줄 이름</Label>
                    <Input
                      id="schedule_name"
                      placeholder="예: 매일 밤 12시 고객 데이터 동기화"
                      value={scheduleForm.schedule_name}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_source_id">API 연결 선택</Label>
                    <Select 
                      value={scheduleForm.data_source_id} 
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, data_source_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="API 연결을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {conn.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_table">대상 테이블</Label>
                    <Select 
                      value={scheduleForm.target_table} 
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, target_table: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="데이터를 저장할 테이블 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_TABLES.map((table) => (
                          <SelectItem key={table.value} value={table.value}>
                            {table.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_path">데이터 경로 (선택사항)</Label>
                    <Input
                      id="data_path"
                      placeholder="예: data.items (중첩된 배열 경로)"
                      value={scheduleForm.data_path}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, data_path: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      API 응답에서 배열이 중첩되어 있는 경우 경로를 지정하세요
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cron_expression">Cron 표현식</Label>
                    <Input
                      id="cron_expression"
                      placeholder="0 0 * * * (매일 자정)"
                      value={scheduleForm.cron_expression}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, cron_expression: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      예: 0 0 * * * (매일 자정), 0 */6 * * * (6시간마다)
                    </p>
                  </div>

                  <Button 
                    onClick={previewApiResponse} 
                    disabled={!scheduleForm.data_source_id || loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    API 응답 미리보기 & 필드 매핑
                  </Button>

                  {/* Field Mapping Section */}
                  {showFieldMapping && apiPreviewData && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        <Label className="text-base font-semibold">필드 매핑 설정</Label>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {scheduleForm.target_table && extractFields(
                          Array.isArray(apiPreviewData) ? apiPreviewData[0] : apiPreviewData
                        ).map((fieldPath) => (
                          <div key={fieldPath} className="grid grid-cols-2 gap-2 items-center">
                            <Label className="text-xs truncate" title={fieldPath}>
                              {fieldPath}
                            </Label>
                            <Input
                              placeholder="DB 컬럼명"
                              value={fieldMappingConfig[fieldPath] || ''}
                              onChange={(e) => setFieldMappingConfig({
                                ...fieldMappingConfig,
                                [fieldPath]: e.target.value
                              })}
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        API 필드를 데이터베이스 컬럼에 매핑하세요
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={createSchedule} 
                    disabled={loading || !scheduleForm.target_table || Object.keys(fieldMappingConfig).length === 0} 
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        스케줄 추가
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Schedules List */}
              <Card>
                <CardHeader>
                  <CardTitle>등록된 스케줄</CardTitle>
                  <CardDescription>
                    {schedules.length}개의 스케줄이 등록되어 있습니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading && schedules.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>등록된 스케줄이 없습니다</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((schedule) => (
                        <div key={schedule.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{schedule.schedule_name}</h4>
                                <Badge variant={schedule.is_enabled ? "default" : "secondary"}>
                                  {schedule.is_enabled ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      활성
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      비활성
                                    </>
                                  )}
                                </Badge>
                                {schedule.last_status && (
                                  <Badge variant={schedule.last_status === 'success' ? 'default' : 'destructive'}>
                                    {schedule.last_status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Cron: {schedule.cron_expression}</p>
                              {schedule.sync_config?.target_table && (
                                <p className="text-xs text-muted-foreground">
                                  대상: {schedule.sync_config.target_table}
                                </p>
                              )}
                              {schedule.last_run_at && (
                                <p className="text-xs text-muted-foreground">
                                  마지막 실행: {new Date(schedule.last_run_at).toLocaleString('ko-KR')}
                                </p>
                              )}
                              {schedule.next_run_at && (
                                <p className="text-xs text-muted-foreground">
                                  다음 실행: {new Date(schedule.next_run_at).toLocaleString('ko-KR')}
                                </p>
                              )}
                              {schedule.error_message && (
                                <p className="text-xs text-destructive">오류: {schedule.error_message}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => runScheduleNow(schedule.id)}
                              disabled={runningScheduleId === schedule.id}
                            >
                              {runningScheduleId === schedule.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  실행 중...
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3 mr-1" />
                                  지금 동기화
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSchedule(schedule.id, schedule.is_enabled)}
                            >
                              {schedule.is_enabled ? '비활성화' : '활성화'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>동기화 로그</CardTitle>
                <CardDescription>
                  API 동기화 이력을 확인할 수 있습니다 (최근 50개)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && logs.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>동기화 로그가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                {(log as any).schedule?.schedule_name || 'Unknown Schedule'}
                              </h4>
                              <Badge variant={
                                log.status === 'success' ? 'default' : 
                                log.status === 'failed' ? 'destructive' : 
                                'secondary'
                              }>
                                {log.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>시작: {new Date(log.started_at).toLocaleString('ko-KR')}</p>
                              {log.completed_at && (
                                <p>완료: {new Date(log.completed_at).toLocaleString('ko-KR')}</p>
                              )}
                              {log.records_synced !== null && log.records_synced !== undefined && (
                                <p>동기화된 레코드: {log.records_synced}개</p>
                              )}
                              {log.metadata?.target_table && (
                                <p>대상 테이블: {log.metadata.target_table}</p>
                              )}
                            </div>
                            {log.error_message && (
                              <p className="text-xs text-destructive mt-2">오류: {log.error_message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
