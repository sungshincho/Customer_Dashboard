/**
 * AI 연동 채팅 훅
 * Zustand chatStore 기반 - 라우트 변경 시에도 상태 유지
 *
 * 2단계 응답 플로우 (needsRefresh):
 * 1단계: Edge Function → 인텐트 분류 + 액션 반환
 * 2단계: 액션 실행 (탭 전환) → screenData 대기 → 재호출 → 데이터 응답
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useActionDispatcher } from '@/features/assistant/hooks/useActionDispatcher';
import { useChatStore, type ChatMessage } from '@/store/chatStore';
import { useScreenDataStore } from '@/store/screenDataStore';

export type { ChatMessage };

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

/**
 * screenData 변경을 감지하여 대기
 * 탭 전환 후 프론트엔드가 데이터를 로드하면 screenData가 업데이트됨
 */
function waitForScreenDataUpdate(timeoutMs: number): Promise<ReturnType<typeof useScreenDataStore.getState>['screenData']> {
  return new Promise((resolve) => {
    const initialSnapshot = JSON.stringify(useScreenDataStore.getState().screenData);

    const unsubscribe = useScreenDataStore.subscribe((state) => {
      const currentSnapshot = JSON.stringify(state.screenData);
      if (currentSnapshot !== initialSnapshot) {
        unsubscribe();
        resolve(state.screenData);
      }
    });

    // 타임아웃: 최대 대기 시간 초과 시 현재 상태 반환
    setTimeout(() => {
      unsubscribe();
      resolve(useScreenDataStore.getState().screenData);
    }, timeoutMs);
  });
}

export function useAssistantChat(): UseAssistantChatReturn {
  // Zustand 스토어에서 상태 가져오기 (라우트 변경에도 유지됨)
  const {
    isOpen,
    width,
    messages,
    isLoading,
    isStreaming,
    conversationId,
    togglePanel,
    openPanel,
    closePanel,
    setWidth,
    clearMessages,
    addMessage,
    updateMessage,
    setIsLoading,
    setIsStreaming,
    setConversationId,
  } = useChatStore();

  const { session } = useAuth();
  const { selectedStore } = useSelectedStore();
  const location = useLocation();
  const { dateRange } = useDateFilterStore();
  const { dispatchActions } = useActionDispatcher();
  const { screenData } = useScreenDataStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isStreaming) return;

    // 1. 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // 2. 로딩 상태 시작
    setIsLoading(true);

    // 3. "생각 중..." 임시 메시지 추가
    const loadingMessageId = (Date.now() + 1).toString();
    addMessage({
      id: loadingMessageId,
      content: '생각 중...',
      sender: 'assistant',
      timestamp: new Date(),
    });

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
        screenData: screenData,
      };

      // 5. Edge Function 호출 (1단계)
      const { data, error } = await supabase.functions.invoke('neuraltwin-assistant', {
        body: {
          message: content.trim(),
          conversationId,
          context,
        },
      });

      if (error) {
        throw error;
      }

      setConversationId(data.meta?.conversationId || null);

      // 6. needsRefresh 판단: 탭 전환 후 데이터 로드가 필요한 경우
      if (data.meta?.needsRefresh && data.actions?.length > 0) {
        // 6-A. "데이터 로딩 중..." 표시
        updateMessage(loadingMessageId, '데이터를 로딩 중입니다...');

        // 6-B. 액션 먼저 실행 (탭 전환 + 날짜 설정)
        await dispatchActions(data.actions);

        // 6-C. screenData 업데이트 대기 (최대 5초)
        const freshScreenData = await waitForScreenDataUpdate(5000);

        // 6-D. 새로운 screenData로 Edge Function 재호출 (2단계)
        const refreshedContext = {
          ...context,
          page: {
            current: location.pathname,
            tab: new URLSearchParams(location.search).get('tab') || undefined,
          },
          screenData: freshScreenData,
        };

        const { data: refreshedData, error: refreshError } = await supabase.functions.invoke('neuraltwin-assistant', {
          body: {
            message: content.trim(),
            conversationId: data.meta?.conversationId,
            context: refreshedContext,
          },
        });

        setIsLoading(false);
        setIsStreaming(true);

        if (refreshError) {
          throw refreshError;
        }

        // 6-E. 2단계 응답 표시
        let responseContent = refreshedData.message;
        if (refreshedData.suggestions?.length > 0) {
          responseContent += `\n\n이런 것도 해볼 수 있어요:\n${refreshedData.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
        }
        updateMessage(loadingMessageId, responseContent);

        // 2단계에서 추가 액션이 있으면 실행 (스크롤 등)
        if (refreshedData.actions?.length > 0) {
          // set_date_range과 navigate는 이미 실행했으므로 스크롤만 실행
          const scrollActions = refreshedData.actions.filter(
            (a: any) => a.type === 'scroll_to_section' || a.type === 'highlight_element'
          );
          if (scrollActions.length > 0) {
            await dispatchActions(scrollActions);
          }
        }
      } else {
        // 7. 일반 플로우: screenData가 있어서 바로 응답
        setIsLoading(false);
        setIsStreaming(true);

        let responseContent = data.message;
        if (data.suggestions?.length > 0) {
          responseContent += `\n\n이런 것도 해볼 수 있어요:\n${data.suggestions.map((s: string) => `- ${s}`).join('\n')}`;
        }

        updateMessage(loadingMessageId, responseContent);

        // 액션 실행 (응답 메시지 표시 후)
        if (data.actions?.length > 0) {
          await dispatchActions(data.actions);
        }
      }

    } catch (error) {
      console.error('[useAssistantChat] Error:', error);

      // 에러 메시지로 교체
      updateMessage(
        loadingMessageId,
        '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [isLoading, isStreaming, conversationId, location, dateRange, selectedStore, screenData, dispatchActions, addMessage, updateMessage, setIsLoading, setIsStreaming, setConversationId]);

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

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH } from '@/store/chatStore';
