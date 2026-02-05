/**
 * 챗봇 대화 로깅 유틸리티
 * - 대화 세션 생성/조회
 * - 메시지 저장/조회
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

export interface ConversationCreateInput {
  channel: 'website' | 'os_app';
  user_id?: string;
  session_id?: string;
  store_id?: string;
  channel_metadata?: Record<string, any>;
}

export interface MessageCreateInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  tokens_used?: number;
  execution_time_ms?: number;
  channel_data?: Record<string, any>;
}

export async function createConversation(
  supabase: SupabaseClient,
  input: ConversationCreateInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      channel: input.channel,
      user_id: input.user_id,
      session_id: input.session_id,
      store_id: input.store_id,
      channel_metadata: input.channel_metadata || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[chatLogger] createConversation error:', error);
    return null;
  }
  return data;
}

export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('[chatLogger] getConversation error:', error);
    return null;
  }
  return data;
}

export async function saveMessage(
  supabase: SupabaseClient,
  input: MessageCreateInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: input.conversation_id,
      role: input.role,
      content: input.content,
      model_used: input.model_used,
      tokens_used: input.tokens_used,
      execution_time_ms: input.execution_time_ms,
      channel_data: input.channel_data || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[chatLogger] saveMessage error:', error);
    return null;
  }

  // message_count 증가
  await supabase
    .from('chat_conversations')
    .update({
      message_count: supabase.rpc('increment_message_count', { conv_id: input.conversation_id }),
      updated_at: new Date().toISOString()
    })
    .eq('id', input.conversation_id);

  return data;
}

export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 50
): Promise<any[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[chatLogger] getConversationMessages error:', error);
    return [];
  }
  return data || [];
}
