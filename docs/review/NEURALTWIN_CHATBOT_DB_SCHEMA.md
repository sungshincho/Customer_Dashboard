# NEURALTWIN 챗봇 통합 DB 스키마

> **버전**: v1.1 (표현 명확화)
> **작성일**: 2026-02-05
> **상태**: Phase 1에서 생성 예정 (아직 프로젝트에 존재하지 않음)
> **적용 시점**: Phase 1 마이그레이션 실행 시

---

## 1. 이 문서의 목적

**OS 챗봇 Phase 1 개발 시 신규 생성할 DB 스키마**를 정의한 문서이다.

### 중요 안내

```
⚠️ 이 문서에 정의된 테이블들은 아직 프로젝트 DB에 존재하지 않습니다.
⚠️ Phase 1 개발 세션에서 마이그레이션을 실행하면 생성됩니다.
⚠️ "사용 예정", "활용 예정" 등의 표현은 구현 계획을 의미합니다.
```

### 테이블 생성 및 활용 계획

| 테이블 | Phase 1에서 | OS 챗봇 초기 버전 | 웹사이트 챗봇 (추후) |
|:---|:---|:---|:---|
| `chat_conversations` | 🆕 **생성** | ✅ 활용 예정 (`channel = 'os_app'`) | 🔜 `channel = 'website'`로 활용 예정 |
| `chat_messages` | 🆕 **생성** | ✅ 활용 예정 | 🔜 활용 예정 |
| `chat_leads` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | 🔜 **웹사이트 전용** — 리드 캡처 |
| `chat_daily_analytics` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | 🔜 양쪽 모두 활용 예정 |
| `assistant_command_cache` | 🆕 **생성** | ⬜ 구조만 생성 (초기 버전 미사용) | ❌ **OS 전용** |

---

## 2. 스키마 전체 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│             NEURALTWIN 챗봇 통합 스키마 (Phase 1에서 생성)           │
│                                                                     │
│  ┌─────────────────────┐     ┌──────────────────────┐              │
│  │ chat_conversations  │────→│   chat_messages       │              │
│  │ (대화방)             │ 1:N │   (개별 메시지)        │              │
│  │                     │     │                      │              │
│  │ channel: 'website'  │     │ channel_data: JSONB  │              │
│  │        | 'os_app'   │     │ (채널별 확장 데이터)   │              │
│  └─────────┬───────────┘     └──────────────────────┘              │
│            │                                                        │
│            │ 1:N                                                    │
│            ▼                                                        │
│  ┌─────────────────────┐                                            │
│  │ chat_leads          │  ← 웹사이트 전용 (추후 활용)               │
│  │ (이메일, 회사, 고민)  │                                           │
│  └─────────────────────┘                                            │
│                                                                     │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐     │
│  │ chat_daily_analytics    │  │ assistant_command_cache       │     │
│  │ (일별 집계, 추후 활용)   │  │ (OS 전용, 추후 활용)          │     │
│  └─────────────────────────┘  └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. ENUM 타입

```sql
-- 채널 구분 ENUM (Phase 1에서 생성)
-- 웹사이트 챗봇은 'website', OS 챗봇은 'os_app' 사용
CREATE TYPE chat_channel AS ENUM ('website', 'os_app');
```

---

## 4. 테이블 상세

### 4.1 chat_conversations (대화 세션)

대화방 1개 = 레코드 1개. 사용자가 챗봇을 열고 대화를 시작하면 생성된다.

