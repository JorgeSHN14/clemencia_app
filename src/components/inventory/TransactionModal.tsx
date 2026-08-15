import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, ShoppingCart, Trash2, ArrowRight, PackagePlus, PackageMinus, Search, Zap, Calendar, RefreshCw } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useCaducidadStore } from '@/store/useCaducidadStore';
import { buscarEnCatalogo, catalogoAlimentos, gruposAlimentos } from '@/data/foodCatalog';
import type { AlimentoCatalogo } from '@/data/foodCatalog';
import {
  estimarFechaVencimiento,
  getDiasVidaUtil,
  convertirUnidad,
  sonUnidadesCompatibles,
  UNIDADES_CONVERTIBLES
} from '@/utils/caducidad';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  mode: 'ENTRADA' | 'SALIDA';
  onClose: () => void;
}

const unidades = ['kg', 'g', 'l', 'ml', 'unidades', 'tazas', 'cucharadas'];

// Color mapping for food groups
const GRUPO_COLORS: Record<string, string> = {
  'Cereales, tubérculos y plátanos': 'bg-amber-50 text-amber-700 border-amber-200',
  'Frutas': 'bg-pink-50 text-pink-700 border-pink-200',
  'Vegetales': 'bg-green-50 text-green-700 border-green-200',
  'Leguminosas': 'bg-orange-50 text-orange-700 border-orange-200',
  'Carnes y embutidos': 'bg-red-50 text-red-700 border-red-200',
  'Pescados y mariscos': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Grasas y frutos secos': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Azucares': 'bg-purple-50 text-purple-700 border-purple-200',
  'Snacks': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Alimentos expresados en 100 ml': 'bg-blue-50 text-blue-700 border-blue-200',
  'Lacteos': 'bg-sky-50 text-sky-700 border-sky-200',
};

