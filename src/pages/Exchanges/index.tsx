import React, { useState, useEffect } from 'react';
import { RefreshCcw, Search, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useExchangeStore } from '@/store/useExchangeStore';
import type { GrupoIntercambio } from '@/store/useExchangeStore';
import toast from 'react-hot-toast';

const grupos: GrupoIntercambio[] = ['Cereales', 'Tubérculos', 'Proteínas', 'Frutas', 'Vegetales'];

export const Exchanges: React.FC = () => {
  const { items, isLoading, fetchExchanges, addExchange, removeExchange } = useExchangeStore();
  const [busqueda, setBusqueda] = useState('');
  const [grupoActivo, setGrupoActivo] = useState<GrupoIntercambio | 'Todos'>('Todos');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form state
  const [newNombre, setNewNombre] = useState('');
  const [newGrupo, setNewGrupo] = useState<GrupoIntercambio>('Cereales');
  const [newPorcion, setNewPorcion] = useState('');

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newPorcion) {
      toast.error('Llena todos los campos');
      return;
    }
    try {
      await addExchange({
        nombre: newNombre,
        grupo: newGrupo,
        porciones_equivalentes: newPorcion
      });
      toast.success('Agregado con éxito');
      setNewNombre('');
      setNewPorcion('');
      setShowAddForm(false);
    } catch (err) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este intercambio?')) {
      try {
        await removeExchange(id);
        toast.success('Eliminado');
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  // Lógica de filtrado
  const ingredientesFiltrados = items.filter((item) => {
    const coincideTexto = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideGrupo = grupoActivo === 'Todos' || item.grupo === grupoActivo;
    return coincideTexto && coincideGrupo;
  });

  return (
    <div className="space-y-6 pb-6 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
            <RefreshCcw size={28} />
            Sistema de Intercambios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Encuentra equivalencias nutricionales para sustituir alimentos faltantes o no deseados.
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors"
        >
          <Plus size={20} />
          <span>Añadir Nuevo</span>
        </button>
      </header>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row gap-4 items-end animate-fade-in">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-600 mb-1">Nombre del Alimento</label>
            <input type="text" value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Ej. Arroz integral" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-600 mb-1">Grupo</label>
            <select value={newGrupo} onChange={e => setNewGrupo(e.target.value as GrupoIntercambio)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-gray-700">
              {grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-600 mb-1">Porción Equivalente</label>
            <input type="text" value={newPorcion} onChange={e => setNewPorcion(e.target.value)} placeholder="Ej. 1/3 de taza" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-500 transition-colors">
            Guardar
          </button>
        </form>
      )}

      {/* Buscador */}
      <section className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input 
          type="text" 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ingrediente (ej. Pollo, Arroz)..."
          className="w-full border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm transition-all"
        />
      </section>

      {/* Filtros por Grupo (Pills) */}
      <section>
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          <button
            onClick={() => setGrupoActivo('Todos')}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
              grupoActivo === 'Todos'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {grupos.map(g => (
            <button
              key={g}
              onClick={() => setGrupoActivo(g)}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                grupoActivo === g
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* Resultados de Equivalencias */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center animate-pulse">
            <p className="text-emerald-500 font-bold">Cargando datos...</p>
          </div>
        ) : ingredientesFiltrados.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">No se encontraron ingredientes.</p>
          </div>
        ) : (
          ingredientesFiltrados.map((item) => {
            // Buscar equivalentes del mismo grupo (excluyendo el actual)
            const equivalentes = items.filter(eq => eq.grupo === item.grupo && eq.nombre !== item.nombre);

            return (
              <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-50 space-y-3 relative overflow-hidden group">
                {/* Etiqueta lateral decorativa */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400"></div>
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1">
                      {item.grupo}
                    </span>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.nombre}</h3>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Porción base</p>
                      <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block mt-0.5">
                        {item.porciones_equivalentes}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="pl-2 pt-3 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    Equivale a <ArrowRight size={12} className="text-emerald-500" />
                  </p>
                  <ul className="space-y-1.5">
                    {equivalentes.slice(0, 3).map((eq) => (
                      <li key={eq.id} className="flex justify-between text-sm items-center bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="text-gray-700 font-medium">{eq.nombre}</span>
                        <span className="text-gray-500 text-xs">{eq.porciones_equivalentes}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
