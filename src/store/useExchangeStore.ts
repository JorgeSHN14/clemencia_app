import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type GrupoIntercambio = 'Cereales' | 'Tubérculos' | 'Proteínas' | 'Frutas' | 'Vegetales';

export interface Intercambio {
  id: string;
  nombre: string;
  grupo: GrupoIntercambio;
  porciones_equivalentes: string;
}

interface ExchangeState {
  items: Intercambio[];
  isLoading: boolean;
  fetchExchanges: () => Promise<void>;
  addExchange: (exchange: Omit<Intercambio, 'id'>) => Promise<void>;
  removeExchange: (id: string) => Promise<void>;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchExchanges: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('intercambios').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ items: data as Intercambio[], isLoading: false });
    } catch (error) {
      console.error('Error fetching exchanges', error);
      set({ isLoading: false });
    }
  },

  addExchange: async (exchange) => {
    try {
      const { error } = await supabase.from('intercambios').insert([exchange]);
      if (error) throw error;
      await get().fetchExchanges();
    } catch (error) {
      console.error('Error adding exchange', error);
      throw error;
    }
  },

  removeExchange: async (id) => {
    try {
      const { error } = await supabase.from('intercambios').delete().eq('id', id);
      if (error) throw error;
      await get().fetchExchanges();
    } catch (error) {
      console.error('Error removing exchange', error);
      throw error;
    }
  }
}));