**Phase 1에서 생성, OS 챗봇 초기 버전에서 활용**

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,

  -- 식별: 웹사이트는 session_id, OS는 user_id
  user_id UUID REFERENCES auth.users(id),          -- OS 전용 (nullable)
  session_id TEXT,                                   -- 웹사이트 전용 (nullable)
  store_id UUID REFERENCES stores(id),              -- OS 전용 (nullable)

  -- 공통 필드
  title TEXT,                                        -- 대화 제목 (자동 생성 가능)
  message_count INTEGER DEFAULT 0,                   -- 총 메시지 수
  total_tokens_used INTEGER DEFAULT 0,               -- 총 토큰 사용량
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),

  -- 채널별 메타데이터 (JSONB — 채널마다 다른 데이터를 유연하게 저장)
  channel_metadata JSONB DEFAULT '{}',
  -- [website 활용 시]: { utm_source, referrer, user_agent, lead_captured, lead_email, lead_company }
  -- [os_app 활용 시]:  { initial_context, panel_position, detail_level }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,

  -- 제약 조건: 채널별 필수 식별자 확인
  -- 웹사이트는 session_id 필수, OS는 user_id 필수
  CONSTRAINT valid_identifier CHECK (
    (channel = 'website' AND session_id IS NOT NULL) OR
    (channel = 'os_app' AND user_id IS NOT NULL)
  )
);
```

**채널별 활용 방식 차이:**

| 필드 | 웹사이트 챗봇 | OS 챗봇 |
|:---|:---|:---|
| `user_id` | NULL (비인증 방문자) | ✅ 인증된 사용자 ID |
| `session_id` | ✅ 브라우저 세션 ID | NULL |
| `store_id` | NULL | ✅ 선택된 매장 ID |
| `channel_metadata` | UTM, referrer, user_agent 등 | 초기 컨텍스트(현재 페이지, 패널 위치 등) |

---

### 4.2 chat_messages (메시지)

대화방 내 개별 메시지. 사용자/어시스턴트/시스템 메시지 모두 저장.

**Phase 1에서 생성, OS 챗봇 초기 버전에서 활용**

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- 공통 AI 메타데이터
  model_used TEXT,               -- 'claude-sonnet-4' 또는 'gemini-2.5-flash'
  tokens_used INTEGER,
  execution_time_ms INTEGER,

  -- 채널별 확장 데이터 (JSONB — 채널마다 다른 구조)
  channel_data JSONB DEFAULT '{}',
  -- [website 활용 시]: {
  --   topic_category,          -- 12개 리테일 토픽 카테고리
  --   sub_category,
  --   sentiment,               -- 'positive' | 'neutral' | 'negative'
  --   pain_point_summary,      -- 추출된 Pain Point
  --   contains_pain_point,     -- boolean
  --   solution_mentioned,      -- boolean (뉴럴트윈 솔루션 언급 여부)
  --   user_engagement          -- 'high' | 'medium' | 'low'
  -- }
  -- [os_app 활용 시]: {
  --   intent,                  -- 분류된 인텐트
  --   confidence,              -- 분류 신뢰도
  --   sub_intent,
  --   actions,                 -- 실행된 UIAction 배열
  --   data,                    -- 조회/실행 결과 데이터
  --   suggestions              -- 후속 제안 목록
  -- }

  -- 공통 피드백
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative')),
  feedback_comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**핵심 설계 원칙 — `channel_data` JSONB:**

두 채널의 메시지가 같은 테이블에 저장되지만, **확장 데이터의 구조는 채널마다 완전히 다르다.** JSONB 컬럼으로 이를 유연하게 처리한다.

- **웹사이트**: 토픽 분류, 감정 분석, Pain Point 추출 등 **세일즈 관련** 메타데이터
- **OS**: 인텐트, 신뢰도, 실행된 액션, 결과 데이터 등 **기능 제어 관련** 메타데이터

---

### 4.3 chat_leads (웹사이트 전용 — 리드 캡처)

웹사이트 챗봇에서 수집한 리드(잠재 고객) 정보.

**Phase 1에서 구조만 생성, OS 챗봇에서는 미사용, 웹사이트 챗봇 개발 시 활용**

```sql
CREATE TABLE chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  pain_points JSONB DEFAULT '[]',           -- 추출된 Pain Point 목록
  source_page TEXT,                          -- 리드 발생 시 웹 페이지
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Context Bridge 연동 포인트 (추후 구현):**
- 웹사이트에서 수집된 리드의 `email`이 OS 계정 가입 `email`과 매칭되면, OS 챗봇이 해당 사용자의 Pain Point를 조회하여 선제적 제안 가능

---

### 4.4 chat_daily_analytics (일별 분석 집계)

양 채널의 일별 사용 통계를 자동 집계. Cron Job 또는 트리거로 생성.

**Phase 1에서 구조만 생성, 추후 Phase에서 집계 로직 구현**

