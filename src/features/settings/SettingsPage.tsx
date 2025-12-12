/**
 * SettingsPage.tsx
 *
 * 통합 설정 페이지 - 5개 탭 구조
 * 1. 매장 관리
 * 2. 데이터 관리
 * 3. 사용자 관리
 * 4. 시스템 설정
 * 5. 플랜 & 라이선스
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Store,
  Database,
  Users,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  Mail,
  Bell,
  Building2,
  Upload,
  RefreshCw,
  Link,
  Eye,
  Edit,
  MapPin,
  Network,
  Boxes,
} from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { useSelectedStore } from '@/hooks/useSelectedStore';

// 온톨로지 컴포넌트
import { OntologyGraph3D } from '@/features/data-management/ontology/components/OntologyGraph3D';
import { MasterSchemaSync } from '@/features/data-management/ontology/components/MasterSchemaSync';

export default function SettingsPage() {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { user, orgId, orgName, role, licenseType, licenseStatus, isOrgHQ, isOrgStore } = useAuth();
  const { stores, loading: storesLoading, refreshStores } = useSelectedStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stores');

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', {
      page: location.pathname,
      page_name: 'Settings',
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname]);

  // Organization Info
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);

  // Organization Settings
  const [orgSettings, setOrgSettings] = useState({
    timezone: 'Asia/Seoul',
    currency: 'KRW',
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

  // License & Subscription Info
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);

  // Organization Members
  const [orgMembers, setOrgMembers] = useState<any[]>([]);

  // Invite Dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // Store Dialog
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    store_name: '',
    store_code: '',
    address: '',
    manager_name: '',
    manager_email: '',
  });

  // Data Import Status
  const [importStatus, setImportStatus] = useState({
    lastSync: null,
    pendingRows: 0,
    totalEntities: 0,
    totalRelations: 0,
  });

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
        .select(`*, licenses (license_type, status, monthly_price, effective_date, expiry_date)`)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (membersData) {
        setOrgMembers(membersData);
      }

      // Fetch data import status
      const { count: entityCount } = await supabase
        .from('graph_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: relationCount } = await supabase
        .from('graph_relations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setImportStatus({
        lastSync: null,
        pendingRows: 0,
        totalEntities: entityCount || 0,
        totalRelations: relationCount || 0,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveOrgSettings = async () => {
    setLoading(true);
    try {
      if (!orgId) throw new Error('Organization not found');

      const { error } = await supabase.from('organization_settings').upsert({
        org_id: orgId,
        timezone: orgSettings.timezone,
        currency: orgSettings.currency,
        logo_url: orgSettings.logoUrl,
        brand_color: orgSettings.brandColor,
      });

      if (error) throw error;

      toast({ title: '조직 설정 저장 완료', description: '조직 설정이 저장되었습니다.' });
      logActivity('feature_use', { feature: 'settings_change', setting_type: 'organization' });
    } catch (error: any) {
      toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('User not found');

      const { error } = await supabase.from('notification_settings').upsert({
        user_id: user.id,
        email_enabled: notificationSettings.emailEnabled,
        slack_enabled: notificationSettings.slackEnabled,
        slack_webhook_url: notificationSettings.slackWebhookUrl,
        notification_types: notificationSettings.notificationTypes,
      });

      if (error) throw error;

      toast({ title: '알림 설정 저장 완료', description: '알림 설정이 저장되었습니다.' });
      logActivity('feature_use', { feature: 'settings_change', setting_type: 'notifications' });
    } catch (error: any) {
      toast({ title: '저장 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createStore = async () => {
    setLoading(true);
    try {
      if (!orgId || !user) throw new Error('Organization not found');

      const { error } = await supabase.from('stores').insert({
        store_name: newStore.store_name,
        store_code: newStore.store_code,
        address: newStore.address,
        manager_name: newStore.manager_name,
        manager_email: newStore.manager_email,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: '매장 생성 완료', description: `${newStore.store_name} 매장이 생성되었습니다.` });
      setStoreDialogOpen(false);
      setNewStore({ store_name: '', store_code: '', address: '', manager_name: '', manager_email: '' });
      refreshStores();
    } catch (error: any) {
      toast({ title: '매장 생성 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendViewerInvitation = async () => {
    if (!inviteEmail || !orgId || !user) return;

    setLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase.from('invitations').insert({
        org_id: orgId,
        email: inviteEmail,
        role: 'ORG_VIEWER',
        invited_by: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      toast({ title: '초대 전송 완료', description: `${inviteEmail}에게 초대가 전송되었습니다.` });
      logActivity('feature_use', { feature: 'viewer_invitation_send', invitee_email: inviteEmail });
      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (error: any) {
      toast({ title: '초대 전송 실패', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
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

  const getRoleBadge = (roleType: string) => {
    const badges: Record<string, JSX.Element> = {
      NEURALTWIN_MASTER: <Badge className="bg-gradient-to-r from-primary to-accent">마스터</Badge>,
      ORG_HQ: <Badge className="bg-primary">본사</Badge>,
      ORG_STORE: <Badge>매장</Badge>,
      ORG_VIEWER: <Badge variant="secondary">뷰어</Badge>,
    };
    return badges[roleType] || <Badge variant="secondary">{roleType}</Badge>;
  };

  const getLicenseTypeBadge = (type: string) => {
    const badges: Record<string, JSX.Element> = {
      HQ_SEAT: <Badge className="bg-primary">HQ</Badge>,
      STORE: <Badge className="bg-accent">Store</Badge>,
    };
    return badges[type] || <Badge variant="secondary">{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      active: <Badge className="bg-green-600">활성</Badge>,
      assigned: <Badge className="bg-blue-600">할당됨</Badge>,
      suspended: <Badge variant="destructive">정지</Badge>,
      expired: <Badge variant="secondary">만료</Badge>,
    };
    return badges[status] || <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            설정 & 관리
          </h1>
          <p className="text-muted-foreground mt-1">시스템 설정, 매장 관리, 사용자 권한</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="stores" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">매장 관리</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">데이터</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">사용자</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">시스템</span>
            </TabsTrigger>
            <TabsTrigger value="license" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">플랜</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. 매장 관리 탭 */}
          <TabsContent value="stores" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>매장 목록</CardTitle>
                  <CardDescription>조직에 속한 모든 매장</CardDescription>
                </div>
                <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      매장 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 매장 추가</DialogTitle>
                      <DialogDescription>새로운 매장 정보를 입력하세요</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>매장명</Label>
                          <Input
                            value={newStore.store_name}
                            onChange={(e) => setNewStore({ ...newStore, store_name: e.target.value })}
                            placeholder="강남점"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>매장 코드</Label>
                          <Input
                            value={newStore.store_code}
                            onChange={(e) => setNewStore({ ...newStore, store_code: e.target.value })}
                            placeholder="GN001"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>주소</Label>
                        <Input
                          value={newStore.address}
                          onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                          placeholder="서울시 강남구..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>매니저 이름</Label>
                          <Input
                            value={newStore.manager_name}
                            onChange={(e) => setNewStore({ ...newStore, manager_name: e.target.value })}
                            placeholder="홍길동"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>매니저 이메일</Label>
                          <Input
                            value={newStore.manager_email}
                            onChange={(e) => setNewStore({ ...newStore, manager_email: e.target.value })}
                            placeholder="manager@example.com"
                          />
                        </div>
                      </div>
                      <Button onClick={createStore} disabled={loading} className="w-full">
                        {loading ? '생성 중...' : '매장 생성'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {storesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : stores && stores.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>매장명</TableHead>
                        <TableHead>코드</TableHead>
                        <TableHead>주소</TableHead>
                        <TableHead>매니저</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">{store.store_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{store.store_code}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {store.address || '-'}
                          </TableCell>
                          <TableCell className="text-sm">{store.manager_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={(store as any).status === 'active' ? 'default' : 'secondary'}>
                              {(store as any).status === 'active' ? '운영중' : '비활성'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">등록된 매장이 없습니다</p>
                    <p className="text-sm text-muted-foreground mt-1">매장을 추가하여 시작하세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. 데이터 관리 탭 */}
          <TabsContent value="data" className="space-y-4">
            {/* 데이터 현황 카드 */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    그래프 엔티티
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{importStatus.totalEntities}</div>
                  <p className="text-xs text-muted-foreground">데이터베이스 저장 엔티티</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    그래프 관계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{importStatus.totalRelations}</div>
                  <p className="text-xs text-muted-foreground">엔티티 간 연결</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    데이터 가져오기
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">CSV, XLSX 지원</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">파일 선택</Button>
                </CardContent>
              </Card>
            </div>

            {/* 마스터 스키마 동기화 */}
            <MasterSchemaSync />

            {/* 온톨로지 3D 시각화 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-primary" />
                      온톨로지 스키마 뷰어
                    </CardTitle>
                    <CardDescription>
                      리테일 비즈니스 도메인의 엔티티와 관계를 3D 그래프로 시각화
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">리테일 전문</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[70vh] min-h-[600px] bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
                  <OntologyGraph3D />
                </div>
              </CardContent>
            </Card>

            {/* API 연동 */}
            <Card>
              <CardHeader>
                <CardTitle>API 연동</CardTitle>
                <CardDescription>외부 시스템과의 데이터 연동</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Link className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">POS 시스템</p>
                        <p className="text-sm text-muted-foreground">실시간 판매 데이터 연동</p>
                      </div>
                    </div>
                    <Badge variant="secondary">미연결</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <Link className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">ERP 시스템</p>
                        <p className="text-sm text-muted-foreground">재고 및 주문 데이터</p>
                      </div>
                    </div>
                    <Badge variant="secondary">미연결</Badge>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    새 연동 추가
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. 사용자 관리 탭 */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>조직 멤버</CardTitle>
                  <CardDescription>사용자 및 역할 관리</CardDescription>
                </div>
                {(isOrgHQ() || isOrgStore()) && (
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        사용자 초대
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Viewer 초대</DialogTitle>
                        <DialogDescription>읽기 전용 권한을 가진 사용자를 초대합니다</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>이메일</Label>
                          <Input
                            type="email"
                            placeholder="viewer@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <Button onClick={sendViewerInvitation} disabled={loading || !inviteEmail} className="w-full">
                          {loading ? '전송 중...' : '초대 전송'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
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
                        <TableCell className="font-mono text-xs">{member.user_id.substring(0, 8)}...</TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>
                          {member.licenses ? getLicenseTypeBadge(member.licenses.license_type) : <Badge variant="secondary">없음</Badge>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>역할 설명</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {getRoleBadge('ORG_HQ')}
                    <span>조직 관리, 모든 매장 접근 (HQ 라이선스 필요)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge('ORG_STORE')}
                    <span>매장 관리 및 데이터 분석 (Store 라이선스 필요)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge('ORG_VIEWER')}
                    <span>읽기 전용 권한 (무료)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. 시스템 설정 탭 */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>조직 정보</CardTitle>
                <CardDescription>기본 조직 정보</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>조직 이름</Label>
                    <p className="font-medium">{orgName || '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>내 역할</Label>
                    {getRoleBadge(role || '')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>조직 설정</CardTitle>
                <CardDescription>타임존, 통화, 브랜딩</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>타임존</Label>
                    <Select
                      value={orgSettings.timezone}
                      onValueChange={(v) => setOrgSettings({ ...orgSettings, timezone: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>통화</Label>
                    <Select
                      value={orgSettings.currency}
                      onValueChange={(v) => setOrgSettings({ ...orgSettings, currency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KRW">KRW (₩)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>브랜드 컬러</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={orgSettings.brandColor}
                      onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={orgSettings.brandColor}
                      onChange={(e) => setOrgSettings({ ...orgSettings, brandColor: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={saveOrgSettings} disabled={loading}>
                  {loading ? '저장 중...' : '변경사항 저장'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>이메일/슬랙 알림</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">이메일로 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailEnabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>슬랙 알림</Label>
                    <p className="text-sm text-muted-foreground">슬랙으로 알림을 받습니다</p>
                  </div>
                  <Switch
                    checked={notificationSettings.slackEnabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, slackEnabled: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>알림 유형</Label>
                  <div className="space-y-2">
                    {['stockout', 'anomaly', 'milestone'].map((type) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label className="font-normal">
                          {type === 'stockout' && '재고 부족'}
                          {type === 'anomaly' && '이상 탐지'}
                          {type === 'milestone' && '목표 달성'}
                        </Label>
                        <Switch
                          checked={notificationSettings.notificationTypes.includes(type)}
                          onCheckedChange={() => toggleNotificationType(type)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={saveNotificationSettings} disabled={loading}>
                  {loading ? '저장 중...' : '알림 설정 저장'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. 플랜 & 라이선스 탭 */}
          <TabsContent value="license" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>구독 정보</CardTitle>
                <CardDescription>현재 플랜 및 라이선스</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionInfo ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold">{subscriptionInfo.hq_license_count || 0}</div>
                        <p className="text-sm text-muted-foreground">HQ 라이선스</p>
                        <p className="text-xs text-muted-foreground">$500/월</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold">{subscriptionInfo.store_license_count || 0}</div>
                        <p className="text-sm text-muted-foreground">Store 라이선스</p>
                        <p className="text-xs text-muted-foreground">$250/월</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-3xl font-bold">{subscriptionInfo.viewer_count || 0}</div>
                        <p className="text-sm text-muted-foreground">Viewer</p>
                        <p className="text-xs text-muted-foreground">무료</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <Label>월 비용</Label>
                      <span className="text-2xl font-bold text-primary">
                        ${subscriptionInfo.monthly_cost?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>구독 상태</Label>
                      {getStatusBadge(subscriptionInfo.status || 'active')}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">구독 정보 없음</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>라이선스 목록</CardTitle>
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
                        <TableCell className="font-mono text-xs">{license.license_key || 'N/A'}</TableCell>
                        <TableCell>{getLicenseTypeBadge(license.license_type)}</TableCell>
                        <TableCell>{getStatusBadge(license.status)}</TableCell>
                        <TableCell>${license.monthly_price || 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('ko-KR') : '무제한'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {licenses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">발급된 라이선스가 없습니다</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
