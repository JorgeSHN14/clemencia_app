import { create } from 'zustand';
import type { Receta } from '@/types';
import { supabase } from '@/lib/supabase';

interface RecipeStoreState {
  recipes: Receta[];
  isLoading: boolean;
  fetchRecipes: () => Promise<void>;
  addGeneratedRecipe: (recipe: Omit<Receta, 'id'>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeStoreState>((set, get) => ({
  recipes: [],
  isLoading: false,

  fetchRecipes: async () => {
    set({ isLoading: true });
    try {
      const { data: recetasData, error: errRecetas } = await supabase.from('recetas').select('*');
      const { data: ingredientesData, error: errIngredientes } = await supabase.from('ingredientes_receta').select('*');

      if (errRecetas || errIngredientes) throw new Error('Error fetching recipes');

      const recipes: Receta[] = (recetasData || []).map((r: any) => {
        const ingredientes = (ingredientesData || []).filter((i: any) => i.receta_id === r.id).map((i: any) => ({
          nombre: i.nombre,
          cantidad: Number(i.cantidad),
          unidad: i.unidad,
          sustitutoSugerido: i.sustituto_sugerido
        }));

        return {
          id: r.id,
          titulo: r.titulo,
          ingredientes,
          procedimiento: r.procedimiento,
          porciones: Number(r.porciones),
          calorias: Number(r.calorias),
          proteinas: Number(r.proteinas),
          macros: r.macros_proteinas_porcentaje ? {
            proteinasPorcentaje: Number(r.macros_proteinas_porcentaje),
            carbohidratosPorcentaje: Number(r.macros_carbohidratos_porcentaje),
            grasasPorcentaje: Number(r.macros_grasas_porcentaje)
          } : undefined,
          aptoPara: r.apto_para,
          imagenUrl: r.imagen_url,
          es_generada: r.es_generada
        } as Receta & { es_generada?: boolean };
      });

      set({ recipes, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  addGeneratedRecipe: async (recipe) => {
    try {
      const { data: newRecipe, error: errRecipe } = await supabase
        .from('recetas')
        .insert({
          titulo: recipe.titulo,
          procedimiento: recipe.procedimiento,
          porciones: recipe.porciones,
          calorias: recipe.calorias,
          proteinas: recipe.proteinas,
          macros_proteinas_porcentaje: recipe.macros?.proteinasPorcentaje,
          macros_carbohidratos_porcentaje: recipe.macros?.carbohidratosPorcentaje,
          macros_grasas_porcentaje: recipe.macros?.grasasPorcentaje,
          apto_para: recipe.aptoPara,
          imagen_url: recipe.imagenUrl,
          es_generada: true
        })
        .select()
        .single();
      
      if (errRecipe) throw errRecipe;

      const ingredientesToInsert = recipe.ingredientes.map(ing => ({
        receta_id: newRecipe.id,
        nombre: ing.nombre,
        cantidad: ing.cantidad,
        unidad: ing.unidad,
        sustituto_sugerido: ing.sustitutoSugerido
      }));

      const { error: errIng } = await supabase.from('ingredientes_receta').insert(ingredientesToInsert);
      if (errIng) throw errIng;

      await get().fetchRecipes();
    } catch (error) {
      console.error('Error addGeneratedRecipe', error);
      throw error;
    }
  },

  removeRecipe: async (id) => {
    try {
      await supabase.from('recetas').delete().eq('id', id);
      await get().fetchRecipes();
    } catch (error) {
      console.error('Error removeRecipe', error);
      throw error;
    }
  }
}));
