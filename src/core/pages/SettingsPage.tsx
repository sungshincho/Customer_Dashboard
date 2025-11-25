import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, Users, CreditCard, Plus, Trash2 } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Organization Settings
  const [orgSettings, setOrgSettings] = useState({
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    defaultKpiSet: ['totalVisits', 'totalRevenue', 'conversionRate'],
    logoUrl: '',
    brandColor: '#1B6BFF',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    slackEnabled: false,
    slackWebhookUrl: '',
    notificationTypes: ['stockout', 'anomaly', 'milestone'],
  });

  // Report Schedules
  const [reportSchedules, setReportSchedules] = useState<any[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    reportName: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    timeOfDay: '09:00',
    recipients: [],
    reportType: 'sales',
  });

  // License Info
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  // User Roles
  const [userRoles, setUserRoles] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get org_id from organization_members
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      const orgId = memberData?.org_id;

      // Fetch organization settings
      if (orgId) {
        const { data: orgData } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('org_id', orgId)
          .single();

        if (orgData) {
          setOrgSettings({
            timezone: orgData.timezone || 'Asia/Seoul',
            currency: orgData.currency || 'KRW',
            defaultKpiSet: Array.isArray(orgData.default_kpi_set) 
              ? orgData.default_kpi_set 
              : ['totalVisits', 'totalRevenue', 'conversionRate'],
            logoUrl: orgData.logo_url || '',
            brandColor: orgData.brand_color || '#1B6BFF',
          });
        }
      }

      // Fetch notification settings
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifData) {
        setNotificationSettings({
          emailEnabled: notifData.email_enabled,
          slackEnabled: notifData.slack_enabled,
          slackWebhookUrl: notifData.slack_webhook_url || '',
          notificationTypes: Array.isArray(notifData.notification_types) 
            ? notifData.notification_types.filter((item): item is string => typeof item === 'string')
            : ['stockout', 'anomaly', 'milestone'],
        });
      }

      // Fetch report schedules
      const { data: schedulesData } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (schedulesData) {
        setReportSchedules(schedulesData);
      }

      // Fetch license info
      if (orgId) {
        const { data: licenseData } = await supabase
          .from('licenses')
          .select('*')
          .eq('org_id', orgId)
          .eq('assigned_to', user.id)
          .single();

        if (licenseData) {
          setLicenseInfo(licenseData);
        }
      }

      // Fetch user roles from organization_members
      if (orgId) {
        const { data: rolesData } = await supabase
          .from('organization_members')
          .select(`
            *,
            licenses (
              license_type,
              status
            )
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });

        if (rolesData) {
          setUserRoles(rolesData);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveOrgSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get org_id
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!memberData?.org_id) throw new Error('Organization not found');

      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: memberData.org_id,
          timezone: orgSettings.timezone,
          currency: orgSettings.currency,
          default_kpi_set: orgSettings.defaultKpiSet.join(','),
          logo_url: orgSettings.logoUrl,
          brand_color: orgSettings.brandColor,
        });

      if (error) throw error;

      toast({
        title: "조직 설정 저장 완료",
        description: "조직 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "조직 설정 저장 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_enabled: notificationSettings.emailEnabled,
          slack_enabled: notificationSettings.slackEnabled,
          slack_webhook_url: notificationSettings.slackWebhookUrl,
          notification_types: notificationSettings.notificationTypes,
        });

      if (error) throw error;

      toast({
        title: "알림 설정 저장 완료",
        description: "알림 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "알림 설정 저장 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addReportSchedule = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get org_id
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('report_schedules')
        .insert({
          user_id: user.id,
          org_id: memberData?.org_id,
          report_name: newSchedule.reportName,
          report_type: newSchedule.reportType,
          frequency: newSchedule.frequency,
          recipients: newSchedule.recipients,
        });

      if (error) throw error;

      toast({
        title: "스케줄 추가 완료",
        description: "리포트 스케줄이 추가되었습니다.",
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: "스케줄 추가 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteReportSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('report_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "스케줄 삭제 완료",
        description: "리포트 스케줄이 삭제되었습니다.",
      });

      fetchSettings();
    } catch (error: any) {
      toast({
        title: "스케줄 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleNotificationType = (type: string) => {
    const types = [...notificationSettings.notificationTypes];
    const index = types.indexOf(type);
    if (index > -1) {
      types.splice(index, 1);
    } else {
      types.push(type);
    }
    setNotificationSettings({ ...notificationSettings, notificationTypes: types });
  };

  const getPlanBadge = (planType: string) => {
    const badges = {
      free: <Badge variant="secondary">무료</Badge>,
      starter: <Badge variant="default">스타터</Badge>,
      professional: <Badge variant="default" className="bg-primary">프로페셔널</Badge>,
      enterprise: <Badge variant="default" className="bg-gradient-to-r from-primary to-secondary">엔터프라이즈</Badge>,
    };
    return badges[planType as keyof typeof badges] || badges.free;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold">설정</h1>
          <p className="mt-2 text-muted-foreground">시스템 설정 및 환경 구성</p>
        </div>

        <Tabs defaultValue="organization" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organization">
              <Building2 className="w-4 h-4 mr-2" />
              조직 설정
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              알림/리포트
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              사용자/역할
            </TabsTrigger>
            <TabsTrigger value="license">
              <CreditCard className="w-4 h-4 mr-2" />
              플랜/라이선스
            </TabsTrigger>
          </TabsList>

          {/* 1. Organization Settings */}
          <TabsContent value="organization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>조직/브랜드 기본 설정</CardTitle>
                <CardDescription>타임존, 통화, 기본 KPI 세트, 로고/브랜딩을 설정합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">타임존</Label>
                    <Select
                      value={orgSettings.timezone}
                      onValueChange={(value) => setOrgSettings({ ...orgSettings, timezone: value })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">통화</Label>
                    <Select
                      value={orgSettings.currency}
                      onValueChange={(value) => setOrgSettings({ ...orgSettings, currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KRW">KRW (₩)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">로고 URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={orgSettings.logoUrl}
                    onChange={(e) => setOrgSettings({ ...orgSettings, logoUrl: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brandColor">브랜드 컬러</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandColor"
                      type="color"
                      value={orgSettings.brandColor}
                      onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={orgSettings.brandColor}
                      onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })}
                      placeholder="#1B6BFF"
                    />
                  </div>
                </div>

                <Separator />
                <Button onClick={saveOrgSettings} disabled={loading}>
                  {loading ? '저장 중...' : '변경사항 저장'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Notifications & Reports */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>이메일/슬랙 알림 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">이메일로 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>슬랙 알림</Label>
                    <p className="text-sm text-muted-foreground">슬랙으로 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.slackEnabled}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, slackEnabled: checked })}
                  />
                </div>

                {notificationSettings.slackEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="slackWebhook">슬랙 Webhook URL</Label>
                    <Input
                      id="slackWebhook"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={notificationSettings.slackWebhookUrl}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, slackWebhookUrl: e.target.value })}
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>알림 유형</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="stockout">재고 부족</Label>
                      <Switch
                        id="stockout"
                        checked={notificationSettings.notificationTypes.includes('stockout')}
                        onCheckedChange={() => toggleNotificationType('stockout')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="anomaly">이상 탐지</Label>
                      <Switch
                        id="anomaly"
                        checked={notificationSettings.notificationTypes.includes('anomaly')}
                        onCheckedChange={() => toggleNotificationType('anomaly')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="milestone">목표 달성</Label>
                      <Switch
                        id="milestone"
                        checked={notificationSettings.notificationTypes.includes('milestone')}
                        onCheckedChange={() => toggleNotificationType('milestone')}
                      />
                    </div>
                  </div>
                </div>

                <Separator />
                <Button onClick={saveNotificationSettings} disabled={loading}>
                  {loading ? '저장 중...' : '알림 설정 저장'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>리포트 스케줄</CardTitle>
                <CardDescription>주간/월간 리포트 발송 설정</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">리포트 이름</Label>
                    <Input
                      id="reportName"
                      placeholder="주간 판매 리포트"
                      value={newSchedule.reportName}
                      onChange={(e) => setNewSchedule({ ...newSchedule, reportName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">주기</Label>
                    <Select
                      value={newSchedule.frequency}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">매일</SelectItem>
                        <SelectItem value="weekly">매주</SelectItem>
                        <SelectItem value="monthly">매월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeOfDay">발송 시간</Label>
                    <Input
                      id="timeOfDay"
                      type="time"
                      value={newSchedule.timeOfDay}
                      onChange={(e) => setNewSchedule({ ...newSchedule, timeOfDay: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportType">리포트 유형</Label>
                    <Select
                      value={newSchedule.reportType}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, reportType: value })}
                    >
                      <SelectTrigger id="reportType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">판매 리포트</SelectItem>
                        <SelectItem value="inventory">재고 리포트</SelectItem>
                        <SelectItem value="customer">고객 리포트</SelectItem>
                        <SelectItem value="comprehensive">종합 리포트</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={addReportSchedule} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  스케줄 추가
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label>등록된 스케줄</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>리포트 이름</TableHead>
                        <TableHead>주기</TableHead>
                        <TableHead>시간</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportSchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.report_name}</TableCell>
                          <TableCell>
                            {schedule.frequency === 'daily' && '매일'}
                            {schedule.frequency === 'weekly' && '매주'}
                            {schedule.frequency === 'monthly' && '매월'}
                          </TableCell>
                          <TableCell>{schedule.time_of_day}</TableCell>
                          <TableCell>{schedule.report_type}</TableCell>
                          <TableCell>
                            <Badge variant={schedule.is_enabled ? "default" : "secondary"}>
                              {schedule.is_enabled ? '활성' : '비활성'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReportSchedule(schedule.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Users & Roles */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>사용자/역할/권한 관리</CardTitle>
                <CardDescription>계정 생성/초대, 역할(Role) 템플릿, RBAC 정책</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>내 역할</Label>
                  <div className="flex gap-2">
                    {userRoles.map((role) => (
                      <Badge key={role.id} variant="default">
                        {role.role === 'admin' && '관리자'}
                        {role.role === 'manager' && '매니저'}
                        {role.role === 'analyst' && '분석가'}
                        {role.role === 'viewer' && '뷰어'}
                      </Badge>
                    ))}
                    {userRoles.length === 0 && (
                      <Badge variant="secondary">역할 없음</Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>역할 설명</Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><strong>관리자 (Admin):</strong> 모든 권한 보유, 사용자 관리 및 시스템 설정 가능</div>
                    <div><strong>매니저 (Manager):</strong> 데이터 관리 및 리포트 생성 가능</div>
                    <div><strong>분석가 (Analyst):</strong> 데이터 분석 및 조회 가능</div>
                    <div><strong>뷰어 (Viewer):</strong> 읽기 전용 권한</div>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    역할 관리는 관리자(Admin) 권한이 필요합니다. 새로운 사용자를 초대하거나 역할을 변경하려면 관리자에게 문의하세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. License Management */}
          <TabsContent value="license" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>플랜/라이선스 관리</CardTitle>
                <CardDescription>Store/HQ 라이선스 수, 청구 정보, 사용량 모니터링</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {licenseInfo ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>현재 플랜</Label>
                        <div className="mt-2">
                          {getPlanBadge(licenseInfo.plan_type)}
                        </div>
                      </div>
                      <Button variant="outline">플랜 업그레이드</Button>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>매장 수</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={(licenseInfo.current_stores / licenseInfo.max_stores) * 100} />
                          <span className="text-sm text-muted-foreground">
                            {licenseInfo.current_stores} / {licenseInfo.max_stores}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>본사 사용자 수</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={(licenseInfo.current_hq_users / licenseInfo.max_hq_users) * 100} />
                          <span className="text-sm text-muted-foreground">
                            {licenseInfo.current_hq_users} / {licenseInfo.max_hq_users}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>스토리지 사용량</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={(parseFloat(licenseInfo.usage_storage_gb) / licenseInfo.storage_limit_gb) * 100} />
                          <span className="text-sm text-muted-foreground">
                            {licenseInfo.usage_storage_gb} GB / {licenseInfo.storage_limit_gb} GB
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>API 호출 수</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={(licenseInfo.usage_api_calls / licenseInfo.api_calls_limit) * 100} />
                          <span className="text-sm text-muted-foreground">
                            {licenseInfo.usage_api_calls.toLocaleString()} / {licenseInfo.api_calls_limit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>청구 주기</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(licenseInfo.billing_cycle_start).toLocaleDateString('ko-KR')} ~ {new Date(licenseInfo.billing_cycle_end).toLocaleDateString('ko-KR')}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>라이선스 상태</Label>
                      <Badge variant={licenseInfo.is_active ? "default" : "destructive"}>
                        {licenseInfo.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">라이선스 정보를 불러오는 중...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
