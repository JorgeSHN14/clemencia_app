import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Trash2, ArrowRight, PackagePlus, PackageMinus } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { CategoriaAlimento } from '@/types';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  mode: 'ENTRADA' | 'SALIDA';
  onClose: () => void;
}

const categorias: CategoriaAlimento[] = [
  'Cereales/tubérculos', 'Frutas', 'Vegetales', 'Lácteos', 
  'Carnes/mariscos/huevos', 'Leguminosas', 'Grasas/semillas', 
  'Azúcares', 'Otros'
];
const unidades = ['kg', 'g', 'l', 'ml', 'unidades', 'tazas', 'cucharadas'];

export const TransactionModal: React.FC<TransactionModalProps> = ({ mode, onClose }) => {
  const items = useInventoryStore(state => state.items);
  const registrarEntrada = useInventoryStore(state => state.registrarEntrada);
  const registrarConsumo = useInventoryStore(state => state.registrarConsumo);

  const [cart, setCart] = useState<any[]>([]);
  
  // Current Item Form
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [categoria, setCategoria] = useState<CategoriaAlimento>('Otros');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // Autocomplete & Singular/Plural Detection
  const isMatch = (a: string, b: string) => {
    const str1 = a.toLowerCase().trim();
    const str2 = b.toLowerCase().trim();
    if (str1 === str2) return true;
    if (str1 + 's' === str2 || str2 + 's' === str1) return true;
    if (str1 + 'es' === str2 || str2 + 'es' === str1) return true;
    if (str1.replace(/z$/, 'ces') === str2 || str2.replace(/z$/, 'ces') === str1) return true;
    return false;
  };

  const existingItem = items.find(i => isMatch(i.nombre, nombre));

  const handleAddToCart = () => {
    if (!nombre.trim()) return toast.error('El nombre es obligatorio');
    if (!cantidad || Number(cantidad) <= 0) return toast.error('Cantidad inválida');

    if (mode === 'SALIDA') {
      if (!existingItem) return toast.error('Para registrar consumo, el producto debe existir en el inventario.');
      if (existingItem.cantidadTotal < Number(cantidad)) {
        return toast.error(`Stock insuficiente. Solo tienes ${existingItem.cantidadTotal} ${existingItem.unidad}`);
      }
      
      setCart([...cart, { 
        id: existingItem.id, 
        nombre: existingItem.nombre, 
        cantidad: Number(cantidad), 
        unidad: existingItem.unidad 
      }]);
    } else {
      // MODO ENTRADA
      setCart([...cart, {
        nombre: nombre.trim(),
        cantidad: Number(cantidad),
        unidad: existingItem ? existingItem.unidad : unidad,
        categoria: existingItem ? existingItem.categoria : categoria,
        fechaVencimiento: fechaVencimiento || undefined
      }]);
    }

    // Reset Form
    setNombre('');
    setCantidad('');
    setFechaVencimiento('');
  };

  const handleProcessTransaction = () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');

    try {
      if (mode === 'ENTRADA') {
        const fechaActual = new Date().toISOString().split('T')[0];
        cart.forEach(item => {
          registrarEntrada(item.nombre, item.cantidad, item.unidad, item.categoria, fechaActual, item.fechaVencimiento);
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
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center text-white ${mode === 'ENTRADA' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {mode === 'ENTRADA' ? <PackagePlus size={24} /> : <PackageMinus size={24} />}
            {mode === 'ENTRADA' ? 'Registrar Múltiples Ingresos' : 'Registrar Salidas (Consumo)'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Columna Izquierda: Formulario (Agregador) */}
          <div className="lg:w-1/2 p-4 md:p-5 overflow-y-auto bg-gray-50 border-r border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus size={14} /> Buscar y Agregar
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Producto</label>
                <input 
                  type="text" 
                  list="inventory-items"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                  placeholder="Ej. Arroz Integral"
                />
                <datalist id="inventory-items">
                  {items.map(i => <option key={i.id} value={i.nombre} />)}
                </datalist>
                
                {existingItem && mode === 'ENTRADA' && (
                  <p className="text-xs font-bold text-emerald-600 mt-1">✓ Producto existente. Se agregará un lote al stock.</p>
                )}
                {!existingItem && nombre && mode === 'ENTRADA' && (
                  <p className="text-xs font-bold text-blue-600 mt-1">✨ Producto nuevo. Se creará un nuevo registro.</p>
                )}
                {existingItem && mode === 'SALIDA' && (
                  <p className="text-xs font-bold text-blue-600 mt-1">Stock Disponible: {existingItem.cantidadTotal} {existingItem.unidad}</p>
                )}
              </div>

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
                  <label className="block text-xs font-bold text-gray-600 mb-1">Unidad</label>
                  <select 
                    value={existingItem ? existingItem.unidad : unidad} 
                    onChange={e => setUnidad(e.target.value)}
                    disabled={!!existingItem}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 outline-none font-medium text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {mode === 'ENTRADA' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Categoría</label>
                    <select 
                      value={existingItem ? existingItem.categoria : categoria} 
                      onChange={e => setCategoria(e.target.value as CategoriaAlimento)}
                      disabled={!!existingItem}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 outline-none font-medium text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Vencimiento Lote (Opcional)</label>
                    <input 
                      type="date" 
                      value={fechaVencimiento}
                      onChange={e => setFechaVencimiento(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                    />
                  </div>
                </>
              )}

              <button 
                onClick={handleAddToCart}
                className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-lg transition-transform active:scale-95 flex justify-center items-center gap-2 shadow-sm text-sm"
              >
                Añadir al Carrito <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Columna Derecha: El Carrito */}
          <div className="lg:w-1/2 p-4 md:p-5 flex flex-col bg-white">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingCart size={16} className={mode === 'ENTRADA' ? 'text-emerald-500' : 'text-red-500'} /> 
              Resumen
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <ShoppingCart size={32} className="mb-2" />
                  <p className="font-medium text-sm">Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center shadow-sm ${mode === 'ENTRADA' ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}`}>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{item.nombre}</h4>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">
                        <span className={mode === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}>
                          {mode === 'ENTRADA' ? '+' : '-'}{item.cantidad} {item.unidad}
                        </span>
                        {item.fechaVencimiento && <span className="ml-2 text-[10px] text-gray-400">Vence: {item.fechaVencimiento}</span>}
                      </p>
                    </div>
                    <button 
                      onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
                className={`w-full text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm flex justify-center items-center gap-2 text-sm ${
                  mode === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-500 hover:bg-red-400'
                }`}
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
