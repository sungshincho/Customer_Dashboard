import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface StoreFormData {
  store_name: string;
  store_code: string;
  address?: string;
  manager_name?: string;
  phone?: string;
  email?: string;
}

interface StoreFormProps {
  store?: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function StoreForm({ store, onSuccess, trigger }: StoreFormProps) {
  const { user, orgId } = useAuth();
  const { logActivity } = useActivityLogger();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<StoreFormData>({
    defaultValues: store || {}
  });

  const onSubmit = async (data: StoreFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      if (store) {
        // Update
        const { error } = await supabase
          .from('stores')
          .update(data)
          .eq('id', store.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('매장 정보가 수정되었습니다');
        
        // Activity logging
        logActivity('feature_use', {
          feature: 'store_update',
          store_id: store.id,
          store_name: data.store_name,
          timestamp: new Date().toISOString()
        });
      } else {
        // Create
        const { error } = await supabase
          .from('stores')
          .insert([{ ...data, user_id: user.id, org_id: orgId }]);

        if (error) throw error;
        toast.success('매장이 추가되었습니다');
        
        // Activity logging
        logActivity('feature_use', {
          feature: 'store_create',
          store_name: data.store_name,
          store_code: data.store_code,
          timestamp: new Date().toISOString()
        });
      }

      setOpen(false);
      reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Store form error:', error);
      if (error.message.includes('duplicate key')) {
        toast.error('이미 존재하는 매장 코드입니다');
      } else {
        toast.error(store ? '매장 수정에 실패했습니다' : '매장 추가에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            새 매장 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{store ? '매장 수정' : '새 매장 추가'}</DialogTitle>
          <DialogDescription>
            매장 정보를 입력하세요. 매장 코드는 고유해야 합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">매장명 *</Label>
            <Input
              id="store_name"
              {...register('store_name', { required: '매장명을 입력하세요' })}
              placeholder="강남점"
            />
            {errors.store_name && (
              <p className="text-sm text-destructive">{errors.store_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_code">매장 코드 *</Label>
            <Input
              id="store_code"
              {...register('store_code', { required: '매장 코드를 입력하세요' })}
              placeholder="GN001"
              disabled={!!store}
            />
            {errors.store_code && (
              <p className="text-sm text-destructive">{errors.store_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">주소</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="서울특별시 강남구..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager_name">매니저</Label>
              <Input
                id="manager_name"
                {...register('manager_name')}
                placeholder="홍길동"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="02-1234-5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="store@example.com"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                store ? '수정' : '추가'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
