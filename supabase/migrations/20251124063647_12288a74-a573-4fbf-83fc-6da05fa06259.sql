-- Phase 1-A: app_role enum 확장 (트랜잭션 분리)
DO $$ 
BEGIN
  -- app_role enum이 없으면 생성
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');
  END IF;
  
  -- 새로운 role 값들 추가 (이미 있으면 무시)
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ORG_OWNER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'ORG_OWNER';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ORG_ADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'ORG_ADMIN';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ORG_MEMBER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'ORG_MEMBER';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NEURALTWIN_ADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'NEURALTWIN_ADMIN';
  END IF;
END $$;