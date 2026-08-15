import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface ParametroCaducidad {
  id: string;
  grupo: string;
  dias: number;
}

interface CaducidadState {
  parametros: ParametroCaducidad[];
  isLoading: boolean;
  fetchParametros: () => Promise<void>;
  updateDias: (grupo: string, dias: number) => Promise<void>;
}

export const useCaducidadStore = create<CaducidadState>((set, get) => ({
  parametros: [],
  isLoading: false,

  fetchParametros: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('parametros_caducidad').select('*');
      if (error) throw error;
      set({ parametros: data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching parametros caducidad:', error);
      set({ isLoading: false });
    }
  },

  updateDias: async (grupo, dias) => {
    try {
      const { parametros } = get();
      const parametro = parametros.find(p => p.grupo === grupo);

      if (parametro) {
        // Update existing
        const { error } = await supabase
          .from('parametros_caducidad')
          .update({ dias })
          .eq('grupo', grupo);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('parametros_caducidad')
          .insert({ grupo, dias });
        if (error) throw error;
      }

      await get().fetchParametros();
      toast.success(`Días actualizados para ${grupo}`);
    } catch (error: any) {
      console.error('Error updating parametros caducidad:', error);
      toast.error(error.message || 'Error al actualizar');
      throw error;
    }
  }
}));
