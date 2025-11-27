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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Bell, Users, CreditCard, Plus, Trash2, Mail } from "lucide-react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

const Settings = () => {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { user, orgId, orgName, role, licenseType, licenseStatus, isOrgHQ, isOrgStore } = useAuth();
  const [loading, setLoading] = useState(false);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Settings',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);
  
  // Organization Info
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);
  
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

  // License & Subscription Info
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);

  // Organization Members
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  
  // Invite Dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      if (!user || !orgId) return;

      // Fetch organization info
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (orgData) {
        setOrganizationInfo(orgData);
      }

      // Fetch organization settings
      const { data: orgSettingsData } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();

      if (orgSettingsData) {
        setOrgSettings({
          timezone: orgSettingsData.timezone || 'Asia/Seoul',
          currency: orgSettingsData.currency || 'KRW',
          defaultKpiSet: Array.isArray(orgSettingsData.default_kpi_set) 
            ? orgSettingsData.default_kpi_set 
            : ['totalVisits', 'totalRevenue', 'conversionRate'],
          logoUrl: orgSettingsData.logo_url || '',
          brandColor: orgSettingsData.brand_color || '#1B6BFF',
        });
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

      // Fetch subscription info
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', orgId)
        .single();

      if (subscriptionData) {
        setSubscriptionInfo(subscriptionData);
      }

      // Fetch all licenses for the organization
      const { data: licensesData } = await supabase
        .from('licenses')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (licensesData) {
        setLicenses(licensesData);
      }

      // Fetch organization members
      const { data: membersData } = await supabase
        .from('organization_members')
        .select(`
          *,
          licenses (
            license_type,
            status,
            monthly_price,
            effective_date,
            expiry_date
          )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (membersData) {
        setOrgMembers(membersData);
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

  const sendViewerInvitation = async () => {
    if (!inviteEmail || !orgId || !user) return;

    setLoading(true);
    try {
      // Generate invitation token
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('invitations')
        .insert({
          org_id: orgId,
          email: inviteEmail,
          role: 'ORG_VIEWER',
          invited_by: user.id,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "초대 전송 완료",
        description: `${inviteEmail}에게 Viewer 초대가 전송되었습니다.`,
      });

      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "초대 전송 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roleType: string) => {
    const badges = {
      'NEURALTWIN_MASTER': <Badge className="bg-gradient-to-r from-primary to-accent">마스터</Badge>,
      'ORG_HQ': <Badge variant="default" className="bg-primary">본사</Badge>,
      'ORG_STORE': <Badge variant="default">매장</Badge>,
      'ORG_VIEWER': <Badge variant="secondary">뷰어</Badge>,
    };
    return badges[roleType as keyof typeof badges] || <Badge variant="secondary">{roleType}</Badge>;
  };

  const getLicenseTypeBadge = (licenseType: string) => {
    const badges = {
      'HQ_SEAT': <Badge className="bg-primary">HQ 라이선스</Badge>,
      'STORE': <Badge className="bg-accent">Store 라이선스</Badge>,
    };
    return badges[licenseType as keyof typeof badges] || <Badge variant="secondary">{licenseType}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': <Badge variant="default" className="bg-green-600">활성</Badge>,
      'assigned': <Badge variant="default" className="bg-blue-600">할당됨</Badge>,
      'suspended': <Badge variant="destructive">정지</Badge>,
      'expired': <Badge variant="secondary">만료</Badge>,
      'revoked': <Badge variant="destructive">취소</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge variant="secondary">{status}</Badge>;
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
                <CardTitle>조직 정보</CardTitle>
                <CardDescription>현재 조직의 기본 정보</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>조직 이름</Label>
                    <p className="text-sm font-medium">{orgName || '조직 없음'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>내 역할</Label>
                    <div>{getRoleBadge(role || '')}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>라이선스 타입</Label>
                    <div>{licenseType ? getLicenseTypeBadge(licenseType) : <Badge variant="secondary">없음</Badge>}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>라이선스 상태</Label>
                    <div>{licenseStatus ? getStatusBadge(licenseStatus) : <Badge variant="secondary">없음</Badge>}</div>
                  </div>
                  {organizationInfo && (
                    <>
                      <div className="space-y-2">
                        <Label>멤버 수</Label>
                        <p className="text-sm font-medium">{organizationInfo.member_count || 0}명</p>
                      </div>
                      <div className="space-y-2">
                        <Label>생성일</Label>
                        <p className="text-sm font-medium">
                          {new Date(organizationInfo.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>조직 멤버</CardTitle>
                    <CardDescription>조직에 속한 사용자 및 역할 관리</CardDescription>
                  </div>
                  {(isOrgHQ() || isOrgStore()) && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Mail className="w-4 h-4 mr-2" />
                          Viewer 초대
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Viewer 초대</DialogTitle>
                          <DialogDescription>
                            읽기 전용 권한을 가진 Viewer를 초대합니다
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">이메일</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="viewer@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <Button 
                            onClick={sendViewerInvitation} 
                            disabled={loading || !inviteEmail}
                            className="w-full"
                          >
                            {loading ? '전송 중...' : '초대 전송'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사용자 ID</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>라이선스</TableHead>
                      <TableHead>가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-mono text-xs">
                          {member.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(member.role)}
                        </TableCell>
                        <TableCell>
                          {member.licenses ? (
                            <div className="space-y-1">
                              {getLicenseTypeBadge(member.licenses.license_type)}
                              <div className="text-xs text-muted-foreground">
                                {member.licenses.license_key}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="secondary">없음</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator />

                <div className="space-y-2">
                  <Label>역할 설명</Label>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><strong>마스터 (NEURALTWIN_MASTER):</strong> 시스템 전체 관리 권한</div>
                    <div><strong>본사 (ORG_HQ):</strong> 조직 관리, 모든 매장 데이터 접근, HQ 라이선스 필요 ($500/월)</div>
                    <div><strong>매장 (ORG_STORE):</strong> 매장 관리 및 데이터 분석, Store 라이선스 필요 ($250/월)</div>
                    <div><strong>뷰어 (ORG_VIEWER):</strong> 읽기 전용 권한, 무료 (초대 필요)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. License Management */}
          <TabsContent value="license" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>구독 정보</CardTitle>
                <CardDescription>조직의 구독 및 라이선스 현황</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionInfo ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>HQ 라이선스</Label>
                        <div className="text-2xl font-bold">{subscriptionInfo.hq_license_count || 0}개</div>
                        <p className="text-xs text-muted-foreground">$500/월 × {subscriptionInfo.hq_license_count || 0}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Store 라이선스</Label>
                        <div className="text-2xl font-bold">{subscriptionInfo.store_license_count || 0}개</div>
                        <p className="text-xs text-muted-foreground">$250/월 × {subscriptionInfo.store_license_count || 0}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Viewer</Label>
                        <div className="text-2xl font-bold">{subscriptionInfo.viewer_count || 0}명</div>
                        <p className="text-xs text-muted-foreground">무료</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>월 비용</Label>
                        <div className="text-2xl font-bold text-primary">
                          ${subscriptionInfo.monthly_cost?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>구독 상태</Label>
                        {getStatusBadge(subscriptionInfo.status || 'active')}
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>다음 결제일</Label>
                        <p className="text-sm text-muted-foreground">
                          {subscriptionInfo.next_billing_date 
                            ? new Date(subscriptionInfo.next_billing_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">구독 정보 없음</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>라이선스 목록</CardTitle>
                <CardDescription>조직에서 발급된 모든 라이선스</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>라이선스 키</TableHead>
                      <TableHead>타입</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>월 비용</TableHead>
                      <TableHead>유효기간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-mono text-xs">
                          {license.license_key || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getLicenseTypeBadge(license.license_type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(license.status)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${license.monthly_price || 0}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {license.expiry_date 
                            ? new Date(license.expiry_date).toLocaleDateString('ko-KR')
                            : '무제한'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {licenses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    발급된 라이선스가 없습니다
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
