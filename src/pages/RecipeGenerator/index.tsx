import React, { useState, useMemo } from 'react';
import { Bot, Sparkles, X, ArrowLeft, Utensils, Search, Filter, Trash2, Zap, Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { generarRecetaIA } from '@/services/aiService';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import type { CondicionClinica, Receta, Alimento } from '@/types';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeSkeletonLoader } from '@/components/recipe/RecipeSkeletonLoader';
import { RecipeDetailView } from '@/components/recipe/RecipeDetailView';

const patologiasDisponibles: CondicionClinica[] = [
  'Diabetes', 'Hipertensión', 'Dieta blanda',
  'Postoperatoria', 'Nutrición enteral', 'Desnutrición', 'Disfagia', 'Enfermedad Renal'
];

// Color mapping for food groups (consistent with TransactionModal)
const GRUPO_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Cereales, tubérculos y plátanos': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  'Frutas': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-400' },
  'Vegetales': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-400' },
  'Leguminosas': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-400' },
  'Carnes y embutidos': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
  'Pescados y mariscos': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  'Grasas y frutos secos': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  'Azucares': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
  'Snacks': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  'Alimentos expresados en 100 ml': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
  'Lacteos': { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-400' },
};

const DEFAULT_COLORS = { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };

export const RecipeGenerator: React.FC = () => {
  const inventoryItems = useInventoryStore(state => state.items);
  const { recipes, addGeneratedRecipe, removeRecipe } = useRecipeStore();

  // Navigation States
  const [activeView, setActiveView] = useState<'recetario' | 'generador'>('recetario');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Receta | null>(null); // Receta recién generada
  const [viewingRecipe, setViewingRecipe] = useState<Receta | null>(null); // Receta vista desde el grid

  // Generator States
  const [ingredientesCarrito, setIngredientesCarrito] = useState<Alimento[]>([]);
  const [patologiasSeleccionadas, setPatologiasSeleccionadas] = useState<CondicionClinica[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [grupoFilter, setGrupoFilter] = useState<string>('Todos');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState<'todas' | 'base' | 'ia'>('todas');
  const [filtroApto, setFiltroApto] = useState<CondicionClinica | 'Todas'>('Todas');

  // Unique groups from inventory items
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    inventoryItems.forEach(item => {
      if (item.grupoAlimento) groups.add(item.grupoAlimento);
    });
    return Array.from(groups);
  }, [inventoryItems]);

  // Filtered inventory items for selection
  const filteredInventoryItems = useMemo(() => {
    let filtered = inventoryItems.filter(i => i.cantidadTotal > 0);

    if (ingredientSearch.trim()) {
      const lower = ingredientSearch.toLowerCase();
      filtered = filtered.filter(i => i.nombre.toLowerCase().includes(lower));
    }

    if (grupoFilter !== 'Todos') {
      filtered = filtered.filter(i => i.grupoAlimento === grupoFilter);
    }

    return filtered;
  }, [inventoryItems, ingredientSearch, grupoFilter]);

  // Funciones Generador
  const togglePatologia = (p: CondicionClinica) => {
    setPatologiasSeleccionadas(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const addIngredienteToCart = (item: Alimento) => {
    if (!ingredientesCarrito.find(i => i.id === item.id)) {
      setIngredientesCarrito(prev => [...prev, item]);
    } else {
      toast('Ya está en tu carrito', { icon: '📋' });
    }
  };

  const removeIngrediente = (id: string) => setIngredientesCarrito(prev => prev.filter(i => i.id !== id));

  const handleGenerate = async () => {
    if (ingredientesCarrito.length === 0) return toast.error('Agrega al menos un ingrediente al carrito.');
    setLoading(true);
    setRecipe(null);
    try {
      // Build enriched ingredient list with nutritional info
      const ingredientesConInfo = ingredientesCarrito.map(item => {
        let info = item.nombre;
        if (item.caloriasPor100g !== undefined) {
          info += ` (${item.caloriasPor100g}kcal, ${item.proteinasPor100g ?? 0}g Prot, ${item.carbohidratosPor100g ?? 0}g Carb, ${item.grasasPor100g ?? 0}g Grasa por 100${item.unidad === 'ml' ? 'ml' : 'g'})`;
        }
        return info;
      });

      const result = await generarRecetaIA({
        inventarioDisponible: ingredientesConInfo,
        patologias: patologiasSeleccionadas.length > 0 ? patologiasSeleccionadas : ['Ninguna'],
      });
      setRecipe(result);
      toast.success('¡Menú generado con éxito!');
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al conectar con la IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = () => {
    if (recipe) {
      addGeneratedRecipe(recipe);
      toast.success('Receta guardada en el Recetario.');
      setRecipe(null);
      setActiveView('recetario');
    }
  };

  const handleDeleteRecipe = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evitar abrir la receta
    removeRecipe(id);
    toast.success('Receta eliminada.');
  };

  // Filtrado de Recetas
  const allRecipes = useMemo(() => {
    let combined = [...recipes];

    // Filtro Búsqueda
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      combined = combined.filter(r =>
        r.titulo.toLowerCase().includes(lower) ||
        r.ingredientes.some(i => i.nombre.toLowerCase().includes(lower))
      );
    }

    // Filtro Origen
    if (filtroOrigen === 'base') combined = combined.filter(r => !(r as any).es_generada);
    if (filtroOrigen === 'ia') combined = combined.filter(r => (r as any).es_generada);

    // Filtro Patología
    if (filtroApto !== 'Todas') {
      combined = combined.filter(r => r.aptoPara.includes(filtroApto));
    }

    return combined;
  }, [recipes, searchTerm, filtroOrigen, filtroApto]);

  return (
    <div className="space-y-6 pb-6 animate-fade-in-up">
      {/* Encabezado General */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <Utensils size={32} />
            Recetario y Generador IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona la base de datos de recetas o crea nuevas con Inteligencia Artificial.
          </p>
        </div>

        {activeView === 'recetario' ? (
          <button
            onClick={() => setActiveView('generador')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 md:px-6 md:py-3 rounded-xl shadow-sm shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 font-bold"
          >
            <Sparkles size={20} />
            Generar Nueva Receta
          </button>
        ) : (
          <button
            onClick={() => setActiveView('recetario')}
            className="bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 p-3 md:px-6 md:py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 flex-shrink-0 font-bold"
          >
            <ArrowLeft size={20} />
            Volver al Recetario
          </button>
        )}
      </header>

      {/* VISTA RECETARIO (Grid y Filtros) */}
      {activeView === 'recetario' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por título o ingrediente (ej. Pollo)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={filtroOrigen}
                  onChange={e => setFiltroOrigen(e.target.value as any)}
                  className="w-full md:w-40 pl-9 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700 appearance-none"
                >
                  <option value="todas">Cualquier Origen</option>
                  <option value="base">Recetas Base</option>
                  <option value="ia">Generadas por IA</option>
                </select>
              </div>

              <select
                value={filtroApto}
                onChange={e => setFiltroApto(e.target.value as any)}
                className="flex-1 md:w-44 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700"
              >
                <option value="Todas">Apto para: Todas</option>
                {patologiasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Grid de Recetas */}
          {allRecipes.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg text-gray-500">No se encontraron recetas</p>
              <p className="text-sm">Intenta ajustar tus filtros de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allRecipes.map(r => {
                const isGenerated = !!(r as any).es_generada;
                return (
                  <div key={r.id} className="relative group cursor-pointer h-full" onClick={() => setViewingRecipe(r)}>
                    <div className="pointer-events-none h-full">
                      <RecipeCard recipe={r} isGenerated={isGenerated} />
                    </div>
                    {isGenerated && (
                      <button
                        onClick={(e) => handleDeleteRecipe(e, r.id)}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-red-100 text-red-500 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 hover:scale-105 shadow-sm"
                        title="Eliminar receta"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA GENERADOR DE IA */}
      {activeView === 'generador' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          {/* Configuración */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <label className="block text-sm font-black text-emerald-800 mb-4 uppercase tracking-wider">
                1. Selecciona Patologías Clínicas
              </label>
              <div className="flex flex-wrap gap-2">
                {patologiasDisponibles.map(p => {
                  const isActive = patologiasSeleccionadas.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePatologia(p)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${isActive
                          ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      {isActive && <CheckIcon />} {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <label className="block text-sm font-black text-emerald-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Package size={16} />
                2. Seleccionar Ingredientes del Inventario
              </label>

              {/* Search bar for ingredients */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={ingredientSearch}
                  onChange={e => setIngredientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 font-medium text-sm transition-all"
                  placeholder="Buscar ingrediente en el inventario..."
                />
              </div>

              {/* Group filter pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                <button
                  onClick={() => setGrupoFilter('Todos')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors ${grupoFilter === 'Todos' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  Todos ({inventoryItems.length})
                </button>
                {availableGroups.map(g => {
                  const count = inventoryItems.filter(i => i.grupoAlimento === g).length;
                  const colors = GRUPO_COLORS[g] || DEFAULT_COLORS;
                  return (
                    <button
                      key={g}
                      onClick={() => setGrupoFilter(g)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${grupoFilter === g
                          ? 'bg-gray-800 text-white'
                          : `${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80`
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${grupoFilter === g ? 'bg-white' : colors.dot}`}></span>
                      {g.length > 18 ? g.slice(0, 16) + '…' : g} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Ingredient grid */}
              <div className="max-h-[280px] overflow-y-auto pr-1 space-y-1.5">
                {filteredInventoryItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No hay ingredientes que coincidan en stock</p>
                  </div>
                ) : (
                  filteredInventoryItems.map(item => {
                    const isInCart = ingredientesCarrito.some(i => i.id === item.id);
                    const colors = GRUPO_COLORS[item.grupoAlimento || ''] || DEFAULT_COLORS;

                    return (
                      <button
                        key={item.id}
                        onClick={() => addIngredienteToCart(item)}
                        disabled={isInCart}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 group/item ${isInCart
                            ? 'border-emerald-200 bg-emerald-50/50 opacity-60 cursor-default'
                            : `border-gray-100 hover:${colors.border} hover:${colors.bg} hover:shadow-sm active:scale-[0.98]`
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Color dot indicator */}
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isInCart ? 'bg-emerald-400' : colors.dot}`}></span>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-gray-800 truncate">{item.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-gray-400">
                                {item.cantidadTotal > 0
                                  ? `${item.cantidadTotal} ${item.unidad}`
                                  : 'Sin stock'
                                }
                              </span>
                              {item.caloriasPor100g !== undefined && (
                                <span className="text-[10px] font-bold text-orange-500">
                                  {item.caloriasPor100g} kcal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isInCart ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Añadido</span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-gray-100 group-hover/item:bg-emerald-500 group-hover/item:text-white text-gray-400 flex items-center justify-center transition-all">
                              <Plus size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Carrito Visual */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Utensils size={12} /> Tu Carrito ({ingredientesCarrito.length} ingredientes)
                </p>
                <div className="min-h-[60px]">
                  {ingredientesCarrito.length === 0 ? (
                    <div className="flex items-center justify-center text-gray-300 gap-2 py-4">
                      <Utensils size={16} className="opacity-50" />
                      <p className="text-xs font-medium">Selecciona ingredientes de arriba</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ingredientesCarrito.map((item) => {
                        const colors = GRUPO_COLORS[item.grupoAlimento || ''] || DEFAULT_COLORS;
                        return (
                          <span
                            key={item.id}
                            className={`${colors.bg} border ${colors.border} ${colors.text} px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                            {item.nombre}
                            {item.caloriasPor100g !== undefined && (
                              <span className="opacity-50 text-[9px]">{item.caloriasPor100g}kcal</span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeIngrediente(item.id); }}
                              className="text-current opacity-40 hover:opacity-100 bg-black/5 p-0.5 rounded transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Área de Acción */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-emerald-50 to-white rounded-3xl p-8 border border-emerald-100 flex flex-col justify-center items-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50 mb-6 rotate-3">
                <Bot size={40} />
              </div>
              <h3 className="text-2xl font-black text-emerald-800 mb-3 tracking-tight">Motor de Inteligencia Artificial</h3>
              <p className="text-sm text-emerald-600 mb-8 max-w-sm leading-relaxed font-medium">
                Selecciona ingredientes de tu inventario y la IA diseñará una receta clínica perfecta, calculando los macros y respetando las patologías.
              </p>

              {/* Summary of selected ingredients */}
              {ingredientesCarrito.length > 0 && (
                <div className="w-full bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={10} /> Resumen Nutricional Estimado
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                      <p className="text-sm font-black text-orange-600">
                        {ingredientesCarrito.reduce((acc, i) => acc + (i.caloriasPor100g || 0), 0).toFixed(0)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400">kcal total</p>
                    </div>
                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                      <p className="text-sm font-black text-blue-600">
                        {ingredientesCarrito.reduce((acc, i) => acc + (i.proteinasPor100g || 0), 0).toFixed(1)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400">Prot (g)</p>
                    </div>
                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                      <p className="text-sm font-black text-yellow-600">
                        {ingredientesCarrito.reduce((acc, i) => acc + (i.carbohidratosPor100g || 0), 0).toFixed(1)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400">Carb (g)</p>
                    </div>
                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                      <p className="text-sm font-black text-red-500">
                        {ingredientesCarrito.reduce((acc, i) => acc + (i.grasasPor100g || 0), 0).toFixed(1)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400">Grasa (g)</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || ingredientesCarrito.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-black py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-3 shadow-emerald-500/30 shadow-xl text-lg group"
              >
                {loading ? (
                  <span className="animate-spin h-6 w-6 border-4 border-gray-900 border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                    Generar Menú Nutricional
                  </>
                )}
              </button>
            </div>

            {loading && <RecipeSkeletonLoader />}
          </div>
        </div>
      )}

      {/* VISTAS A PANTALLA COMPLETA */}
      {recipe && (
        <RecipeDetailView
          recipe={recipe}
          context="Recién Generado con IA ✨"
          onClose={() => setRecipe(null)}
          onSave={handleSaveRecipe}
          onRegenerate={() => { setRecipe(null); handleGenerate(); }}
          loading={loading}
        />
      )}

      {viewingRecipe && (
        <RecipeDetailView
          recipe={viewingRecipe}
          context={(viewingRecipe as any).es_generada ? "Receta Guardada (IA)" : "Receta de la Fundación"}
          onClose={() => setViewingRecipe(null)}
        />
      )}

    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
