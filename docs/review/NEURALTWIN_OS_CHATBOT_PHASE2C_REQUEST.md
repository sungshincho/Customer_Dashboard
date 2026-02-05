# NEURALTWIN OS 챗봇 — Phase 2-C 기능 개발 요청서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 2-B (엔티티 추출 + 탭/날짜 액션) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 2-C 목표

**프론트엔드 통합 — useAssistantChat 훅 + ActionDispatcher + DashboardLayout 연결**

이 Phase가 완료되면:
- 채팅창에서 메시지 입력 시 실제 `neuraltwin-assistant` Edge Function 호출
- 응답의 `actions` 배열을 실행하여 실제 페이지 이동/탭 전환/날짜 변경
- "인사이트 허브 고객탭 보여줘" 명령 시 실제로 해당 페이지/탭으로 이동

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ ChatPanel.tsx, ChatInput.tsx, ChatMessage.tsx 수정
❌ useChatPanel.ts 수정
✅ 새로운 훅/컨텍스트 파일 추가
✅ DashboardLayout.tsx 최소 수정 (import 1줄 + 훅 호출 1줄)
✅ InsightHubPage.tsx, DigitalTwinStudioPage.tsx에 URL 쿼리 파라미터 읽기 코드 추가
```

---

## 3. 구현 범위

### 3.1 신규 파일 목록

```
src/
├── hooks/
│   └── useAssistantChat.ts           # 신규
├── features/
│   └── assistant/
│       ├── context/
│       │   └── AssistantProvider.tsx  # 신규
│       ├── hooks/
│       │   ├── useAssistantContext.ts # 신규
│       │   └── useActionDispatcher.ts # 신규
│       └── utils/
│           └── actionDispatcher.ts   # 신규
```

### 3.2 useAssistantChat.ts — AI 연동 채팅 훅

```typescript
/**
 * AI 연동 채팅 훅
 * 기존 useChatPanel과 동일한 인터페이스 유지
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useActionDispatcher } from '@/features/assistant/hooks/useActionDispatcher';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

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
  isLoading: boolean;
  isStreaming: boolean;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 380;

export function useAssistantChat(): UseAssistantChatReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '안녕하세요! NEURALTWIN AI 어시스턴트입니다. 무엇을 도와드릴까요?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { session } = useAuth();
  const { selectedStore } = useSelectedStore();
  const location = useLocation();
  const { dateRange } = useDateFilterStore();
  const { dispatchActions } = useActionDispatcher();

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    setWidthState(clampedWidth);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return;

    // 1. 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // 2. 로딩 상태 시작
    setIsLoading(true);

    // 3. "생각 중..." 임시 메시지 추가
    const loadingMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, {
      id: loadingMessageId,
      content: '생각 중...',
      sender: 'assistant',
      timestamp: new Date(),
    }]);

    try {
      // 4. 현재 컨텍스트 수집
      const currentPage = location.pathname;
      const currentTab = new URLSearchParams(location.search).get('tab');

      const context = {
        page: {
          current: currentPage,
          tab: currentTab || undefined,
        },
        dateRange: {
          preset: dateRange.preset,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        store: {
          id: selectedStore?.id || '',
          name: selectedStore?.store_name || '',
        },
      };

      // 5. Edge Function 호출
      const { data, error } = await supabase.functions.invoke('neuraltwin-assistant', {
        body: {
          message: content.trim(),
          conversationId,
          context,
        },
      });

      setIsLoading(false);

      if (error) {
        throw error;
      }

      // 6. 응답 처리
      setIsStreaming(true);
      setConversationId(data.meta?.conversationId || null);

      // 7. 액션 실행
      if (data.actions && data.actions.length > 0) {
        await dispatchActions(data.actions);
      }

      // 8. "생각 중..." 메시지를 실제 응답으로 교체
      setMessages((prev) => prev.map((msg) =>
        msg.id === loadingMessageId
          ? {
              ...msg,
              content: data.message,
              timestamp: new Date(),
            }
          : msg
      ));

      // 9. 후속 제안 추가 (있는 경우)
      if (data.suggestions && data.suggestions.length > 0) {
        // 후속 제안은 별도 UI로 표시하거나, 메시지에 포함
        // 현재는 메시지에 포함
        const suggestionsText = `\n\n💡 이런 것도 해볼 수 있어요:\n${data.suggestions.map((s: string) => `• ${s}`).join('\n')}`;

        setMessages((prev) => prev.map((msg) =>
          msg.id === loadingMessageId
            ? { ...msg, content: msg.content + suggestionsText }
            : msg
        ));
      }

    } catch (error) {
      console.error('[useAssistantChat] Error:', error);

      // 에러 메시지로 교체
      setMessages((prev) => prev.map((msg) =>
        msg.id === loadingMessageId
          ? {
              ...msg,
              content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
              timestamp: new Date(),
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading, isStreaming, conversationId, location, dateRange, selectedStore, dispatchActions]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    isOpen,
    width,
    messages,
    togglePanel,
    openPanel,
    closePanel,
    setWidth,
    sendMessage,
    clearMessages,
    isLoading,
    isStreaming,
  };
}

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };
```

### 3.3 useActionDispatcher.ts — UIAction 실행 훅

```typescript
/**
 * UIAction 실행 훅
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';

interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export function useActionDispatcher() {
  const navigate = useNavigate();
  const { setPreset, setCustomRange } = useDateFilterStore();

  const dispatchAction = useCallback(async (action: UIAction): Promise<void> => {
    switch (action.type) {
      case 'navigate':
        // 페이지 이동 (탭 파라미터 포함 가능)
        navigate(action.target);
        break;

      case 'set_date_range':
        // 날짜 필터 변경
        if (action.preset) {
          setPreset(action.preset);
        } else if (action.startDate && action.endDate) {
          setCustomRange(action.startDate, action.endDate);
        }
        break;

      case 'open_dialog':
        // TODO: Phase 3에서 구현
        console.log('[ActionDispatcher] open_dialog:', action.dialogId);
        break;

      case 'run_simulation':
      case 'run_optimization':
        // TODO: Phase 3-C에서 구현
        console.log('[ActionDispatcher] execution action:', action.type);
        break;

      default:
        console.warn('[ActionDispatcher] Unknown action type:', action.type);
    }
  }, [navigate, setPreset, setCustomRange]);

  const dispatchActions = useCallback(async (actions: UIAction[]): Promise<void> => {
    for (const action of actions) {
      await dispatchAction(action);
      // 액션 간 약간의 딜레이 (애니메이션 등을 위해)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, [dispatchAction]);

  return { dispatchAction, dispatchActions };
}
```

### 3.4 actionDispatcher.ts — 유틸리티 (순수 함수)

```typescript
/**
 * ActionDispatcher 유틸리티
 * React Hook 외부에서 사용 가능한 순수 함수들
 */

export interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

/**
 * 액션 유효성 검증
 */
export function validateAction(action: UIAction): boolean {
  if (!action || !action.type) {
    return false;
  }

  switch (action.type) {
    case 'navigate':
      return typeof action.target === 'string' && action.target.startsWith('/');

    case 'set_date_range':
      return (
        typeof action.preset === 'string' ||
        (typeof action.startDate === 'string' && typeof action.endDate === 'string')
      );

    case 'open_dialog':
      return typeof action.dialogId === 'string';

    case 'run_simulation':
    case 'run_optimization':
      return true; // Phase 3-C에서 상세 검증

    default:
      return false;
  }
}

/**
 * 액션 배열 필터링 (유효한 것만)
 */
export function filterValidActions(actions: UIAction[]): UIAction[] {
  return actions.filter(validateAction);
}
```

### 3.5 useAssistantContext.ts — 대시보드 상태 수집 훅

```typescript
/**
 * 대시보드 상태 수집 훅
 * 현재 페이지, 탭, 날짜 필터 등 수집
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSelectedStore } from '@/hooks/useSelectedStore';

export interface AssistantContext {
  page: {
    current: string;
    tab?: string;
  };
  dateRange: {
    preset: string;
    startDate: string;
    endDate: string;
  };
  store: {
    id: string;
    name: string;
  };
}

export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const { dateRange } = useDateFilterStore();
  const { selectedStore } = useSelectedStore();

  const context = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');

    return {
      page: {
        current: location.pathname,
        tab: tab || undefined,
      },
      dateRange: {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      store: {
        id: selectedStore?.id || '',
        name: selectedStore?.store_name || '',
      },
    };
  }, [location, dateRange, selectedStore]);

  return context;
}
```

### 3.6 AssistantProvider.tsx — 컨텍스트 Provider

```typescript
/**
 * Assistant Context Provider
 * 하위 컴포넌트에 어시스턴트 관련 상태 제공
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAssistantContext, AssistantContext } from '../hooks/useAssistantContext';

interface AssistantProviderContextType {
  context: AssistantContext;
}

const AssistantProviderContext = createContext<AssistantProviderContextType | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const context = useAssistantContext();

  return (
    <AssistantProviderContext.Provider value={{ context }}>
      {children}
    </AssistantProviderContext.Provider>
  );
}

export function useAssistantProvider(): AssistantProviderContextType {
  const ctx = useContext(AssistantProviderContext);
  if (!ctx) {
    throw new Error('useAssistantProvider must be used within AssistantProvider');
  }
  return ctx;
}
```

### 3.7 DashboardLayout.tsx 수정

```typescript
// 변경 전
import { useChatPanel } from '@/hooks/useChatPanel';

// 변경 후
import { useAssistantChat } from '@/hooks/useAssistantChat';

// 훅 호출 변경
const {
  isOpen: isChatOpen,
  width: chatWidth,
  messages,
  togglePanel,
  closePanel,
  setWidth,
  sendMessage,
  clearMessages,
  isLoading,      // 추가
  isStreaming,    // 추가
} = useAssistantChat();  // useChatPanel() → useAssistantChat()

// ChatPanel props에 disabled 추가
<ChatPanel
  isOpen={isChatOpen}
  width={chatWidth}
  messages={messages}
  isDark={isDark}
  onClose={closePanel}
  onWidthChange={setWidth}
  onSendMessage={sendMessage}
  onClearMessages={clearMessages}
  disabled={isLoading || isStreaming}  // 추가 (ChatInput에 전달됨)
/>
```

### 3.8 InsightHubPage.tsx URL 쿼리 파라미터 읽기 추가

```typescript
// 기존 import에 추가
import { useSearchParams } from 'react-router-dom';

// 컴포넌트 내부에 추가
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as InsightTabType | null;

// useEffect 추가
useEffect(() => {
  if (tabFromUrl && ['overview', 'store', 'customer', 'product', 'inventory', 'prediction', 'ai'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl, setActiveTab]);
```

### 3.9 DigitalTwinStudioPage.tsx URL 쿼리 파라미터 읽기 추가

```typescript
// 기존 import에 추가
import { useSearchParams } from 'react-router-dom';

// 컴포넌트 내부에 추가
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab') as TabType | null;

// useEffect 추가
useEffect(() => {
  if (tabFromUrl && ['layer', 'ai-simulation', 'ai-optimization', 'apply'].includes(tabFromUrl)) {
    setActiveTab(tabFromUrl);
  }
}, [tabFromUrl, setActiveTab]);
```

---

## 4. 완료 체크리스트

### 파일 생성
- [ ] `src/hooks/useAssistantChat.ts` 생성
- [ ] `src/features/assistant/hooks/useActionDispatcher.ts` 생성
- [ ] `src/features/assistant/hooks/useAssistantContext.ts` 생성
- [ ] `src/features/assistant/utils/actionDispatcher.ts` 생성
- [ ] `src/features/assistant/context/AssistantProvider.tsx` 생성

### 기존 파일 수정
- [ ] `DashboardLayout.tsx` — import 변경 + 훅 호출 변경
- [ ] `InsightHubPage.tsx` — useSearchParams + useEffect 추가
- [ ] `DigitalTwinStudioPage.tsx` — useSearchParams + useEffect 추가

### 기능 테스트
- [ ] 채팅창에서 메시지 전송 시 Edge Function 호출 확인
- [ ] "인사이트 허브로 가줘" → 실제 페이지 이동 확인
- [ ] "고객탭 보여줘" → 실제 탭 전환 확인
- [ ] "최근 7일로 변경해줘" → 날짜 필터 변경 확인
- [ ] "인사이트 허브 고객탭에서 7일 데이터 보여줘" → 복합 동작 확인
- [ ] isLoading 동안 입력창 비활성화 확인
- [ ] 에러 발생 시 에러 메시지 표시 확인

---

## 5. 다음 Phase 예고

**Phase 3-A**: 일반 대화 + AI 연동
- `utils/geminiClient.ts` — Gemini API 클라이언트
- `actions/chatActions.ts` — general_chat 처리
- `response/generator.ts` — 자연어 응답 생성
- 시스템 프롬프트 정의

---

**Phase 2-C 요청서 끝**
