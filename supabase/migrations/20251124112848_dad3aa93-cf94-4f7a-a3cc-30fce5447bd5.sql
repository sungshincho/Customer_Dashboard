-- NEURALTWIN_ADMIN 역할을 가진 사용자는 특정 organization에 속하지 않으므로 org_id를 nullable로 변경
ALTER TABLE public.organization_members 
ALTER COLUMN org_id DROP NOT NULL;

-- 기존 제약조건 확인 및 조정
COMMENT ON COLUMN public.organization_members.org_id IS 'Organization ID (nullable for NEURALTWIN_ADMIN role)';