export const TransactionModal: React.FC<TransactionModalProps> = ({ mode, onClose }) => {
  const items = useInventoryStore(state => state.items);
  const registrarEntrada = useInventoryStore(state => state.registrarEntrada);
  const registrarConsumo = useInventoryStore(state => state.registrarConsumo);

  const caducidadStore = useCaducidadStore();
  
  // Convert parametros to map for easy lookup
  const dynamicParamsMap = useMemo(() => {
    const map: Record<string, number> = {};
    caducidadStore.parametros.forEach(p => {
      map[p.grupo] = p.dias;
    });
    return map;
  }, [caducidadStore.parametros]);

  // Load params if not loaded
  useEffect(() => {
    caducidadStore.fetchParametros();
  }, []);

  const [cart, setCart] = useState<any[]>([]);

  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<AlimentoCatalogo | null>(null);
  const [grupoFilter, setGrupoFilter] = useState<string>('Todos');
  const searchRef = useRef<HTMLDivElement>(null);

  // Current Item Form
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('g');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [fechaEsEstimada, setFechaEsEstimada] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search results
  const searchResults = useMemo(() => {
    if (mode === 'SALIDA') {
      if (!searchQuery.trim()) return items.filter(i => i.cantidadTotal > 0);
      const lower = searchQuery.toLowerCase();
      return items.filter(i => i.nombre.toLowerCase().includes(lower) && i.cantidadTotal > 0);
    }
    if (!searchQuery.trim() && grupoFilter === 'Todos') return [];
    if (!searchQuery.trim() && grupoFilter !== 'Todos') {
      return catalogoAlimentos.filter(a => a.grupo === grupoFilter).slice(0, 30);
    }
    let results = buscarEnCatalogo(searchQuery, 50);
    if (grupoFilter !== 'Todos') {
      results = results.filter(a => a.grupo === grupoFilter);
    }
    return results;
  }, [searchQuery, grupoFilter, mode, items]);

  // Check if selected catalog item already exists in inventory
  const existingItem = selectedCatalogItem
    ? items.find(i => i.nombre.toLowerCase() === selectedCatalogItem.nombre.toLowerCase())
    : null;

  // Unidad base del producto (la del inventario o la del catálogo)
  const unidadBase: string = existingItem?.unidad ?? selectedCatalogItem?.unidadBase ?? 'g';

  // ¿Se puede convertir la unidad seleccionada a la base?
  const conversionValida = useMemo(() => {
    if (unidad === unidadBase) return true;
    return sonUnidadesCompatibles(unidad, unidadBase);
  }, [unidad, unidadBase]);

  // Cantidad convertida a unidad base
  const cantidadConvertida = useMemo(() => {
    const val = parseFloat(cantidad);
    if (isNaN(val) || val <= 0) return null;
    if (unidad === unidadBase) return val;
    return convertirUnidad(val, unidad, unidadBase);
  }, [cantidad, unidad, unidadBase]);

  // Unidades disponibles para el selector según la unidad base
  const unidadesDisponibles = useMemo(() => {
    if (!selectedCatalogItem && !existingItem) return unidades;
    if (UNIDADES_CONVERTIBLES.includes(unidadBase)) {
      // Solo mostrar unidades del mismo grupo (masa o volumen) + la propia
      const grupo = ['kg', 'g'].includes(unidadBase) ? ['kg', 'g'] : ['l', 'ml'];
      return grupo;
    }
    // Para 'unidades', 'tazas', 'cucharadas' — solo la misma unidad
    return [unidadBase];
  }, [unidadBase, selectedCatalogItem, existingItem]);

  const handleSelectCatalogItem = (item: AlimentoCatalogo) => {
    setSelectedCatalogItem(item);
    setSearchQuery(item.nombre);
    setUnidad(item.unidadBase);
    setShowDropdown(false);
    // Estimar fecha de vencimiento
    if (item.grupo) {
      setFechaVencimiento(estimarFechaVencimiento(item.grupo, dynamicParamsMap));
      setFechaEsEstimada(true);
    }
  };

  const handleSelectInventoryItem = (item: any) => {
    const catalogData: AlimentoCatalogo = {
      nombre: item.nombre,
      grupo: item.grupoAlimento || '',
      categoria: item.categoria,
      energiaKcal: item.caloriasPor100g,
      proteinaG: item.proteinasPor100g,
      grasaTotalG: item.grasasPor100g,
      carbohidratosG: item.carbohidratosPor100g,
      unidadBase: item.unidad
    };
    setSelectedCatalogItem(catalogData);
    setSearchQuery(item.nombre);
    setUnidad(item.unidad);
    setShowDropdown(false);
    // Estimar fecha si tiene grupo
    if (item.grupoAlimento) {
      setFechaVencimiento(estimarFechaVencimiento(item.grupoAlimento, dynamicParamsMap));
      setFechaEsEstimada(true);
    }
  };

  const reestimateExpiry = () => {
    if (selectedCatalogItem?.grupo) {
      setFechaVencimiento(estimarFechaVencimiento(selectedCatalogItem.grupo, dynamicParamsMap));
      setFechaEsEstimada(true);
    }
  };

  const handleAddToCart = () => {
    if (!selectedCatalogItem) return toast.error('Selecciona un alimento del catálogo');
    if (!cantidad || Number(cantidad) <= 0) return toast.error('Cantidad inválida');

    if (mode === 'SALIDA') {
      const invItem = items.find(i => i.nombre.toLowerCase() === selectedCatalogItem.nombre.toLowerCase());
      if (!invItem) return toast.error('Producto no encontrado en inventario.');
      if (invItem.cantidadTotal < Number(cantidad)) {
        return toast.error(`Stock insuficiente. Solo tienes ${invItem.cantidadTotal} ${invItem.unidad}`);
      }
      setCart([...cart, {
        id: invItem.id,
        nombre: invItem.nombre,
        cantidad: Number(cantidad),
        unidad: invItem.unidad
      }]);
    } else {
      // Modo ENTRADA: validar conversión
      if (!conversionValida) {
        return toast.error(`No se puede convertir ${unidad} a ${unidadBase}. Son unidades incompatibles.`);
      }

      const cantFinal = cantidadConvertida ?? Number(cantidad);
      const unidadFinal = unidadBase;

      setCart([...cart, {
        nombre: selectedCatalogItem.nombre,
        // Guardamos cantidad original para mostrar en carrito
        cantidadIngresada: Number(cantidad),
        unidadIngresada: unidad,
        // Cantidad y unidad que se guardarán en DB
        cantidad: cantFinal,
        unidad: unidadFinal,
        categoria: selectedCatalogItem.categoria,
        fechaVencimiento: fechaVencimiento || undefined,
        fechaEsEstimada,
        datosNutricionales: {
          caloriasPor100g: selectedCatalogItem.energiaKcal,
          proteinasPor100g: selectedCatalogItem.proteinaG,
          grasasPor100g: selectedCatalogItem.grasaTotalG,
          carbohidratosPor100g: selectedCatalogItem.carbohidratosG,
        }
      }]);
    }

    // Reset Form
    setSelectedCatalogItem(null);
    setSearchQuery('');
    setCantidad('');
    setFechaVencimiento('');
    setFechaEsEstimada(false);
  };

  const handleProcessTransaction = () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');

    try {
      if (mode === 'ENTRADA') {
        const fechaActual = new Date().toISOString().split('T')[0];
        cart.forEach(item => {
          registrarEntrada(
            item.nombre, item.cantidad, item.unidad, item.categoria,
            fechaActual, item.fechaVencimiento, item.datosNutricionales
          );
        });
        toast.success(`Se ingresaron ${cart.length} lotes correctamente.`);
      } else {
        cart.forEach(item => {
          registrarConsumo(item.id, item.cantidad, 'Consumo masivo');
        });
        toast.success(`Se registraron ${cart.length} salidas correctamente.`);
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error al procesar la transacción');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className={`p-4 flex justify-between items-center text-white ${mode === 'ENTRADA' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-red-400'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {mode === 'ENTRADA' ? <PackagePlus size={24} /> : <PackageMinus size={24} />}
            {mode === 'ENTRADA' ? 'Registrar Múltiples Ingresos' : 'Registrar Salidas (Consumo)'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* Columna Izquierda: Formulario */}
          <div className="lg:w-1/2 p-4 md:p-5 overflow-y-auto bg-gray-50 border-r border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search size={14} /> Buscar en Catálogo ({catalogoAlimentos.length} alimentos)
            </h3>

            <div className="space-y-3">
              {/* Buscador con Dropdown */}
              <div ref={searchRef} className="relative">
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  {mode === 'ENTRADA' ? 'Buscar Alimento del Catálogo' : 'Buscar Producto en Inventario'}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setSelectedCatalogItem(null);
                      setShowDropdown(true);
                      setFechaVencimiento('');
                      setFechaEsEstimada(false);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-9 pr-4 border-2 border-gray-200 rounded-xl p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 outline-none font-medium text-sm transition-all"
                    placeholder={mode === 'ENTRADA' ? 'Ej. Arroz integral, Pollo...' : 'Buscar producto...'}
                  />
                  {selectedCatalogItem && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Seleccionado</span>
                    </div>
                  )}
                </div>

                {/* Filtro por grupo (solo en modo ENTRADA) */}
                {mode === 'ENTRADA' && showDropdown && (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => setGrupoFilter('Todos')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors ${grupoFilter === 'Todos' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                    >
                      Todos
                    </button>
                    {gruposAlimentos.map(g => (
                      <button
                        key={g}
                        onClick={() => setGrupoFilter(g)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors ${grupoFilter === g ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                      >
                        {g.length > 20 ? g.slice(0, 18) + '…' : g}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown de resultados */}
                {showDropdown && (searchQuery.trim() || grupoFilter !== 'Todos') && (
                  <div className="absolute z-50 mt-1 w-full bg-white border-2 border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                    {(searchResults as any[]).length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">No se encontraron resultados</div>
                    ) : (
                      (searchResults as any[]).map((item: any, idx: number) => {
                        const isInventoryItem = 'id' in item && 'cantidadTotal' in item;
                        const catalogItem = isInventoryItem ? null : (item as AlimentoCatalogo);
                        const invMatch = !isInventoryItem ? items.find(i => i.nombre.toLowerCase() === item.nombre.toLowerCase()) : null;

                        return (
                          <button
                            key={idx}
                            onClick={() => isInventoryItem ? handleSelectInventoryItem(item) : handleSelectCatalogItem(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">{item.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {catalogItem && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${GRUPO_COLORS[catalogItem.grupo] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {catalogItem.grupo.length > 25 ? catalogItem.grupo.slice(0, 23) + '…' : catalogItem.grupo}
                                  </span>
                                )}
                                {invMatch && (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    ✓ En inventario ({invMatch.cantidadTotal} {invMatch.unidad})
                                  </span>
                                )}
                                {isInventoryItem && (
                                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                    Stock: {item.cantidadTotal} {item.unidad}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {(catalogItem?.energiaKcal || item.caloriasPor100g) && (
                                <p className="text-[10px] font-bold text-gray-500">
                                  {catalogItem?.energiaKcal || item.caloriasPor100g} kcal
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Info nutricional del seleccionado */}
              {selectedCatalogItem && selectedCatalogItem.energiaKcal && (
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap size={10} /> Info Nutricional (por 100{selectedCatalogItem.unidadBase})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center bg-white/80 rounded-lg p-1.5">
                      <p className="text-xs font-black text-orange-600">{selectedCatalogItem.energiaKcal?.toFixed(0)}</p>
                      <p className="text-[8px] font-bold text-gray-400">kcal</p>
                    </div>
                    <div className="text-center bg-white/80 rounded-lg p-1.5">
                      <p className="text-xs font-black text-blue-600">{selectedCatalogItem.proteinaG?.toFixed(1) ?? '-'}</p>
                      <p className="text-[8px] font-bold text-gray-400">Prot (g)</p>
                    </div>
                    <div className="text-center bg-white/80 rounded-lg p-1.5">
                      <p className="text-xs font-black text-yellow-600">{selectedCatalogItem.carbohidratosG?.toFixed(1) ?? '-'}</p>
                      <p className="text-[8px] font-bold text-gray-400">Carb (g)</p>
                    </div>
                    <div className="text-center bg-white/80 rounded-lg p-1.5">
                      <p className="text-xs font-black text-red-500">{selectedCatalogItem.grasaTotalG?.toFixed(1) ?? '-'}</p>
                      <p className="text-[8px] font-bold text-gray-400">Grasa (g)</p>
                    </div>
                  </div>
                  {existingItem && mode === 'ENTRADA' && (
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">✓ Producto existente en inventario. Se agregará un lote.</p>
                  )}
                </div>
              )}

              {/* Cantidad y Unidad */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Cantidad a {mode === 'ENTRADA' ? 'Ingresar' : 'Consumir'}</label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                    placeholder="0.0"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Unidad
                    {mode === 'ENTRADA' && selectedCatalogItem && unidad !== unidadBase && (
                      <span className="ml-1 text-[9px] text-emerald-600 font-semibold">→ {unidadBase}</span>
                    )}
                  </label>
                  <select
                    value={unidad}
                    onChange={e => setUnidad(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 outline-none font-medium text-sm"
                  >
                    {unidadesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Vista previa de conversión */}
              {mode === 'ENTRADA' && cantidad && selectedCatalogItem && unidad !== unidadBase && (
                <div className={`text-xs p-2 rounded-lg flex items-center gap-2 ${conversionValida ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {conversionValida ? (
                    <>
                      <RefreshCw size={12} className="flex-shrink-0" />
                      <span>
                        <span className="font-bold">{cantidad} {unidad}</span>
                        {' → '}
                        <span className="font-black">{cantidadConvertida?.toFixed(2)} {unidadBase}</span>
                        {' '}(se guardará en {unidadBase})
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold">⚠ Unidades incompatibles: no se puede convertir {unidad} a {unidadBase}</span>
                  )}
                </div>
              )}

              {/* Fecha de Vencimiento */}
              {mode === 'ENTRADA' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <Calendar size={12} />
                      Vencimiento del Lote
                      {fechaEsEstimada && (
                        <span className="ml-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                          📅 Estimado ({selectedCatalogItem?.grupo ? getDiasVidaUtil(selectedCatalogItem.grupo, dynamicParamsMap) : 30} días)
                        </span>
                      )}
                    </label>
                    {selectedCatalogItem?.grupo && (
                      <button
                        onClick={reestimateExpiry}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
                        title="Restablecer estimación"
                      >
                        <RefreshCw size={10} /> Restimar
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={e => { setFechaVencimiento(e.target.value); setFechaEsEstimada(false); }}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                  />
                  {!fechaVencimiento && (
                    <p className="text-[10px] text-gray-400 mt-1">Sin fecha = lote sin vencimiento definido</p>
                  )}
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={!selectedCatalogItem || (mode === 'ENTRADA' && !conversionValida && unidad !== unidadBase)}
                className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-lg transition-transform active:scale-95 flex justify-center items-center gap-2 shadow-sm text-sm disabled:opacity-40 disabled:active:scale-100"
              >
                Añadir al Carrito <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Columna Derecha: El Carrito */}
          <div className="lg:w-1/2 p-4 md:p-5 flex flex-col bg-white">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingCart size={16} className={mode === 'ENTRADA' ? 'text-emerald-500' : 'text-red-500'} />
              Resumen ({cart.length} items)
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <ShoppingCart size={32} className="mb-2" />
                  <p className="font-medium text-sm">Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border flex justify-between items-start shadow-sm ${mode === 'ENTRADA' ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{item.nombre}</h4>
                      <div className="mt-1 space-y-0.5">
                        {/* Cantidad ingresada vs convertida */}
                        {item.cantidadIngresada && item.unidadIngresada !== item.unidad ? (
                          <p className="text-xs font-medium">
                            <span className="text-gray-500">{item.cantidadIngresada} {item.unidadIngresada}</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span className={`font-bold ${mode === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {mode === 'ENTRADA' ? '+' : '-'}{item.cantidad.toFixed(2)} {item.unidad}
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs font-medium">
                            <span className={`font-bold ${mode === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {mode === 'ENTRADA' ? '+' : '-'}{item.cantidad} {item.unidad}
                            </span>
                          </p>
                        )}
                        {/* Fecha de vencimiento */}
                        {item.fechaVencimiento && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Calendar size={10} />
                            Vence: {item.fechaVencimiento}
                            {item.fechaEsEstimada && (
                              <span className="text-amber-500 font-semibold">(estimado)</span>
                            )}
                          </p>
                        )}
                        {/* Info nutricional */}
                        {item.datosNutricionales?.caloriasPor100g && (
                          <p className="text-[10px] text-gray-400">{item.datosNutricionales.caloriasPor100g} kcal/100g</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-3">
              <button
                onClick={handleProcessTransaction}
                disabled={cart.length === 0}
                className={`w-full text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm flex justify-center items-center gap-2 text-sm ${mode === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-500 hover:bg-red-400'}`}
              >
                {mode === 'ENTRADA' ? 'Confirmar Ingresos' : 'Confirmar Consumo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
