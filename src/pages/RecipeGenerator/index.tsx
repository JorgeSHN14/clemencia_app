import React, { useState, useMemo } from 'react';
import { Bot, Sparkles, Plus, X, ArrowLeft, Utensils, Search, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { generarRecetaIA } from '@/services/aiService';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import type { CondicionClinica, Receta } from '@/types';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeSkeletonLoader } from '@/components/recipe/RecipeSkeletonLoader';
import { RecipeDetailView } from '@/components/recipe/RecipeDetailView';

const patologiasDisponibles: CondicionClinica[] = [
  'Diabetes', 'Hipertensión', 'Dieta blanda', 
  'Postoperatoria', 'Nutrición enteral', 'Desnutrición', 'Disfagia', 'Enfermedad Renal'
];

export const RecipeGenerator: React.FC = () => {
  const inventoryItems = useInventoryStore(state => state.items);
  const { recipes, addGeneratedRecipe, removeRecipe } = useRecipeStore();
  
  // Navigation States
  const [activeView, setActiveView] = useState<'recetario' | 'generador'>('recetario');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Receta | null>(null); // Receta recién generada
  const [viewingRecipe, setViewingRecipe] = useState<Receta | null>(null); // Receta vista desde el grid

  // Generator States
  const [ingredientesCarrito, setIngredientesCarrito] = useState<string[]>([]);
  const [patologiasSeleccionadas, setPatologiasSeleccionadas] = useState<CondicionClinica[]>([]);
  const [customIngrediente, setCustomIngrediente] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState<'todas' | 'base' | 'ia'>('todas');
  const [filtroApto, setFiltroApto] = useState<CondicionClinica | 'Todas'>('Todas');

  // Funciones Generador
  const togglePatologia = (p: CondicionClinica) => {
    setPatologiasSeleccionadas(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };
  const addIngredienteToCart = (nombre: string) => {
    if (!ingredientesCarrito.includes(nombre)) setIngredientesCarrito(prev => [...prev, nombre]);
  };
  const addCustomIngrediente = () => {
    if (customIngrediente.trim() && !ingredientesCarrito.includes(`Usar ${customIngrediente}`)) {
      setIngredientesCarrito(prev => [...prev, `Usar ${customIngrediente}`]);
      setCustomIngrediente('');
    }
  };
  const removeIngrediente = (nombre: string) => setIngredientesCarrito(prev => prev.filter(i => i !== nombre));

  const handleGenerate = async () => {
    if (ingredientesCarrito.length === 0) return toast.error('Agrega al menos un ingrediente al carrito.');
    setLoading(true);
    setRecipe(null);
    try {
      const result = await generarRecetaIA({
        inventarioDisponible: ingredientesCarrito,
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
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        isActive 
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
              <label className="block text-sm font-black text-emerald-800 mb-4 uppercase tracking-wider">
                2. Añadir Ingredientes al Carrito
              </label>
              
              <div className="flex gap-2 mb-4">
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      const item = inventoryItems.find(i => i.nombre === e.target.value);
                      let infoNutricional = '';
                      if (item && item.caloriasPor100g !== undefined) {
                        infoNutricional = ` (${item.caloriasPor100g}kcal, ${item.proteinasPor100g}g Prot, ${item.carbohidratosPor100g}g Carb por 100g)`;
                      }
                      addIngredienteToCart(`${e.target.value}${infoNutricional}`);
                    }
                    e.target.value = "";
                  }}
                  className="flex-1 border-2 border-gray-100 rounded-xl p-3 text-sm text-gray-800 bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">Seleccionar del Inventario...</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.nombre}>{item.nombre} ({item.cantidadTotal} {item.unidad})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 mb-6">
                <input 
                  type="text"
                  value={customIngrediente}
                  onChange={e => setCustomIngrediente(e.target.value)}
                  placeholder="Escribir un ingrediente externo..."
                  className="flex-1 border-2 border-gray-100 rounded-xl p-3 text-sm text-gray-800 bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  onKeyDown={e => e.key === 'Enter' && addCustomIngrediente()}
                />
                <button 
                  onClick={addCustomIngrediente}
                  className="bg-gray-800 text-white p-3 rounded-xl hover:bg-gray-700 transition-all shadow-sm active:scale-95 flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Carrito Visual */}
              <div className="min-h-[120px] border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50">
                {ingredientesCarrito.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 mt-4">
                    <Utensils size={24} className="opacity-50" />
                    <p className="text-sm font-medium">Tu carrito de ingredientes está vacío</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ingredientesCarrito.map((ing, idx) => (
                      <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2">
                        {ing}
                        <button onClick={() => removeIngrediente(ing)} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded-md">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
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
                Llena tu carrito con ingredientes y la IA diseñará una receta clínica perfecta, calculando los macros y respetando las patologías seleccionadas.
              </p>
              
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
