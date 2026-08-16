import React from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, Activity, Info, Sparkles, Save, RotateCcw } from 'lucide-react';
import type { Receta } from '@/types';
import { useInventoryStore } from '@/store/useInventoryStore';
import exchangesData from '@/data/exchanges.json';

interface RecipeDetailViewProps {
  recipe: Receta;
  context: string; // Ej: 'Lunes • Desayuno' o 'Generado con IA'
  onClose: () => void;
  onSave?: () => void;
  onRegenerate?: () => void;
  loading?: boolean;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ 
  recipe, 
  context, 
  onClose, 
  onSave, 
  onRegenerate,
  loading = false
}) => {
  const inventoryItems = useInventoryStore((state) => state.items);
  const [escaladoPorciones, setEscaladoPorciones] = React.useState(recipe.porciones);

  const multiplier = escaladoPorciones / (recipe.porciones || 1);

  const verificarStock = (ing: any, requiredQuantity: number) => {
    if (ing.esExtra) return { hasStock: false, isExtra: true, stockTotal: 0, unidad: ing.unidad };
    
    const itemDb = ing.id_inventario 
      ? inventoryItems.find(i => i.id === ing.id_inventario)
      : inventoryItems.find(i => i.nombre.toLowerCase().includes(ing.nombre.toLowerCase()));

    if (!itemDb) return { hasStock: false, isExtra: false, stockTotal: 0, unidad: ing.unidad };

    return {
      hasStock: itemDb.cantidadTotal >= requiredQuantity,
      isExtra: false,
      stockTotal: itemDb.cantidadTotal,
      unidad: itemDb.unidad
    };
  };

  const buscarAlternativas = (ingrediente: string) => {
    const original = exchangesData.find(e => ingrediente.toLowerCase().includes(e.nombre.toLowerCase()));
    if (!original) return [];
    return exchangesData.filter(e => e.grupo === original.grupo && e.nombre !== original.nombre);
  };

  return (
    <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col min-h-[100dvh] overflow-hidden animate-fade-in-up">
      {/* Header Fijo */}
      <header className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-xl transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md uppercase tracking-wider mb-1">
              {context}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight leading-none">
              {recipe.titulo}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          {onRegenerate && (
            <button 
              onClick={onRegenerate}
              disabled={loading}
              className="px-4 py-2 bg-white border-2 border-emerald-100 hover:border-emerald-300 text-emerald-700 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCcw size={18} />
              <span className="hidden md:inline">Regenerar</span>
            </button>
          )}
          {onSave && (
            <button 
              onClick={onSave}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={18} />
              <span className="hidden md:inline">Guardar Receta</span>
            </button>
          )}
        </div>
      </header>

      {/* Contenido Scrolleable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Ingredientes (Toma 5 columnas en Desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  <Info size={24} className="text-emerald-500" />
                  Ingredientes Requeridos
                </h3>
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase px-2">Pacientes/Porciones:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={escaladoPorciones}
                    onChange={(e) => setEscaladoPorciones(parseInt(e.target.value) || 1)}
                    className="w-16 bg-white px-2 py-1 rounded-lg font-black text-emerald-700 text-center outline-none border border-gray-200"
                  />
                </div>
              </div>
              <ul className="space-y-4">
                {recipe.ingredientes.map((ing, i) => {
                  const requiredQuantity = Number((ing.cantidad * multiplier).toFixed(1));
                  const stockInfo = verificarStock(ing, requiredQuantity);
                  const alternativas = buscarAlternativas(ing.nombre);

                  const ingCalorias = ing.calorias !== undefined ? Math.round(ing.calorias * multiplier) : undefined;
                  const ingProteinas = ing.proteinas !== undefined ? Number((ing.proteinas * multiplier).toFixed(1)) : undefined;
                  const ingCarbos = ing.carbohidratos !== undefined ? Number((ing.carbohidratos * multiplier).toFixed(1)) : undefined;
                  const ingGrasas = ing.grasas !== undefined ? Number((ing.grasas * multiplier).toFixed(1)) : undefined;

                  return (
                    <li key={i} className="group relative">
                      <div className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-2xl p-4 transition-colors group-hover:bg-emerald-50/50">
                        <span className="font-bold text-gray-800 text-lg">{ing.nombre}</span>
                        <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">
                          {requiredQuantity} {ing.unidad}
                        </span>
                      </div>
                      
                      {(ingCalorias !== undefined) && (
                        <div className="mt-1.5 flex justify-between bg-white px-4 py-2 border border-emerald-100/50 rounded-xl text-[11px] font-bold text-gray-500 shadow-sm">
                          <span className="text-orange-500">🔥 {ingCalorias} kcal</span>
                          <span className="text-blue-500">P: {ingProteinas}g</span>
                          <span className="text-yellow-600">C: {ingCarbos}g</span>
                          <span className="text-red-500">G: {ingGrasas}g</span>
                        </div>
                      )}
                      
                      {stockInfo.isExtra ? (
                        <div className="text-[11px] font-black uppercase tracking-wide text-blue-600 flex items-center gap-1 mt-2 ml-2 bg-blue-50 px-3 py-1.5 rounded-lg inline-flex">
                          <Info size={14} /> Adquirir Externamente
                        </div>
                      ) : stockInfo.hasStock ? (
                        <div className="text-[11px] font-black uppercase tracking-wide text-emerald-600 flex items-center gap-1 mt-2 ml-2">
                          <CheckCircle2 size={14} /> En Inventario (Stock: {stockInfo.stockTotal} {stockInfo.unidad})
                        </div>
                      ) : (
                        <div className="mt-2 ml-2 p-3 bg-orange-50 rounded-xl border border-orange-100/50">
                          <div className="text-[11px] font-black uppercase tracking-wide text-orange-600 flex items-center gap-1 mb-2">
                            <AlertTriangle size={14} /> Falta stock (Disponible: {stockInfo.stockTotal} {stockInfo.unidad})
                          </div>
                          {alternativas.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {alternativas.map((alt, idx) => (
                                <span key={idx} className="bg-white border border-orange-200 text-orange-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                  {alt.nombre} <span className="opacity-50 ml-1">({alt.porcionesEquivalentes})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-orange-800">No hay alternativas exactas. Considere reabastecer.</span>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {recipe.aptoPara && recipe.aptoPara.length > 0 && recipe.aptoPara[0] !== 'Ninguna' && (
              <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                <h3 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">Certificaciones Clínicas</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.aptoPara.map((apto, idx) => (
                    <span key={idx} className="bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-blue-100">
                      {apto}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Nutrición y Procedimiento (Toma 7 columnas en Desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tarjetas de Nutrición */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-6">
                <Activity size={24} className="text-emerald-500" />
                Análisis Nutricional
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 rounded-2xl text-center border border-emerald-100/50">
                  <p className="text-[10px] uppercase font-black text-emerald-600 mb-1 tracking-widest">Calorías Totales</p>
                  <p className="text-3xl md:text-4xl font-black text-emerald-900">{Math.round(recipe.calorias * multiplier)}<span className="text-sm font-bold opacity-50 ml-1">kcal</span></p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl text-center border border-blue-100/50">
                  <p className="text-[10px] uppercase font-black text-blue-600 mb-1 tracking-widest">Proteínas</p>
                  <p className="text-3xl md:text-4xl font-black text-blue-900">{Number((recipe.proteinas * multiplier).toFixed(1))}<span className="text-sm font-bold opacity-50 ml-1">g</span></p>
                </div>
                
                {recipe.carbohidratos !== undefined ? (
                  <>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-5 rounded-2xl text-center border border-yellow-100/50">
                      <p className="text-[10px] uppercase font-black text-yellow-600 mb-1 tracking-widest">Carbohidratos</p>
                      <p className="text-3xl md:text-4xl font-black text-yellow-900">{Number((recipe.carbohidratos * multiplier).toFixed(1))}<span className="text-sm font-bold opacity-50 ml-1">g</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-5 rounded-2xl text-center border border-red-100/50">
                      <p className="text-[10px] uppercase font-black text-red-600 mb-1 tracking-widest">Grasas</p>
                      <p className="text-3xl md:text-4xl font-black text-red-900">{Number((recipe.grasas! * multiplier).toFixed(1))}<span className="text-sm font-bold opacity-50 ml-1">g</span></p>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-2xl text-center border border-purple-100/50 md:col-span-2 col-span-2">
                    <p className="text-[10px] uppercase font-black text-purple-600 mb-1 tracking-widest">Rendimiento</p>
                    <p className="text-3xl md:text-4xl font-black text-purple-900">{escaladoPorciones}<span className="text-sm font-bold opacity-50 ml-1">platos</span></p>
                  </div>
                )}
                
                {recipe.carbohidratos !== undefined && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 rounded-2xl text-center border border-purple-100/50 md:col-span-4 col-span-2 flex items-center justify-center gap-3">
                    <p className="text-[10px] uppercase font-black text-purple-600 tracking-widest">Rendimiento estimado:</p>
                    <p className="text-2xl font-black text-purple-900">{escaladoPorciones}<span className="text-sm font-bold opacity-50 ml-1">platos</span></p>
                  </div>
                )}
              </div>

              {recipe.macros && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Distribución de Macronutrientes</p>
                  <div className="w-full h-6 rounded-full overflow-hidden flex shadow-inner">
                    <div style={{ width: `${recipe.macros.carbohidratosPorcentaje}%` }} className="bg-yellow-400 h-full transition-all duration-1000" title={`Carbohidratos ${recipe.macros.carbohidratosPorcentaje}%`}></div>
                    <div style={{ width: `${recipe.macros.proteinasPorcentaje}%` }} className="bg-blue-400 h-full transition-all duration-1000" title={`Proteínas ${recipe.macros.proteinasPorcentaje}%`}></div>
                    <div style={{ width: `${recipe.macros.grasasPorcentaje}%` }} className="bg-red-400 h-full transition-all duration-1000" title={`Grasas ${recipe.macros.grasasPorcentaje}%`}></div>
                  </div>
                  <div className="flex justify-between mt-3 text-xs font-black">
                    <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">Carbs {recipe.macros.carbohidratosPorcentaje}%</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Prot {recipe.macros.proteinasPorcentaje}%</span>
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg">Grasas {recipe.macros.grasasPorcentaje}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Procedimiento */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-6">
                <Sparkles size={24} className="text-emerald-500" />
                Procedimiento de Preparación
              </h3>
              <div className="space-y-4">
                {recipe.procedimiento.map((paso, idx) => (
                  <div key={idx} className="flex gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:bg-white hover:border-emerald-200 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center border-4 border-white shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div className="pt-2">
                      <p className="text-[15px] text-gray-700 leading-relaxed font-medium">{paso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
