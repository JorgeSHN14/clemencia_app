import React, { useState } from 'react';
import { X, History, AlertTriangle } from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import type { Lote } from '@/types';
import toast from 'react-hot-toast';

interface KardexModalProps {
  alimentoId: string;
  onClose: () => void;
}

export const KardexModal: React.FC<KardexModalProps> = ({ alimentoId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lotes' | 'historial'>('lotes');
  const items = useInventoryStore(state => state.items);
  const registrarAjuste = useInventoryStore(state => state.registrarAjuste);
  
  const alimento = items.find(i => i.id === alimentoId);
  
  // Estado local para los inputs de ajuste
  const [ajusteValores, setAjusteValores] = useState<Record<string, string>>({});
  const [ajusteMotivos, setAjusteMotivos] = useState<Record<string, string>>({});

  if (!alimento) return null;

  const handleAjustar = (lote: Lote) => {
    const valorRaw = ajusteValores[lote.id];
    const motivo = ajusteMotivos[lote.id] || 'Ajuste manual';
    const nuevaCantidad = Number(valorRaw);
    
    if (valorRaw === undefined || valorRaw === '' || isNaN(nuevaCantidad) || nuevaCantidad < 0) {
      toast.error('Ingrese una cantidad válida mayor o igual a 0');
      return;
    }

    registrarAjuste(alimento.id, lote.id, nuevaCantidad, motivo);
    toast.success('Lote ajustado correctamente');
    
    // Limpiar inputs
    setAjusteValores(prev => ({ ...prev, [lote.id]: '' }));
    setAjusteMotivos(prev => ({ ...prev, [lote.id]: '' }));
  };

  const lotesActivos = alimento.lotes.filter(l => l.cantidadRestante > 0);
  const lotesAgotados = alimento.lotes.filter(l => l.cantidadRestante <= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <History className="text-emerald-500" size={24} />
              Kardex: {alimento.nombre}
            </h2>
            <div className="flex gap-3 mt-2 text-xs font-bold text-gray-500">
              <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">
                Stock Total: {alimento.cantidadTotal} {alimento.unidad}
              </span>
              <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                {alimento.categoria}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 md:px-5 pt-3 border-b border-gray-100 bg-gray-50">
          <button 
            onClick={() => setActiveTab('lotes')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'lotes' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Lotes Activos
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'historial' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Historial de Movimientos
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-white">
          
          {activeTab === 'lotes' && (
            <div className="space-y-6">
              {/* Lotes Activos */}
              <div>
                {lotesActivos.length === 0 ? (
                  <p className="text-gray-500 text-sm italic p-3 bg-gray-50 rounded-lg border border-gray-100">No hay lotes con stock actualmente.</p>
                ) : (
                  <div className="space-y-3">
                    {lotesActivos.map(lote => {
                      const daysLeft = lote.fechaVencimiento ? Math.ceil((new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                      const isExpiring = daysLeft !== null && daysLeft <= 7;
                      
                      return (
                        <div key={lote.id} className={`p-3 rounded-xl border ${isExpiring ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50'} flex flex-col md:flex-row gap-3 justify-between items-center`}>
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-800 text-base">{lote.cantidadRestante} <span className="text-xs text-gray-500">{alimento.unidad}</span></span>
                              <span className="text-[10px] font-semibold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                Org: {lote.cantidadOriginal}
                              </span>
                            </div>
                            <div className="flex gap-3 text-[11px] font-medium text-gray-500">
                              <span>Ingresó: {lote.fechaIngreso}</span>
                              {lote.fechaVencimiento && (
                                <span className={isExpiring ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                                  {isExpiring && <AlertTriangle size={10} />}
                                  Vence: {lote.fechaVencimiento}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Controles de Ajuste */}
                          <div className="flex items-center gap-1 w-full md:w-auto bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                            <input 
                              type="number" 
                              placeholder={`Real`}
                              value={ajusteValores[lote.id] ?? ''}
                              onChange={e => setAjusteValores(prev => ({ ...prev, [lote.id]: e.target.value }))}
                              className="w-16 md:w-20 p-1.5 text-xs border-r border-gray-100 outline-none focus:bg-gray-50 rounded-l-md"
                              min="0"
                              step="0.01"
                            />
                            <input 
                              type="text" 
                              placeholder="Motivo..."
                              value={ajusteMotivos[lote.id] ?? ''}
                              onChange={e => setAjusteMotivos(prev => ({ ...prev, [lote.id]: e.target.value }))}
                              className="w-24 md:w-32 p-1.5 text-xs outline-none focus:bg-gray-50"
                            />
                            <button 
                              onClick={() => handleAjustar(lote)}
                              className="bg-gray-800 text-white px-2 py-1.5 rounded-md text-xs font-bold hover:bg-gray-700 transition-colors"
                            >
                              Ajustar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lotes Agotados */}
              {lotesAgotados.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lotes Agotados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lotesAgotados.map(lote => (
                      <div key={lote.id} className="p-2 bg-gray-50 border border-gray-100 rounded-lg opacity-70">
                        <p className="text-xs font-bold text-gray-500 mb-0.5">0 {alimento.unidad} <span className="text-[10px] font-normal ml-1">(Entró {lote.cantidadOriginal})</span></p>
                        <p className="text-[10px] text-gray-400">{lote.fechaIngreso} → {lote.fechaVencimiento || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">
                    <th className="p-2 md:p-3">Fecha y Hora</th>
                    <th className="p-2 md:p-3">Tipo</th>
                    <th className="p-2 md:p-3">Cantidad</th>
                    <th className="p-2 md:p-3">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {alimento.movimientos.map(mov => {
                    const isEntrada = mov.tipo === 'ENTRADA';
                    const isSalida = mov.tipo === 'SALIDA';
                    const isAjuste = mov.tipo === 'AJUSTE';
                    const isPositivo = isEntrada || (isAjuste && mov.cantidad > 0);
                    
                    return (
                      <tr key={mov.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-2 md:p-3 text-xs text-gray-600 font-medium">
                          {new Date(mov.fecha).toLocaleString()}
                        </td>
                        <td className="p-2 md:p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-black tracking-wide ${
                            isEntrada ? 'bg-emerald-100 text-emerald-700' :
                            isSalida ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="p-2 md:p-3">
                          <span className={`text-xs md:text-sm font-bold ${isPositivo ? 'text-emerald-600' : 'text-red-500'}`}>
                            {isPositivo ? '+' : isAjuste && mov.cantidad < 0 ? '' : '-'}{mov.cantidad} <span className="text-[10px] font-normal opacity-70">{alimento.unidad}</span>
                          </span>
                        </td>
                        <td className="p-2 md:p-3 text-xs text-gray-500">
                          {mov.motivo || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {alimento.movimientos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 md:p-6 text-center text-sm text-gray-400 italic">No hay registros de movimientos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
