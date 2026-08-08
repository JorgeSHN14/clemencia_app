import React, { useState } from 'react';
import { CalendarDays, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import type { Receta } from '@/types';
import { RecipeDetailView } from '@/components/recipe/RecipeDetailView';

type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
type TipoComida = 'Desayuno' | 'Almuerzo' | 'Cena';

interface MenuPlan {
  id: string;
  dia: DiaSemana;
  tipo: TipoComida;
  receta: Receta;
}

// Generamos un menú semanal
const dias: DiaSemana[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const Menus: React.FC = () => {
  const [diaActivo, setDiaActivo] = useState<DiaSemana>('Lunes');
  const [selectedMenu, setSelectedMenu] = useState<MenuPlan | null>(null);
  
  const inventoryItems = useInventoryStore((state) => state.items);
  const recetas = useRecipeStore((state) => state.recipes);

  const menusBase = React.useMemo(() => {
    if (recetas.length === 0) return [];
    const plan: MenuPlan[] = [];
    let rIdx = 0;
    
    for (const dia of dias) {
      for (const tipo of ['Desayuno', 'Almuerzo', 'Cena'] as TipoComida[]) {
        plan.push({
          id: `m-${dia}-${tipo}`,
          dia,
          tipo,
          receta: recetas[rIdx % recetas.length]
        });
        rIdx++;
      }
    }
    return plan;
  }, [recetas]);

  // Verificación flexible de stock
  const verificarStock = (ingrediente: string) => {
    return inventoryItems.some(item => 
      item.nombre.toLowerCase().includes(ingrediente.toLowerCase()) && item.cantidadTotal > 0
    );
  };

  const menusDelDia = menusBase.filter(m => m.dia === diaActivo);

  return (
    <div className="space-y-6 pb-6 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <CalendarDays size={32} />
            Planificador de Menús
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Supervisión de dietas diarias con análisis nutricional y sugerencias de intercambios automáticas.
          </p>
        </div>
      </header>

      {/* Días de la semana (Pills) */}
      <section>
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {dias.map(d => (
            <button
              key={d}
              onClick={() => setDiaActivo(d)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                diaActivo === d
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Listado de Comidas del Día */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menusDelDia.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">No hay menús planificados para este día.</p>
          </div>
        ) : (
          menusDelDia.map(menu => {
            const faltantes = menu.receta.ingredientes.filter(ing => !verificarStock(ing.nombre));
            const stockCompleto = faltantes.length === 0;

            return (
              <div 
                key={menu.id} 
                onClick={() => setSelectedMenu(menu)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 relative overflow-hidden transition-all hover:shadow-md cursor-pointer group"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${stockCompleto ? 'bg-emerald-500' : 'bg-orange-400'}`}></div>
                
                <div className="pl-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {menu.tipo}
                    </span>
                    {stockCompleto ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={12} /> Stock Completo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        <AlertTriangle size={12} /> Faltan ingredientes
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">{menu.receta.titulo}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>🔥 {menu.receta.calorias} kcal</span>
                    <span>🥩 {menu.receta.proteinas}g Prot</span>
                  </p>
                </div>

                <div className="pl-2 pt-3 flex items-center text-xs font-semibold text-emerald-600 group-hover:underline">
                  Ver detalle completo <ChevronRight size={14} className="ml-1" />
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Vista de Detalle de Receta a Pantalla Completa */}
      {selectedMenu && (
        <RecipeDetailView 
          recipe={selectedMenu.receta}
          context={`${selectedMenu.dia} • ${selectedMenu.tipo}`}
          onClose={() => setSelectedMenu(null)}
        />
      )}
    </div>
  );
};
