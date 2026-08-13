import React, { useState } from 'react';
import { Package, AlertCircle, ArrowDownCircle, ArrowUpCircle, ClipboardList, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Alimento, CategoriaAlimento } from '@/types';
import { TransactionModal } from '@/components/inventory/TransactionModal';
import { KardexModal } from '@/components/inventory/KardexModal';
import { QuickActionModal } from '@/components/inventory/QuickActionModal';

const categorias: CategoriaAlimento[] = [
  'Cereales/tubérculos', 'Frutas', 'Vegetales', 'Lácteos', 
  'Carnes/mariscos/huevos', 'Leguminosas', 'Grasas/semillas', 
  'Azúcares', 'Otros'
];

export const Inventory: React.FC = () => {
  const { items, removeItem, getExpiringItems } = useInventoryStore();
  
  // Modals state
  const [transactionMode, setTransactionMode] = useState<'ENTRADA' | 'SALIDA' | null>(null);
  const [kardexItemId, setKardexItemId] = useState<string | null>(null);
  const [quickAction, setQuickAction] = useState<{ item: Alimento, mode: 'ENTRADA' | 'SALIDA' } | null>(null);
  
  // Filter & Search
  const [filterCategoria, setFilterCategoria] = useState<CategoriaAlimento | 'Todas'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto y todo su historial?')) {
      removeItem(id);
      toast.success('Producto eliminado del sistema');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategoria === 'Todas' || item.categoria === filterCategoria;
    const matchesSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide items-center">
          <button
            onClick={() => setFilterCategoria('Todas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
              filterCategoria === 'Todas' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFilterCategoria(c)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                filterCategoria === c ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                  <td colSpan={4} className="p-8 text-center text-gray-500">No se encontraron productos en el inventario.</td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  // Determinar si algún lote activo está por vencer
                  const isExpiring = item.lotes.some(l => {
                    if (l.cantidadRestante <= 0 || !l.fechaVencimiento) return false;
                    const daysLeft = (new Date(l.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    return daysLeft <= 7;
                  });

                  return (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors group ${isExpiring ? 'bg-orange-50/20' : ''}`}>
                      <td className="p-2 md:p-3">
                        <div className="font-bold text-gray-800 text-sm md:text-base flex items-center gap-1.5">
                          {item.nombre}
                          {isExpiring && <span title="Contiene lotes por vencer"><AlertCircle size={14} className="text-orange-500" /></span>}
                        </div>
                      </td>
                      <td className="p-2 md:p-3">
                        <span className={`text-sm md:text-base font-bold ${item.cantidadTotal <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {item.cantidadTotal} <span className="text-[10px] font-semibold text-gray-400 uppercase">{item.unidad}</span>
                        </span>
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
                          
                          {/* Botones de acción rápida por producto */}
                          <button 
                            onClick={() => setQuickAction({ item, mode: 'ENTRADA' })}
                            className="p-1.5 md:p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                            title="Ingreso Rápido"
                          >
                            <ArrowUpCircle size={16} className="md:w-5 md:h-5" />
                          </button>
                          
                          <button 
                            onClick={() => setQuickAction({ item, mode: 'SALIDA' })}
                            className="p-1.5 md:p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                            title="Consumo Rápido"
                          >
                            <ArrowDownCircle size={16} className="md:w-5 md:h-5" />
                          </button>
                          
                          <button 
                            onClick={() => setKardexItemId(item.id)}
                            className="p-1.5 md:p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                            title="Ver Kardex y Lotes"
                          >
                            <ClipboardList size={16} className="md:w-5 md:h-5" />
                          </button>

                          <div className="w-px h-5 md:h-6 bg-gray-200 mx-0.5 md:mx-1"></div>

                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} className="md:w-[18px] md:h-[18px]" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
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

    </div>
  );
};
