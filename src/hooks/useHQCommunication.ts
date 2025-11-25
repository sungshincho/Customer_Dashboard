import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface HQMessage {
  id: string;
  user_id: string;
  org_id: string;
  sender_role: string;
  sender_name: string;
  recipient_store_id?: string;
  recipient_role?: string;
  message_type: string;
  subject?: string;
  content: string;
  attachments: any[];
  is_read: boolean;
  read_at?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface StoreComment {
  id: string;
  user_id: string;
  org_id: string;
  store_id?: string;
  author_name: string;
  author_role: string;
  comment: string;
  parent_comment_id?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface HQGuideline {
  id: string;
  user_id: string;
  org_id: string;
  title: string;
  content: string;
  category: string;
  target_stores: string[];
  priority: string;
  effective_date?: string;
  expiry_date?: string;
  attachments: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HQNotification {
  id: string;
  user_id: string;
  org_id: string;
  notification_type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Messages
export function useHQMessages(storeId?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hq-messages', orgId, storeId],
    queryFn: async () => {
      if (!user || !orgId) return [];

      let query = supabase
        .from('hq_store_messages')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('recipient_store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as HQMessage[];
    },
    enabled: !!user && !!orgId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user, orgId, role } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      recipient_store_id?: string;
      recipient_role?: string;
      message_type?: string;
      subject?: string;
      content: string;
      priority?: string;
    }) => {
      if (!user || !orgId || !role) {
        throw new Error('사용자 정보가 없습니다');
      }

      // Get user profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('hq_store_messages')
        .insert([{
          user_id: user.id,
          org_id: orgId,
          sender_role: role as any,
          sender_name: profile?.display_name || user.email || '사용자',
          recipient_store_id: params.recipient_store_id,
          recipient_role: params.recipient_role as any,
          message_type: params.message_type || 'general',
          subject: params.subject,
          content: params.content,
          priority: params.priority || 'normal',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hq-messages'] });
      toast.success('메시지가 전송되었습니다');
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('메시지 전송에 실패했습니다');
    },
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('hq_store_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hq-messages'] });
    },
  });
}

// Comments
export function useStoreComments(storeId?: string) {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['store-comments', orgId, storeId],
    queryFn: async () => {
      if (!user || !orgId) return [];

      let query = supabase
        .from('store_comments')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StoreComment[];
    },
    enabled: !!user && !!orgId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user, orgId, role } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      store_id?: string;
      comment: string;
      parent_comment_id?: string;
    }) => {
      if (!user || !orgId || !role) {
        throw new Error('사용자 정보가 없습니다');
      }

      // Get user profile for display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('store_comments')
        .insert([{
          user_id: user.id,
          org_id: orgId,
          author_name: profile?.display_name || user.email || '사용자',
          author_role: role as any,
          ...params,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-comments'] });
      toast.success('코멘트가 등록되었습니다');
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error('코멘트 등록에 실패했습니다');
    },
  });
}

// Guidelines
export function useHQGuidelines() {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hq-guidelines', orgId],
    queryFn: async () => {
      if (!user || !orgId) return [];

      const { data, error } = await supabase
        .from('hq_guidelines')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as HQGuideline[];
    },
    enabled: !!user && !!orgId,
  });
}

export function useCreateGuideline() {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      category: string;
      target_stores?: string[];
      priority?: string;
      effective_date?: string;
      expiry_date?: string;
    }) => {
      if (!user || !orgId) {
        throw new Error('사용자 정보가 없습니다');
      }

      const { data, error } = await supabase
        .from('hq_guidelines')
        .insert({
          user_id: user.id,
          org_id: orgId,
          ...params,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hq-guidelines'] });
      toast.success('가이드라인이 등록되었습니다');
    },
    onError: (error) => {
      console.error('Error creating guideline:', error);
      toast.error('가이드라인 등록에 실패했습니다');
    },
  });
}

// Notifications
export function useHQNotifications() {
  const { user, orgId } = useAuth();

  return useQuery({
    queryKey: ['hq-notifications', user?.id],
    queryFn: async () => {
      if (!user || !orgId) return [];

      const { data, error } = await supabase
        .from('hq_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as HQNotification[];
    },
    enabled: !!user && !!orgId,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('hq_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hq-notifications'] });
    },
  });
}
