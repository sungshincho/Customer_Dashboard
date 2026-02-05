# NEURALTWIN OS 챗봇 — Phase 2-C 기능 개발 결과 문서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **작성자**: Claude AI Assistant
> **커밋**: `b4a4915` - feat: Phase 2-C 프론트엔드 통합 구현

---

## 1. 개발 목표

**프론트엔드 통합 — useAssistantChat 훅 + ActionDispatcher + DashboardLayout 연결**

- 채팅창에서 메시지 입력 시 실제 `neuraltwin-assistant` Edge Function 호출
- 응답의 `actions` 배열을 실행하여 실제 페이지 이동/탭 전환/날짜 변경
- "인사이트 허브 고객탭 보여줘" 명령 시 실제로 해당 페이지/탭으로 이동

---

## 2. 구현 결과

### 2.1 신규 파일 (5개)

| 파일 경로 | 설명 |
|-----------|------|
| `src/hooks/useAssistantChat.ts` | AI 연동 채팅 훅 (기존 useChatPanel 대체) |
| `src/features/assistant/hooks/useActionDispatcher.ts` | UIAction 실행 훅 (navigate, set_date_range) |
| `src/features/assistant/hooks/useAssistantContext.ts` | 대시보드 상태 수집 훅 |
| `src/features/assistant/utils/actionDispatcher.ts` | 액션 검증 유틸리티 (순수 함수) |
| `src/features/assistant/context/AssistantProvider.tsx` | Assistant Context Provider |

### 2.2 수정 파일 (3개)

| 파일 경로 | 수정 내용 |
|-----------|-----------|
| `src/components/DashboardLayout.tsx` | `useChatPanel` → `useAssistantChat` 교체 |
| `src/features/insights/InsightHubPage.tsx` | URL 쿼리 파라미터(`?tab=`)로 탭 전환 지원 |
| `src/features/studio/DigitalTwinStudioPage.tsx` | URL 쿼리 파라미터(`?tab=`)로 탭 전환 지원 |

---

## 3. 주요 구현 내용

### 3.1 useAssistantChat.ts

```typescript
// 핵심 기능
- Edge Function 호출 (supabase.functions.invoke)
- 컨텍스트 자동 수집 (page, tab, dateRange, store)
- 액션 자동 실행 (dispatchActions)
- 로딩/스트리밍 상태 관리
- 후속 제안 표시

// 인터페이스 (기존 useChatPanel과 동일 + 확장)
interface UseAssistantChatReturn {
  isOpen: boolean;
  width: number;
  messages: ChatMessage[];
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setWidth: (width: number) => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  isLoading: boolean;      // 추가
  isStreaming: boolean;    // 추가
}
```

### 3.2 useActionDispatcher.ts

```typescript
// 지원 액션 타입
type UIAction = {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

// 구현 상태
- navigate: ✅ 완료 (useNavigate 사용)
- set_date_range: ✅ 완료 (useDateFilterStore 연동)
- open_dialog: 🔜 Phase 3 예정
- run_simulation: 🔜 Phase 3-C 예정
- run_optimization: 🔜 Phase 3-C 예정
```

### 3.3 URL 쿼리 파라미터 탭 전환

```typescript
// InsightHubPage.tsx
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as InsightTabType | null;

useEffect(() => {
  if (tabFromUrl && ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);

// DigitalTwinStudioPage.tsx
useEffect(() => {
  if (tabFromUrl && ['layer', 'ai-simulation', 'ai-optimization', 'apply'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl]);
```

---

## 4. 제약조건 준수

| 제약조건 | 준수 여부 |
|----------|-----------|
| ❌ 기존 Edge Function 코드 수정 | ✅ 미수정 |
| ❌ ChatPanel.tsx 수정 | ✅ 미수정 |
| ❌ ChatInput.tsx 수정 | ✅ 미수정 |
| ❌ ChatMessage.tsx 수정 | ✅ 미수정 |
| ❌ useChatPanel.ts 수정 | ✅ 미수정 |
| ✅ 새로운 훅/컨텍스트 파일 추가 | ✅ 5개 생성 |
| ✅ DashboardLayout.tsx 최소 수정 | ✅ import + 훅 호출만 변경 |
| ✅ InsightHubPage.tsx URL 쿼리 추가 | ✅ 완료 |
| ✅ DigitalTwinStudioPage.tsx URL 쿼리 추가 | ✅ 완료 |

---

## 5. 완료 체크리스트

### 파일 생성
- [x] `src/hooks/useAssistantChat.ts` 생성
- [x] `src/features/assistant/hooks/useActionDispatcher.ts` 생성
- [x] `src/features/assistant/hooks/useAssistantContext.ts` 생성
- [x] `src/features/assistant/utils/actionDispatcher.ts` 생성
- [x] `src/features/assistant/context/AssistantProvider.tsx` 생성

### 기존 파일 수정
- [x] `DashboardLayout.tsx` — import 변경 + 훅 호출 변경
- [x] `InsightHubPage.tsx` — useSearchParams + useEffect 추가
- [x] `DigitalTwinStudioPage.tsx` — useSearchParams + useEffect 추가

### 기능 테스트 (배포 후 확인 필요)
- [ ] 채팅창에서 메시지 전송 시 Edge Function 호출 확인
- [ ] "인사이트 허브로 가줘" → 실제 페이지 이동 확인
- [ ] "고객탭 보여줘" → 실제 탭 전환 확인
- [ ] "최근 7일로 변경해줘" → 날짜 필터 변경 확인
- [ ] "인사이트 허브 고객탭에서 7일 데이터 보여줘" → 복합 동작 확인

---

## 6. 파일 구조

```
src/
├── hooks/
│   ├── useChatPanel.ts          # 기존 (미수정, 레거시)
│   └── useAssistantChat.ts      # 신규 (AI 연동)
├── features/
│   └── assistant/
│       ├── context/
│       │   └── AssistantProvider.tsx
│       ├── hooks/
│       │   ├── useAssistantContext.ts
│       │   └── useActionDispatcher.ts
│       └── utils/
│           └── actionDispatcher.ts
├── components/
│   └── DashboardLayout.tsx      # 수정 (useAssistantChat 사용)
```

---

## 7. 다음 단계

**Phase 3-A**: 일반 대화 + AI 연동
- `utils/geminiClient.ts` — Gemini API 클라이언트
- `actions/chatActions.ts` — general_chat 처리
- `response/generator.ts` — 자연어 응답 생성
- 시스템 프롬프트 정의

---

**Phase 2-C 개발 완료**