```sql
CREATE TABLE chat_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_turns_per_session NUMERIC(4,1) DEFAULT 0,
  top_topics JSONB DEFAULT '[]',
  top_pain_points JSONB DEFAULT '[]',        -- 웹사이트용
  top_intents JSONB DEFAULT '[]',            -- OS용
  lead_conversion_rate NUMERIC(4,2),         -- 웹사이트용
  satisfaction_avg NUMERIC(3,1),
  UNIQUE(date, channel)                      -- 날짜+채널 조합 유니크
);
```

---

### 4.5 assistant_command_cache (OS 전용 — 명령어 캐시)

OS 챗봇에서 반복되는 명령 패턴을 캐싱하여 응답 속도 향상.

**Phase 1에서 구조만 생성, 추후 Phase에서 캐싱 로직 구현**

```sql
CREATE TABLE assistant_command_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  input_pattern TEXT NOT NULL,               -- 입력 패턴 (정규화된 텍스트)
  input_hash TEXT NOT NULL,                  -- 입력 해시 (빠른 조회용)
  intent TEXT NOT NULL,                      -- 분류된 인텐트
  parameters JSONB,                          -- 추출된 파라미터
  usage_count INTEGER DEFAULT 1,             -- 사용 횟수
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                    -- 캐시 만료 시점
  UNIQUE(store_id, input_hash)               -- 매장+해시 조합 유니크
);
```

---

## 5. 인덱스

```sql
-- chat_conversations 인덱스
CREATE INDEX idx_conv_channel ON chat_conversations(channel, created_at DESC);
CREATE INDEX idx_conv_user ON chat_conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conv_session ON chat_conversations(session_id, created_at DESC) WHERE session_id IS NOT NULL;

-- chat_messages 인덱스
CREATE INDEX idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_msg_channel_data ON chat_messages USING gin(channel_data);

-- chat_leads 인덱스
CREATE INDEX idx_leads_email ON chat_leads(email);

-- assistant_command_cache 인덱스
CREATE INDEX idx_cache_lookup ON assistant_command_cache(store_id, input_hash);
```

**인덱스 설명:**

| 인덱스 | 용도 | 주요 활용 채널 |
|:---|:---|:---|
| `idx_conv_channel` | 채널별 최신 대화 조회 | 양쪽 |
| `idx_conv_user` | 특정 사용자의 대화 목록 | OS |
| `idx_conv_session` | 특정 세션의 대화 조회 | 웹사이트 |
| `idx_msg_conversation` | 대화방 내 메시지 시간순 조회 | 양쪽 |
| `idx_msg_channel_data` | JSONB 내부 필드 검색 (토픽, 인텐트 등) | 양쪽 |
| `idx_leads_email` | 이메일로 리드 조회 (Context Bridge) | 웹사이트 → OS |
| `idx_cache_lookup` | 매장별 명령어 캐시 조회 | OS |

---

## 6. RLS (Row Level Security) 정책

```sql
-- RLS 활성화
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- OS 챗봇: 인증된 사용자 → 본인 대화만 접근
-- =====================================================

CREATE POLICY "os_users_own_conversations" ON chat_conversations
  FOR SELECT USING (channel = 'os_app' AND auth.uid() = user_id);

CREATE POLICY "os_users_insert_conversations" ON chat_conversations
  FOR INSERT WITH CHECK (channel = 'os_app' AND auth.uid() = user_id);

-- =====================================================
-- 웹사이트 챗봇: 비인증 사용자 → service_role로 접근
-- (웹사이트 EF가 service_role 키로 호출하므로 별도 정책 필요)
-- =====================================================

CREATE POLICY "website_service_access" ON chat_conversations
  FOR ALL USING (channel = 'website')
  WITH CHECK (channel = 'website');

-- =====================================================
-- 메시지: 대화 소유자만 접근
-- =====================================================

CREATE POLICY "messages_via_conversation" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );

CREATE POLICY "messages_insert_via_conversation" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );
```

**RLS 설계 원칙:**

- **OS 사용자**: Supabase Auth로 인증됨 → `auth.uid()` 기반 접근 제어
- **웹사이트 방문자**: 비인증 → Edge Function이 `service_role` 키로 접근
- **메시지**: 부모 대화방의 소유권을 따라감

---

## 7. 전체 마이그레이션 SQL

아래 SQL을 Phase 1에서 마이그레이션 파일로 적용한다.

