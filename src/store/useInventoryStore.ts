import { create } from 'zustand';
import type { Alimento, Lote } from '@/types';
import { supabase } from '@/lib/supabase';

interface InventoryState {
  items: Alimento[];
  isLoading: boolean;
  fetchInventory: () => Promise<void>;
  registrarEntrada: (
    nombre: string, cantidad: number, unidad: string, categoria: string, 
    fechaIngreso: string, fechaVencimiento?: string
  ) => Promise<void>;
  registrarConsumo: (id: string, cantidadA_Consumir: number, motivo?: string) => Promise<void>;
  registrarAjuste: (alimentoId: string, loteId: string, nuevaCantidad: number, motivo: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  getExpiringItems: () => { alimento: Alimento, lote: Lote, daysLeft: number }[];
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchInventory: async () => {
    set({ isLoading: true });
    try {
      const { data: alimentosData, error: err1 } = await supabase.from('alimentos').select('*');
      const { data: lotesData, error: err2 } = await supabase.from('lotes').select('*');
      const { data: movsData, error: err3 } = await supabase.from('movimientos_inventario').select('*').order('fecha', { ascending: false });

      if (err1 || err2 || err3) throw new Error('Error fetching inventory');

      const items = (alimentosData || []).map((alimento: any) => {
        const lotes = (lotesData || []).filter((l: any) => l.alimento_id === alimento.id).map((l: any) => ({
          id: l.id,
          fechaIngreso: l.fecha_ingreso,
          fechaVencimiento: l.fecha_vencimiento,
          cantidadOriginal: Number(l.cantidad_original),
          cantidadRestante: Number(l.cantidad_restante)
        }));

        const movimientos = (movsData || []).filter((m: any) => m.alimento_id === alimento.id).map((m: any) => ({
          id: m.id,
          fecha: m.fecha,
          tipo: m.tipo,
          cantidad: Number(m.cantidad),
          loteId: m.lote_id,
          motivo: m.motivo
        }));

        // Calculamos el stock real sumando la cantidad restante de todos los lotes
        // Esto previene desfases si la base de datos fue modificada por scripts externos
        const stockReal = lotes.reduce((acc, lote) => acc + lote.cantidadRestante, 0);

        return {
          id: alimento.id,
          nombre: alimento.nombre,
          cantidadTotal: stockReal,
          unidad: alimento.unidad as any,
          categoria: alimento.categoria as any,
          caloriasPor100g: alimento.calorias_por_100g,
          proteinasPor100g: alimento.proteinas_por_100g,
          grasasPor100g: alimento.grasas_por_100g,
          carbohidratosPor100g: alimento.carbohidratos_por_100g,
          lotes,
          movimientos
        };
      });

      set({ items, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  registrarEntrada: async (nombre, cantidad, unidad, categoria, fechaIngreso, fechaVencimiento) => {
    try {
      const { items } = get();
      const existing = items.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
      
      let alimentoId = existing?.id;

      if (!existing) {
        const { data: newAlimento, error: errAlimento } = await supabase
          .from('alimentos')
          .insert({
            nombre,
            cantidad_total: cantidad,
            unidad,
            categoria
          })
          .select()
          .single();
        if (errAlimento) throw errAlimento;
        alimentoId = newAlimento.id;
      } else {
        const { error: errUpdate } = await supabase
          .from('alimentos')
          .update({ cantidad_total: existing.cantidadTotal + cantidad })
          .eq('id', existing.id);
        if (errUpdate) throw errUpdate;
      }

      const { data: newLote, error: errLote } = await supabase
        .from('lotes')
        .insert({
          alimento_id: alimentoId,
          fecha_ingreso: fechaIngreso,
          fecha_vencimiento: fechaVencimiento || null,
          cantidad_original: cantidad,
          cantidad_restante: cantidad
        })
        .select()
        .single();
      if (errLote) throw errLote;

      await supabase.from('movimientos_inventario').insert({
        alimento_id: alimentoId,
        tipo: 'ENTRADA',
        cantidad,
        lote_id: newLote.id,
        motivo: 'Ingreso de bodega'
      });

      await get().fetchInventory();
    } catch (error) {
      console.error('Error registrarEntrada', error);
      throw error;
    }
  },

  registrarConsumo: async (id, cantidadA_Consumir, motivo = 'Consumo de Cocina') => {
    try {
      const { items } = get();
      const item = items.find(i => i.id === id);
      if (!item) throw new Error('Item no encontrado');
      if (item.cantidadTotal < cantidadA_Consumir) throw new Error('Stock insuficiente');

      let lotesActivos = item.lotes.filter(l => l.cantidadRestante > 0).sort((a, b) => {
        if (a.fechaVencimiento && b.fechaVencimiento) {
          return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
        }
        if (a.fechaVencimiento) return -1;
        if (b.fechaVencimiento) return 1;
        return new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
      });

      let restantePorConsumir = cantidadA_Consumir;
      const lotesAActualizar = [];

      for (const lote of lotesActivos) {
        if (restantePorConsumir <= 0) break;
        const descontar = Math.min(lote.cantidadRestante, restantePorConsumir);
        lotesAActualizar.push({ id: lote.id, nuevaCantidad: lote.cantidadRestante - descontar });
        restantePorConsumir -= descontar;
      }

      // Update Supabase
      for (const l of lotesAActualizar) {
        await supabase.from('lotes').update({ cantidad_restante: l.nuevaCantidad }).eq('id', l.id);
      }

      await supabase.from('alimentos').update({ cantidad_total: item.cantidadTotal - cantidadA_Consumir }).eq('id', id);

      await supabase.from('movimientos_inventario').insert({
        alimento_id: id,
        tipo: 'SALIDA',
        cantidad: cantidadA_Consumir,
        motivo
      });

      await get().fetchInventory();
    } catch (error) {
      console.error('Error registrarConsumo', error);
      throw error;
    }
  },

  registrarAjuste: async (alimentoId, loteId, nuevaCantidad, motivo) => {
    try {
      const { items } = get();
      const item = items.find(i => i.id === alimentoId);
      const lote = item?.lotes.find(l => l.id === loteId);
      if (!item || !lote) throw new Error('Item/Lote no encontrado');

      const diferencia = nuevaCantidad - lote.cantidadRestante;
      if (diferencia === 0) return;

      await supabase.from('lotes').update({ cantidad_restante: nuevaCantidad }).eq('id', loteId);
      await supabase.from('alimentos').update({ cantidad_total: item.cantidadTotal + diferencia }).eq('id', alimentoId);
      
      await supabase.from('movimientos_inventario').insert({
        alimento_id: alimentoId,
        tipo: 'AJUSTE',
        cantidad: diferencia,
        lote_id: loteId,
        motivo
      });

      await get().fetchInventory();
    } catch (error) {
      console.error('Error registrarAjuste', error);
      throw error;
    }
  },

  removeItem: async (id) => {
    try {
      // Due to CASCADE delete, removing alimento removes lotes and movimientos
      await supabase.from('alimentos').delete().eq('id', id);
      await get().fetchInventory();
    } catch (error) {
      console.error('Error removeItem', error);
      throw error;
    }
  },

  getExpiringItems: () => {
    const expiring: { alimento: Alimento, lote: Lote, daysLeft: number }[] = [];
    const now = new Date().getTime();
    
    get().items.forEach(item => {
      item.lotes.forEach(lote => {
        if (lote.cantidadRestante > 0 && lote.fechaVencimiento) {
          const daysLeft = Math.ceil((new Date(lote.fechaVencimiento).getTime() - now) / (1000 * 3600 * 24));
          if (daysLeft <= 7 && daysLeft >= 0) {
            expiring.push({ alimento: item, lote, daysLeft });
          }
        }
      });
    });
    return expiring;
  }
}));
