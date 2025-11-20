-- 1. 역할(Role) Enum 생성
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');

-- 2. 조직 설정 테이블
CREATE TABLE public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  currency TEXT NOT NULL DEFAULT 'KRW',
  default_kpi_set JSONB DEFAULT '["totalVisits", "totalRevenue", "conversionRate"]'::jsonb,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#1B6BFF',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. 사용자 역할 테이블 (RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. 알림 설정 테이블
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  notification_types JSONB DEFAULT '["stockout", "anomaly", "milestone"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. 리포트 스케줄 테이블
CREATE TABLE public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time_of_day TIME NOT NULL DEFAULT '09:00:00',
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  report_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. 라이선스 관리 테이블
CREATE TABLE public.license_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_hq_users INTEGER NOT NULL DEFAULT 1,
  storage_limit_gb INTEGER NOT NULL DEFAULT 5,
  api_calls_limit INTEGER NOT NULL DEFAULT 10000,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_hq_users INTEGER NOT NULL DEFAULT 1,
  usage_storage_gb NUMERIC(10, 2) DEFAULT 0,
  usage_api_calls INTEGER DEFAULT 0,
  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_cycle_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS 활성화
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_management ENABLE ROW LEVEL SECURITY;

-- Security Definer 함수: 역할 확인
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security Definer 함수: 관리자 확인
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS 정책: organization_settings
CREATE POLICY "Users can view their own organization settings"
  ON public.organization_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization settings"
  ON public.organization_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization settings"
  ON public.organization_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS 정책: notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 정책: report_schedules
CREATE POLICY "Users can view their own report schedules"
  ON public.report_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own report schedules"
  ON public.report_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own report schedules"
  ON public.report_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own report schedules"
  ON public.report_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 정책: license_management
CREATE POLICY "Users can view their own license"
  ON public.license_management FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all licenses"
  ON public.license_management FOR ALL
  USING (public.is_admin(auth.uid()));

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_license_management_updated_at
  BEFORE UPDATE ON public.license_management
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();