**파일 경로**: `supabase/migrations/20260205000001_create_chat_tables.sql`

```sql
-- ================================================================
-- NEURALTWIN 챗봇 통합 DB 스키마
-- 마이그레이션: create_chat_tables
-- 작성일: 2026-02-05
-- 상태: Phase 1에서 신규 생성
-- ================================================================

-- ENUM
CREATE TYPE chat_channel AS ENUM ('website', 'os_app');

-- 테이블 1: chat_conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel chat_channel NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  store_id UUID REFERENCES stores(id),
  title TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  channel_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  CONSTRAINT valid_identifier CHECK (
    (channel = 'website' AND session_id IS NOT NULL) OR
    (channel = 'os_app' AND user_id IS NOT NULL)
  )
);

-- 테이블 2: chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model_used TEXT,
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  channel_data JSONB DEFAULT '{}',
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative')),
  feedback_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 3: chat_leads (웹사이트 전용, 추후 활용)
CREATE TABLE chat_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  email TEXT NOT NULL,
  company TEXT,
  role TEXT,
  pain_points JSONB DEFAULT '[]',
  source_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 테이블 4: chat_daily_analytics (추후 활용)
CREATE TABLE chat_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  channel chat_channel NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_turns_per_session NUMERIC(4,1) DEFAULT 0,
  top_topics JSONB DEFAULT '[]',
  top_pain_points JSONB DEFAULT '[]',
  top_intents JSONB DEFAULT '[]',
  lead_conversion_rate NUMERIC(4,2),
  satisfaction_avg NUMERIC(3,1),
  UNIQUE(date, channel)
);

-- 테이블 5: assistant_command_cache (OS 전용, 추후 활용)
CREATE TABLE assistant_command_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  input_pattern TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  intent TEXT NOT NULL,
  parameters JSONB,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(store_id, input_hash)
);

-- ================================================================
-- 인덱스
-- ================================================================

CREATE INDEX idx_conv_channel ON chat_conversations(channel, created_at DESC);
CREATE INDEX idx_conv_user ON chat_conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_conv_session ON chat_conversations(session_id, created_at DESC) WHERE session_id IS NOT NULL;
CREATE INDEX idx_msg_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_msg_channel_data ON chat_messages USING gin(channel_data);
CREATE INDEX idx_leads_email ON chat_leads(email);
CREATE INDEX idx_cache_lookup ON assistant_command_cache(store_id, input_hash);

-- ================================================================
-- RLS (Row Level Security)
-- ================================================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;

-- OS: 본인 대화만 조회/생성
CREATE POLICY "os_users_own_conversations" ON chat_conversations
  FOR SELECT USING (channel = 'os_app' AND auth.uid() = user_id);
CREATE POLICY "os_users_insert_conversations" ON chat_conversations
  FOR INSERT WITH CHECK (channel = 'os_app' AND auth.uid() = user_id);

-- Website: service_role 접근
CREATE POLICY "website_service_access" ON chat_conversations
  FOR ALL USING (channel = 'website')
  WITH CHECK (channel = 'website');

-- 메시지: 대화 소유자만
CREATE POLICY "messages_via_conversation" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );
CREATE POLICY "messages_insert_via_conversation" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid())
    OR
    conversation_id IN (SELECT id FROM chat_conversations WHERE channel = 'website')
  );
```

---

## 8. Phase별 테이블 활용 계획

| Phase | 활용 테이블 | 활용 방식 |
|:---|:---|:---|
| Phase 1 | `chat_conversations`, `chat_messages` | 세션 생성, 메시지 저장 (기본) |
| Phase 2 | `chat_conversations`, `chat_messages` | 인텐트/액션 메타데이터 저장 |
| Phase 3 | `chat_conversations`, `chat_messages` | AI 응답 저장, 실행 결과 저장 |
| Phase 4 | `chat_conversations`, `chat_messages` | 대화 히스토리 로드, 이어서 대화 |
| 추후 | `assistant_command_cache` | 명령어 캐싱으로 응답 속도 향상 |
| 추후 | `chat_daily_analytics` | 일별 사용 통계 자동 집계 |
| 웹사이트 챗봇 | `chat_leads` | 리드 캡처 및 Context Bridge |

---

**DB 스키마 문서 끝**
