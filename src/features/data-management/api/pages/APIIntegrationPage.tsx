import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Database, Clock, Zap, Plus, Trash2, CheckCircle, XCircle, Loader2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

export default function APIIntegrationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("connections");
  const [connections, setConnections] = useState<APIConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

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

  useState(() => {
    loadConnections();
  });

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
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              API 연결
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              동기화 로그
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>동기화 로그</CardTitle>
                <CardDescription>
                  API 동기화 이력을 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>동기화 로그 기능은 곧 제공됩니다</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
