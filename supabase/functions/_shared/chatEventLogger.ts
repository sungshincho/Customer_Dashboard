/**
 * 챗봇 이벤트 로깅 유틸리티
 * - chat_events 테이블에 이벤트 기록
 * - handover, context_bridge, session_start 등 추적
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

export type ChatEventType =
  | 'session_start'
  | 'session_end'
  | 'handover_initiated'
  | 'handover_completed'
  | 'context_bridge_load'
  | 'context_bridge_ref'
  | 'lead_captured'
  | 'error_occurred';

export interface EventCreateInput {
  conversation_id: string;
  event_type: ChatEventType;
  event_data?: Record<string, any>;
}

/**
 * 이벤트 기록
 */
export async function createEvent(
  supabase: SupabaseClient,
  input: EventCreateInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('chat_events')
    .insert({
      conversation_id: input.conversation_id,
      event_type: input.event_type,
      event_data: input.event_data || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[chatEventLogger] createEvent error:', error);
    return null;
  }
  return data;
}

/**
 * 대화의 이벤트 이력 조회
 */
export async function getConversationEvents(
  supabase: SupabaseClient,
  conversationId: string,
  eventType?: ChatEventType
): Promise<any[]> {
  let query = supabase
    .from('chat_events')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[chatEventLogger] getConversationEvents error:', error);
    return [];
  }
  return data || [];
}

/**
 * 세션 시작 이벤트 기록 헬퍼
 */
export async function logSessionStart(
  supabase: SupabaseClient,
  conversationId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createEvent(supabase, {
    conversation_id: conversationId,
    event_type: 'session_start',
    event_data: metadata,
  });
}

/**
 * Context Bridge 로드 이벤트 기록 헬퍼
 */
export async function logContextBridgeLoad(
  supabase: SupabaseClient,
  conversationId: string,
  sourceChannel: string,
  loadedCount: number
): Promise<void> {
  await createEvent(supabase, {
    conversation_id: conversationId,
    event_type: 'context_bridge_load',
    event_data: {
      source_channel: sourceChannel,
      loaded_conversations: loadedCount,
    },
  });
}
