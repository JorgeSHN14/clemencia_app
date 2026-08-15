import { create } from 'zustand';
import type { ParametroClinico, CondicionClinicaDetalle, CategoriaCondicion } from '@/types';
import { supabase } from '@/lib/supabase';

interface ParametrosState {
  parametros: ParametroClinico[];
  condiciones: CondicionClinicaDetalle[];
  isLoading: boolean;
  fetchParametros: () => Promise<void>;
  updateParametro: (id: string, valorHombre: number, valorMujer: number) => Promise<void>;
  fetchCondiciones: () => Promise<void>;
  addCondicion: (nombre: string, categoria: CategoriaCondicion) => Promise<void>;
  updateCondicionCategoria: (id: string, categoria: CategoriaCondicion) => Promise<void>;
  removeCondicion: (id: string) => Promise<void>;
}

export const useParametrosStore = create<ParametrosState>((set, get) => ({
  parametros: [],
  condiciones: [],
  isLoading: false,

  fetchParametros: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('parametros_clinicos')
        .select('*')
        .order('nombre');
      if (error) throw error;
      const parametros: ParametroClinico[] = (data || []).map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        valor_hombre: Number(p.valor_hombre),
        valor_mujer: Number(p.valor_mujer),
        descripcion: p.descripcion,
      }));
      set({ parametros, isLoading: false });
    } catch (err) {
      console.error('Error fetchParametros', err);
      set({ isLoading: false });
    }
  },

  updateParametro: async (id, valorHombre, valorMujer) => {
    try {
      const { error } = await supabase
        .from('parametros_clinicos')
        .update({ valor_hombre: valorHombre, valor_mujer: valorMujer })
        .eq('id', id);
      if (error) throw error;
      await get().fetchParametros();
    } catch (err) {
      console.error('Error updateParametro', err);
      throw err;
    }
  },

  fetchCondiciones: async () => {
    try {
      const { data, error } = await supabase
        .from('condiciones_clinicas')
        .select('*')
        .order('categoria')
        .order('nombre');
      if (error) throw error;
      const condiciones: CondicionClinicaDetalle[] = (data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria as CategoriaCondicion,
      }));
      set({ condiciones });
    } catch (err) {
      console.error('Error fetchCondiciones', err);
    }
  },

  addCondicion: async (nombre, categoria) => {
    try {
      const { error } = await supabase
        .from('condiciones_clinicas')
        .insert({ nombre, categoria });
      if (error) throw error;
      await get().fetchCondiciones();
    } catch (err) {
      console.error('Error addCondicion', err);
      throw err;
    }
  },

  updateCondicionCategoria: async (id, categoria) => {
    try {
      const { error } = await supabase
        .from('condiciones_clinicas')
        .update({ categoria })
        .eq('id', id);
      if (error) throw error;
      await get().fetchCondiciones();
    } catch (err) {
      console.error('Error updateCondicionCategoria', err);
      throw err;
    }
  },

  removeCondicion: async (id) => {
    try {
      const { error } = await supabase
        .from('condiciones_clinicas')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await get().fetchCondiciones();
    } catch (err) {
      console.error('Error removeCondicion', err);
      throw err;
    }
  },
}));
