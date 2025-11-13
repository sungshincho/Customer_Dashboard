import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Store {
  id: string;
  store_name: string;
  store_code: string;
  address?: string;
  manager_name?: string;
  phone?: string;
  email?: string;
  metadata?: any;
}

interface SelectedStoreContextType {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  stores: Store[];
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const SelectedStoreContext = createContext<SelectedStoreContextType | undefined>(undefined);

export function SelectedStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setSelectedStore(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setStores(data || []);
      
      // 첫 번째 매장 자동 선택
      if (data && data.length > 0 && !selectedStore) {
        setSelectedStore(data[0]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStores = async () => {
    setLoading(true);
    await fetchStores();
  };

  useEffect(() => {
    fetchStores();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stores',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SelectedStoreContext.Provider value={{ selectedStore, setSelectedStore, stores, loading, refreshStores }}>
      {children}
    </SelectedStoreContext.Provider>
  );
}

export function useSelectedStore() {
  const context = useContext(SelectedStoreContext);
  if (context === undefined) {
    throw new Error('useSelectedStore must be used within a SelectedStoreProvider');
  }
  return context;
}
