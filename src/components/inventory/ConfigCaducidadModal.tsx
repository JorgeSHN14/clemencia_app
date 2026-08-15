import React, { useEffect, useState, useMemo } from 'react';
import { X, Settings2, Save } from 'lucide-react';
import { useCaducidadStore } from '@/store/useCaducidadStore';
import { gruposAlimentos } from '@/data/foodCatalog';

interface ConfigCaducidadModalProps {
  onClose: () => void;
}

export const ConfigCaducidadModal: React.FC<ConfigCaducidadModalProps> = ({ onClose }) => {
  const { parametros, fetchParametros, updateDias, isLoading } = useCaducidadStore();
  
  // Local state for edits
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [savingGrupo, setSavingGrupo] = useState<string | null>(null);

  useEffect(() => {
    fetchParametros();
  }, [fetchParametros]);

  // Convert DB array to a map for easy lookup
  const dbParametrosMap = useMemo(() => {
    const map: Record<string, number> = {};
    parametros.forEach(p => {
      map[p.grupo] = p.dias;
    });
    return map;
  }, [parametros]);

  // Default fallbacks in case they are not in DB yet
  const FALLBACKS: Record<string, number> = {
    'Frutas': 7,
    'Vegetales': 5,
    'Carnes y embutidos': 3,
    'Pescados y mariscos': 2,
    'Lacteos': 7,
    'Cereales, tubérculos y plátanos': 180,
    'Leguminosas': 365,
    'Grasas y frutos secos': 90,
    'Azucares': 730,
    'Snacks': 120,
    'Alimentos expresados en 100 ml': 7,
  };

  const getValorActual = (grupo: string) => {
    if (edits[grupo] !== undefined) return edits[grupo];
    if (dbParametrosMap[grupo] !== undefined) return dbParametrosMap[grupo];
    return FALLBACKS[grupo] ?? 30; // 30 is default
  };

  const hasChanges = (grupo: string) => {
    if (edits[grupo] === undefined) return false;
    const currentDbValue = dbParametrosMap[grupo] ?? FALLBACKS[grupo] ?? 30;
    return edits[grupo] !== currentDbValue;
  };

  const handleSave = async (grupo: string) => {
    if (edits[grupo] === undefined) return;
    setSavingGrupo(grupo);
    try {
      await updateDias(grupo, edits[grupo]);
      // Remove from edits once saved
      setEdits(prev => {
        const next = { ...prev };
        delete next[grupo];
        return next;
      });
    } finally {
      setSavingGrupo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Settings2 className="text-blue-500" size={24} />
              Configuración de Caducidad
            </h2>
            <p className="text-xs text-gray-500 mt-1">Días estimados de vida útil por grupo de alimento.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1">
          {isLoading && parametros.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Cargando parámetros...</div>
          ) : (
            <div className="space-y-4">
              {gruposAlimentos.map(grupo => {
                const valorActual = getValorActual(grupo);
                const cambiado = hasChanges(grupo);
                const isSaving = savingGrupo === grupo;

                return (
                  <div key={grupo} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{grupo}</p>
                      <p className="text-[10px] text-gray-400">Desde fecha de ingreso</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={valorActual}
                          onChange={e => setEdits(prev => ({ ...prev, [grupo]: parseInt(e.target.value) || 0 }))}
                          className="w-24 p-2 text-sm font-bold text-center border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          min="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">días</span>
                      </div>
                      
                      <button
                        onClick={() => handleSave(grupo)}
                        disabled={!cambiado || isSaving}
                        className={`p-2 rounded-lg transition-all flex items-center justify-center min-w-[40px] ${
                          cambiado 
                            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 active:scale-95' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          <Save size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
