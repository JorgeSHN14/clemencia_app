import React, { useState, useDeferredValue, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Package, AlertCircle, ArrowDownCircle, ArrowUpCircle, ClipboardList, Search, ChevronDown, ChevronRight, Calendar, Settings, Loader2 } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Alimento, CategoriaAlimento } from '@/types';
import { TransactionModal } from '@/components/inventory/TransactionModal';
import { KardexModal } from '@/components/inventory/KardexModal';
import { QuickActionModal } from '@/components/inventory/QuickActionModal';
import { ConfigCaducidadModal } from '@/components/inventory/ConfigCaducidadModal';

const categorias: CategoriaAlimento[] = [
  'Cereales/tubérculos', 'Frutas', 'Vegetales', 'Lácteos', 
  'Carnes/mariscos/huevos', 'Leguminosas', 'Grasas/semillas', 
  'Azúcares', 'Otros'
];

export const Inventory: React.FC = () => {
  const items = useInventoryStore(state => state.items);
  const getExpiringItems = useInventoryStore(state => state.getExpiringItems);
  const toggleUnidad = useInventoryStore(state => state.toggleUnidad);
  
  // Modals state
  const [transactionMode, setTransactionMode] = useState<'ENTRADA' | 'SALIDA' | null>(null);
  const [kardexItemId, setKardexItemId] = useState<string | null>(null);
  const [quickAction, setQuickAction] = useState<{ item: Alimento, mode: 'ENTRADA' | 'SALIDA' } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Filter & Search
  const [filterCategoria, setFilterCategoria] = useState<CategoriaAlimento | 'Todas'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  // Expandable lot rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [togglingUnitId, setTogglingUnitId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => setCollapsedGroups(prev => {
    const next = new Set(prev);
    if (next.has(group)) next.delete(group); else next.add(group);
    return next;
  });

  const toggleRow = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleToggleUnidad = async (item: Alimento) => {
    const nextUnit = item.unidad === 'g' ? 'ml' : 'g';
    if (!window.confirm(`¿Estás seguro de cambiar la unidad de medida de ${item.nombre} a ${nextUnit}?`)) {
      return;
    }

    setTogglingUnitId(item.id);
    const toastId = toast.loading(`Cambiando unidad a ${nextUnit}...`);
    try {
      await toggleUnidad(item.id);
      toast.success(`Unidad cambiada correctamente a ${nextUnit}`, { id: toastId });
    } catch (error) {
      toast.error('Error al cambiar la unidad', { id: toastId });
    } finally {
      setTogglingUnitId(null);
    }
  };

  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = filterCategoria === 'Todas' || item.categoria === filterCategoria;
      const matchesSearch = item.nombre.toLowerCase().includes(deferredSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, filterCategoria, deferredSearchTerm]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const group = item.grupoAlimento || 'Sin Grupo';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {} as Record<string, Alimento[]>);
  }, [filteredItems]);

  const sortedGroups = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
  }, [groupedItems]);

  const expiringItemsCount = getExpiringItems().length;

  return (
    <div className="space-y-4 pb-4 animate-fade-in-up">
      {/* Header y Acciones Masivas */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 mt-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-emerald-700 flex items-center gap-2">
            <Package size={24} />
            Gestión Inteligente de Bodega
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Control FIFO, Lotes y Kardex automatizado.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowConfig(true)}
            className="flex-none bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 p-2 md:px-3 md:py-2 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center"
            title="Configuración de Caducidad"
          >
            <Settings size={18} />
          </button>
          
          <button 
            onClick={() => setTransactionMode('ENTRADA')}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white p-2 md:px-4 md:py-2 rounded-lg shadow-sm shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
          >
            <ArrowUpCircle size={18} />
            <span className="hidden sm:inline">Registrar Entradas</span>
            <span className="sm:hidden">Ingresos</span>
          </button>
          
          <button 
            onClick={() => setTransactionMode('SALIDA')}
            className="flex-1 md:flex-none bg-red-500 hover:bg-red-400 text-white p-2 md:px-4 md:py-2 rounded-lg shadow-sm shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
          >
            <ArrowDownCircle size={18} />
            <span className="hidden sm:inline">Registrar Consumo</span>
            <span className="sm:hidden">Salidas</span>
          </button>
        </div>
      </header>

      {/* Alertas de Vencimiento */}
      {expiringItemsCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-2">
          <div className="bg-orange-100 p-1.5 rounded text-orange-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-orange-800">Alerta de Caducidad (Próximos 7 días)</h3>
            <p className="text-xs text-orange-700">Tienes {expiringItemsCount} lote(s) próximo(s) a vencer. Revisa el Kardex de tus productos.</p>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center">
        <div className="relative w-full xl:max-w-md flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar producto por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-2 w-full overflow-x-auto pb-2 xl:pb-0 scrollbar-hide items-center flex-nowrap">
          <button
            onClick={() => setFilterCategoria('Todas')}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
              filterCategoria === 'Todas' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
            }`}
          >
            Todas
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategoria(c)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                filterCategoria === c ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">
                <th className="p-2 md:p-3 w-6"></th>
                <th className="p-2 md:p-3">Producto</th>
                <th className="p-2 md:p-3">Stock Total</th>
                <th className="p-2 md:p-3">Grupo / Categoría</th>
                <th className="p-2 md:p-3">Info. Nutricional</th>
                <th className="p-2 md:p-3 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No se encontraron productos en el inventario.</td>
                </tr>
              ) : (
                sortedGroups.map(group => (
                  <React.Fragment key={group}>
                    <tr 
                      className="bg-gray-100/80 hover:bg-gray-200/80 border-y border-gray-200 cursor-pointer transition-colors group/header"
                      onClick={() => toggleGroup(group)}
                    >
                      <td colSpan={6} className="px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold text-gray-700 tracking-wider uppercase">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {group} 
                            <span className="bg-white px-2 py-0.5 rounded-full text-[10px] text-gray-500 border border-gray-200 shadow-sm normal-case">
                              {groupedItems[group].length} {groupedItems[group].length === 1 ? 'producto' : 'productos'}
                            </span>
                          </span>
                          <span className="p-1 rounded-md bg-white border border-gray-200 text-gray-400 group-hover/header:text-gray-600 group-hover/header:border-gray-300 transition-colors shadow-sm">
                            {collapsedGroups.has(group) ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {!collapsedGroups.has(group) && groupedItems[group]
                      .sort((a, b) => a.nombre.localeCompare(b.nombre))
                      .map(item => {
                        // Determinar si algún lote activo está por vencer
                  const isExpiring = item.lotes.some(l => {
                    if (l.cantidadRestante <= 0 || !l.fechaVencimiento) return false;
                    const daysLeft = (new Date(l.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    return daysLeft <= 7;
                  });

                  const isExpanded = expandedRows.has(item.id);
                  // Lotes activos ordenados FEFO
                  const lotesActivos = item.lotes
                    .filter(l => l.cantidadRestante > 0)
                    .sort((a, b) => {
                      if (a.fechaVencimiento && b.fechaVencimiento)
                        return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime();
                      if (a.fechaVencimiento) return -1;
                      if (b.fechaVencimiento) return 1;
                      return new Date(a.fechaIngreso).getTime() - new Date(b.fechaIngreso).getTime();
                    });

                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors group ${isExpiring ? 'bg-orange-50/20' : ''}`}>
                        {/* Toggle expand */}
                        <td className="p-2 md:p-3">
                          <button
                            onClick={() => toggleRow(item.id)}
                            className="p-1 text-gray-400 hover:text-emerald-600 rounded transition-colors"
                            title={isExpanded ? 'Ocultar lotes' : 'Ver lotes'}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="font-bold text-gray-800 text-sm md:text-base flex items-center gap-1.5">
                            {item.nombre}
                            {isExpiring && <span title="Contiene lotes por vencer"><AlertCircle size={14} className="text-orange-500" /></span>}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{lotesActivos.length} lote{lotesActivos.length !== 1 ? 's' : ''} activo{lotesActivos.length !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm md:text-base font-bold ${item.cantidadTotal <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {item.cantidadTotal} <span className="text-[10px] font-semibold text-gray-400 uppercase">{item.unidad}</span>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleUnidad(item);
                              }}
                              disabled={togglingUnitId === item.id}
                              className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                              title={`Cambiar a ${item.unidad === 'g' ? 'ml' : 'g'}`}
                            >
                              {togglingUnitId === item.id ? <Loader2 size={10} className="animate-spin" /> : '⇄'} {item.unidad === 'g' ? 'ml' : 'g'}
                            </button>
                          </div>
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 bg-gray-800 text-white text-[9px] font-bold uppercase tracking-wider rounded-md">
                              {item.grupoAlimento || 'Sin Grupo'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold uppercase tracking-wider rounded-md border border-gray-200">
                              {item.categoria}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 md:p-3 min-w-[140px]">
                          <div className="flex flex-col text-[10px] text-gray-600">
                            <span className="font-bold text-emerald-700 mb-0.5">Por 100 {item.unidad === 'ml' || item.grupoAlimento === 'Alimentos expresados en 100 ml' ? 'ml' : 'g'}:</span>
                            <span className="text-orange-600 font-semibold">{item.caloriasPor100g ?? 0} kcal</span>
                            <div className="flex gap-1.5 mt-0.5 font-medium">
                              <span className="text-blue-600" title="Proteínas">P: {item.proteinasPor100g ?? 0}g</span>
                              <span className="text-yellow-600" title="Carbohidratos">C: {item.carbohidratosPor100g ?? 0}g</span>
                              <span className="text-red-500" title="Grasas">G: {item.grasasPor100g ?? 0}g</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="flex justify-center items-center gap-1 md:gap-2 opacity-100 md:opacity-50 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setQuickAction({ item, mode: 'ENTRADA' })} className="p-1.5 md:p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all" title="Ingreso Rápido">
                              <ArrowUpCircle size={16} className="md:w-5 md:h-5" />
                            </button>
                            <button onClick={() => setQuickAction({ item, mode: 'SALIDA' })} className="p-1.5 md:p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all" title="Consumo Rápido">
                              <ArrowDownCircle size={16} className="md:w-5 md:h-5" />
                            </button>
                            <button onClick={() => setKardexItemId(item.id)} className="p-1.5 md:p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all" title="Ver Kardex y Lotes">
                              <ClipboardList size={16} className="md:w-5 md:h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandible: Vista de lotes */}
                      {isExpanded && (
                        <tr className="border-b border-gray-100">
                          <td colSpan={6} className="bg-gray-50/80 px-4 pb-4 pt-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Calendar size={10} /> Lotes activos — orden de consumo FEFO
                            </p>
                            {lotesActivos.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No hay lotes con stock.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {lotesActivos.map((lote, loteIdx) => {
                                  const daysLeft = lote.fechaVencimiento
                                    ? Math.ceil((new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                                    : null;
                                  const urgency =
                                    daysLeft !== null && daysLeft <= 3 ? 'danger' :
                                    daysLeft !== null && daysLeft <= 7 ? 'warning' :
                                    daysLeft !== null && daysLeft <= 30 ? 'caution' : 'ok';
                                  const urgencyStyles = {
                                    danger:  'border-red-300 bg-red-50',
                                    warning: 'border-orange-300 bg-orange-50',
                                    caution: 'border-yellow-200 bg-yellow-50',
                                    ok:      'border-gray-200 bg-white',
                                  };
                                  const dateStyles = {
                                    danger:  'text-red-700 font-bold',
                                    warning: 'text-orange-600 font-bold',
                                    caution: 'text-yellow-700',
                                    ok:      'text-gray-500',
                                  };

                                  return (
                                    <div key={lote.id} className={`relative text-xs p-2.5 rounded-xl border shadow-sm min-w-[140px] ${urgencyStyles[urgency]}`}>
                                      {loteIdx === 0 && (
                                        <span className="absolute -top-2 left-2 text-[8px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                                          PRIMERO FEFO
                                        </span>
                                      )}
                                      <p className="font-bold text-gray-800 mt-1">
                                        {lote.cantidadRestante} <span className="text-gray-400 font-normal">{item.unidad}</span>
                                      </p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Orig: {lote.cantidadOriginal} {item.unidad}</p>
                                      <p className="text-[10px] text-gray-400">Ingresó: {lote.fechaIngreso}</p>
                                      {lote.fechaVencimiento ? (
                                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${dateStyles[urgency]}`}>
                                          <Calendar size={9} />
                                          Vence: {lote.fechaVencimiento}
                                          {daysLeft !== null && (
                                            <span>({daysLeft === 0 ? '¡Hoy!' : daysLeft < 0 ? 'Vencido' : `${daysLeft}d`})</span>
                                          )}
                                        </p>
                                      ) : (
                                        <p className="text-[10px] text-gray-300 mt-1">Sin fecha de vencimiento</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {transactionMode && (
        <TransactionModal 
          mode={transactionMode} 
          onClose={() => setTransactionMode(null)} 
        />
      )}

      {kardexItemId && (
        <KardexModal 
          alimentoId={kardexItemId} 
          onClose={() => setKardexItemId(null)} 
        />
      )}

      {quickAction && (
        <QuickActionModal 
          item={quickAction.item}
          mode={quickAction.mode}
          onClose={() => setQuickAction(null)}
        />
      )}

      {showConfig && (
        <ConfigCaducidadModal 
          onClose={() => setShowConfig(false)}
        />
      )}

    </div>
  );
};
