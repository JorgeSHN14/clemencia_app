import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useRecipeStore } from '@/store/useRecipeStore';
import type { Alimento, CondicionClinica, Receta } from '@/types';

const patologiasDisponibles: CondicionClinica[] = [
  'Diabetes', 'Hipertensión', 'Dieta blanda',
  'Postoperatoria', 'Nutrición enteral', 'Desnutrición', 'Disfagia', 'Enfermedad Renal'
];

interface ManualRecipeCreatorProps {
  onSuccess: () => void;
}

export const ManualRecipeCreator: React.FC<ManualRecipeCreatorProps> = ({ onSuccess }) => {
  const inventoryItems = useInventoryStore(state => state.items);
  const { addGeneratedRecipe } = useRecipeStore();

  const [titulo, setTitulo] = useState('');
  const [porciones, setPorciones] = useState(1);
  const [patologias, setPatologias] = useState<CondicionClinica[]>([]);
  
  // Ingredientes
  const [ingredientes, setIngredientes] = useState<{ id_inventario: string, cantidad: number, unidad: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Procedimiento
  const [procedimiento, setProcedimiento] = useState<string[]>(['']);

  const togglePatologia = (p: CondicionClinica) => {
    setPatologias(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const addIngredient = (alimento: Alimento) => {
    if (!ingredientes.find(i => i.id_inventario === alimento.id)) {
      setIngredientes([...ingredientes, { id_inventario: alimento.id, cantidad: 100, unidad: alimento.unidad }]);
    }
  };

  const updateIngredient = (id_inventario: string, cantidad: number) => {
    setIngredientes(prev => prev.map(i => i.id_inventario === id_inventario ? { ...i, cantidad } : i));
  };

  const removeIngredient = (id_inventario: string) => {
    setIngredientes(prev => prev.filter(i => i.id_inventario !== id_inventario));
  };

  const addPaso = () => setProcedimiento([...procedimiento, '']);
  const updatePaso = (idx: number, valor: string) => setProcedimiento(prev => prev.map((p, i) => i === idx ? valor : p));
  const removePaso = (idx: number) => setProcedimiento(prev => prev.filter((_, i) => i !== idx));

  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return inventoryItems.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [inventoryItems, searchTerm]);

  const handleSave = () => {
    if (!titulo.trim()) return toast.error('Ingresa un título');
    if (ingredientes.length === 0) return toast.error('Añade al menos un ingrediente');
    if (procedimiento.filter(p => p.trim()).length === 0) return toast.error('Añade al menos un paso de preparación');

    let totalCalorias = 0;
    let totalProteinas = 0;
    let totalCarbohidratos = 0;
    let totalGrasas = 0;

    const ingredientesCalculados = ingredientes.map(ing => {
      const alimentoDb = inventoryItems.find(a => a.id === ing.id_inventario)!;
      const factor = ing.cantidad / 100;

      let calorias = (alimentoDb.caloriasPor100g || 0) * factor;
      let proteinas = (alimentoDb.proteinasPor100g || 0) * factor;
      let carbohidratos = (alimentoDb.carbohidratosPor100g || 0) * factor;
      let grasas = (alimentoDb.grasasPor100g || 0) * factor;

      totalCalorias += calorias;
      totalProteinas += proteinas;
      totalCarbohidratos += carbohidratos;
      totalGrasas += grasas;

      return {
        id_inventario: alimentoDb.id,
        nombre: alimentoDb.nombre,
        cantidad: ing.cantidad,
        unidad: 'g/ml', // Forzamos visualmente g/ml para estandarizar el manual
        peso_en_gramos: ing.cantidad,
        esExtra: false,
        calorias: Math.round(calorias),
        proteinas: Number(proteinas.toFixed(1)),
        carbohidratos: Number(carbohidratos.toFixed(1)),
        grasas: Number(grasas.toFixed(1))
      };
    });

    const finalRecipe: Receta = {
      id: crypto.randomUUID(),
      titulo,
      porciones,
      aptoPara: patologias.length > 0 ? patologias : ['Ninguna'],
      ingredientes: ingredientesCalculados,
      procedimiento: procedimiento.filter(p => p.trim()),
      calorias: Math.round(totalCalorias),
      proteinas: Number(totalProteinas.toFixed(1)),
      carbohidratos: Number(totalCarbohidratos.toFixed(1)),
      grasas: Number(totalGrasas.toFixed(1)),
      es_generada: false // Marcamos como manual (base)
    } as any;

    addGeneratedRecipe(finalRecipe);
    toast.success('Receta manual creada exitosamente');
    onSuccess();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-black text-gray-800 mb-6">Creador de Receta Manual</h2>
        
        <div className="space-y-6">
          {/* Título y Porciones */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Título de la Receta</label>
              <input 
                type="text" 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Sopa de Pollo Nutritiva"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-bold text-gray-700 mb-2">Porciones / Pacientes</label>
              <input 
                type="number" 
                min="1"
                value={porciones}
                onChange={e => setPorciones(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Patologías */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Apto para (Opcional)</label>
            <div className="flex flex-wrap gap-2">
              {patologiasDisponibles.map(p => (
                <button
                  key={p}
                  onClick={() => togglePatologia(p)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${patologias.includes(p)
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Ingredientes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Ingredientes del Inventario</label>
            <p className="text-xs text-gray-500 mb-4">Añade los ingredientes y especifica los gramos EXACTOS para que el sistema calcule los nutrientes automáticamente.</p>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar ingrediente en stock..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              {searchTerm && filteredInventory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-10 p-2 space-y-1">
                  {filteredInventory.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { addIngredient(item); setSearchTerm(''); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {item.nombre} <span className="text-gray-400 text-xs ml-2">({item.cantidadTotal} {item.unidad} en stock)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {ingredientes.map(ing => {
                const alim = inventoryItems.find(i => i.id === ing.id_inventario);
                if (!alim) return null;
                return (
                  <div key={ing.id_inventario} className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    <Package size={18} className="text-emerald-500" />
                    <span className="flex-1 font-bold text-gray-700 text-sm">{alim.nombre}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        value={ing.cantidad}
                        onChange={e => updateIngredient(ing.id_inventario, parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-center font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1.5 rounded-lg">g / ml</span>
                      <button onClick={() => removeIngredient(ing.id_inventario)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {ingredientes.length === 0 && (
                <div className="text-center py-6 text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                  Añade ingredientes buscando arriba
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Procedimiento */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4">Pasos de Preparación</label>
            <div className="space-y-3">
              {procedimiento.map((paso, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <textarea 
                    value={paso}
                    onChange={e => updatePaso(idx, e.target.value)}
                    placeholder="Describe este paso de la receta..."
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none h-20"
                  />
                  <button onClick={() => removePaso(idx)} className="text-red-400 hover:text-red-600 p-2 self-start">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                onClick={addPaso}
                className="text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ml-11"
              >
                <Plus size={16} /> Añadir Paso
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Save size={20} /> Guardar Receta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
