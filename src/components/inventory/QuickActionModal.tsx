import React, { useState } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Alimento } from '@/types';
import toast from 'react-hot-toast';

interface QuickActionModalProps {
  item: Alimento;
  mode: 'ENTRADA' | 'SALIDA';
  onClose: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ item, mode, onClose }) => {
  const registrarEntrada = useInventoryStore(state => state.registrarEntrada);
  const registrarConsumo = useInventoryStore(state => state.registrarConsumo);

  const [cantidad, setCantidad] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const handleProcess = () => {
    const numCantidad = Number(cantidad);
    if (!cantidad || isNaN(numCantidad) || numCantidad <= 0) {
      return toast.error('Ingrese una cantidad válida mayor a 0');
    }

    try {
      if (mode === 'ENTRADA') {
        const fechaIngreso = new Date().toISOString().split('T')[0];
        registrarEntrada(
          item.nombre, 
          numCantidad, 
          item.unidad, 
          item.categoria, 
          fechaIngreso, 
          fechaVencimiento || undefined
        );
        toast.success(`Se ingresaron ${numCantidad} ${item.unidad} de ${item.nombre}`);
      } else {
        if (numCantidad > item.cantidadTotal) {
          return toast.error(`Stock insuficiente. Solo tienes ${item.cantidadTotal} ${item.unidad}`);
        }
        registrarConsumo(item.id, numCantidad, 'Consumo Rápido');
        toast.success(`Se consumieron ${numCantidad} ${item.unidad} de ${item.nombre}`);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al procesar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-xs md:max-w-sm rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center text-white ${mode === 'ENTRADA' ? 'bg-emerald-600' : 'bg-red-500'}`}>
          <h3 className="text-base font-bold flex items-center gap-2">
            {mode === 'ENTRADA' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
            {mode === 'ENTRADA' ? 'Ingreso Rápido' : 'Consumo Rápido'}
          </h3>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center mb-4">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Producto</p>
            <h4 className="text-lg font-bold text-gray-800 leading-tight">{item.nombre}</h4>
            <p className="text-xs font-medium text-gray-500 mt-1">Stock: {item.cantidadTotal} {item.unidad}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Cantidad a {mode === 'ENTRADA' ? 'Ingresar' : 'Consumir'} ({item.unidad}) *
            </label>
            <input 
              type="number" 
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-center text-base"
              placeholder="0.0"
              min="0.1"
              step="0.1"
              autoFocus
            />
          </div>

          {mode === 'ENTRADA' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Vencimiento (Opcional)</label>
              <input 
                type="date" 
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleProcess}
              className={`w-full text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 shadow-sm text-sm ${
                mode === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-500 hover:bg-red-400'
              }`}
            >
              Confirmar {mode === 'ENTRADA' ? 'Ingreso' : 'Consumo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
