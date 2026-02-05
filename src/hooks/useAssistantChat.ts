/**
 * AI 연동 채팅 훅
 * 기존 useChatPanel과 동일한 인터페이스 유지
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
        const suggestionsText = `\n\n이런 것도 해볼 수 있어요:\n${data.suggestions.map((s: string) => `- ${s}`).join('\n')}`;

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
