import React, { useState, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Activity, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientStore } from '@/store/usePatientStore';
import type { Paciente, CondicionClinica } from '@/types';

import { supabase } from '@/lib/supabase';

export const Patients: React.FC = () => {
  const { patients, addPatient, updatePatient, removePatient } = usePatientStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patologiasDisponibles, setPatologiasDisponibles] = useState<CondicionClinica[]>(['Ninguna']);

  React.useEffect(() => {
    const fetchSintomas = async () => {
      const { data } = await supabase.from('sintomatologias').select('nombre').order('nombre');
      if (data) {
        const nombres = data.map(d => d.nombre);
        // Ensure "Ninguna" is at the start if not present
        if (!nombres.includes('Ninguna')) {
          nombres.unshift('Ninguna');
        }
        setPatologiasDisponibles(nombres);
      }
    };
    fetchSintomas();
  }, []);
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState<Paciente['sexo']>('M');
  const [peso, setPeso] = useState(''); // kg
  const [talla, setTalla] = useState(''); // m
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [diagnostico, setDiagnostico] = useState<CondicionClinica[]>(['Ninguna']);
  
  // Lista dinámica de medicamentos
  const [medicamentos, setMedicamentos] = useState<string[]>([]);
  const [nuevoMed, setNuevoMed] = useState('');
  
  const [error, setError] = useState('');

  // Cálculo Dinámico y Reactivo del IMC
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (!isNaN(p) && !isNaN(t) && t > 0) {
      return (p / (t * t)).toFixed(1);
    }
    return '0.0';
  }, [peso, talla]);

  const getIMCCategory = (imc: number) => {
    if (imc === 0) return { label: 'N/A', color: 'text-gray-500' };
    if (imc < 18.5) return { label: 'Bajo peso', color: 'text-orange-500' };
    if (imc >= 18.5 && imc < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (imc >= 25 && imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' };
    return { label: 'Obesidad', color: 'text-red-500' };
  };

  const togglePatologia = (p: CondicionClinica) => {
    if (p === 'Ninguna') {
      setDiagnostico(['Ninguna']);
      return;
    }
    setDiagnostico(prev => {
      const filtered = prev.filter(item => item !== 'Ninguna');
      if (filtered.includes(p)) {
        const next = filtered.filter(item => item !== p);
        return next.length === 0 ? ['Ninguna'] : next;
      }
      return [...filtered, p];
    });
  };

  const agregarMedicamento = () => {
    if (!nuevoMed.trim()) return;
    setMedicamentos(prev => [...prev, nuevoMed.trim()]);
    setNuevoMed('');
  };

  const removerMedicamento = (idx: number) => {
    setMedicamentos(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setNombre('');
    setEdad('');
    setSexo('M');
    setPeso('');
    setTalla('');
    setPorcentajeGrasa('');
    setCintura('');
    setCadera('');
    setDiagnostico(['Ninguna']);
    setMedicamentos([]);
    setNuevoMed('');
    setError('');
    setEditingId(null);
  };

  const handleOpenModal = (patient?: Paciente) => {
    resetForm();
    if (patient) {
      setEditingId(patient.id);
      setNombre(patient.nombre);
      setEdad(patient.edad.toString());
      setSexo(patient.sexo);
      setPeso(patient.peso.toString());
      setTalla(patient.talla.toString());
      setPorcentajeGrasa(patient.porcentajeGrasa?.toString() || '');
      setCintura(patient.circunferenciaCintura?.toString() || '');
      setCadera(patient.circunferenciaCadera?.toString() || '');
      setDiagnostico(patient.diagnostico);
      setMedicamentos(patient.medicamentos || []);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!nombre.trim()) return setError('El nombre completo es obligatorio.');
    
    const parsedEdad = parseInt(edad);
    if (isNaN(parsedEdad) || parsedEdad < 0) return setError('La edad debe ser un número válido.');
    
    const parsedPeso = parseFloat(peso);
    if (isNaN(parsedPeso) || parsedPeso <= 0) return setError('El peso debe ser mayor a 0 kg.');
    
    const parsedTalla = parseFloat(talla);
    if (isNaN(parsedTalla) || parsedTalla <= 0 || parsedTalla > 3) return setError('La talla debe estar en metros (ej. 1.70).');

    const payload: Paciente = {
      id: editingId || crypto.randomUUID(),
      nombre: nombre.trim(),
      edad: parsedEdad,
      sexo,
      peso: parsedPeso,
      talla: parsedTalla,
      imc: parseFloat(imcCalculado),
      porcentajeGrasa: porcentajeGrasa ? parseFloat(porcentajeGrasa) : undefined,
      circunferenciaCintura: cintura ? parseFloat(cintura) : undefined,
      circunferenciaCadera: cadera ? parseFloat(cadera) : undefined,
      diagnostico,
      medicamentos,
    };

    if (editingId) {
      updatePatient(editingId, payload);
      toast.success('Expediente actualizado con éxito');
    } else {
      addPatient(payload);
      toast.success('Paciente registrado correctamente');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    removePatient(id);
    toast.success('Paciente eliminado del sistema');
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in-up">
      <header className="flex justify-between items-end mt-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 flex items-center gap-2">
            <Users size={32} />
            Gestión de Pacientes
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control clínico, mediciones avanzadas y lista de medicamentos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 md:px-6 md:py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={24} />
          <span className="hidden md:inline font-semibold">Añadir Paciente</span>
        </button>
      </header>

      {/* Grid de Pacientes */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {patients.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">No hay pacientes registrados en la base de datos.</p>
          </div>
        ) : (
          patients.map(patient => {
            const imcCat = getIMCCategory(patient.imc);
            
            return (
              <div key={patient.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  imcCat.label === 'Normal' ? 'bg-emerald-500' :
                  imcCat.label === 'Bajo peso' ? 'bg-orange-500' :
                  imcCat.label === 'Sobrepeso' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                
                <div>
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight truncate pr-2" title={patient.nombre}>{patient.nombre}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {patient.edad} años • {patient.sexo}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenModal(patient)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(patient.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="pl-2 mt-4 grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Peso</p>
                      <p className="font-bold text-gray-700">{patient.peso}kg</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Talla</p>
                      <p className="font-bold text-gray-700">{patient.talla}m</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 flex justify-center items-center gap-1">
                        IMC
                      </p>
                      <p className={`font-bold ${imcCat.color}`}>{patient.imc}</p>
                    </div>
                  </div>

                  <div className="pl-2 mt-3 flex flex-wrap gap-1">
                    {patient.diagnostico.slice(0, 3).map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                        {d}
                      </span>
                    ))}
                    {patient.diagnostico.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">
                        +{patient.diagnostico.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Modal Formulario (Centrado en todas las resoluciones) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 animate-fade-in-up">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center gap-2">
                <Activity size={24} className="text-emerald-600"/>
                {editingId ? 'Editar Expediente' : 'Nuevo Paciente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda: Datos Básicos */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Datos Básicos
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input 
                      type="text" 
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Edad *</label>
                      <input 
                        type="number" 
                        value={edad}
                        onChange={(e) => setEdad(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Años"
                        min="0"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sexo *</label>
                      <select 
                        value={sexo} 
                        onChange={(e) => setSexo(e.target.value as Paciente['sexo'])}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnósticos Clínicos</label>
                    <div className="flex flex-wrap gap-2">
                      {patologiasDisponibles.map(p => {
                        const isActive = diagnostico.includes(p);
                        return (
                          <button
                            key={p}
                            onClick={() => togglePatologia(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                              isActive 
                                ? 'bg-emerald-500 text-white shadow-sm' 
                                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Antropometría y Medicación */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Mediciones Antropométricas
                  </h3>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Peso (kg) *</label>
                      <input 
                        type="number" 
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Ej. 70.5"
                        step="0.1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Talla (m) *</label>
                      <input 
                        type="number" 
                        value={talla}
                        onChange={(e) => setTalla(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Ej. 1.75"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center border border-emerald-100">
                    <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider">IMC Dinámico:</span>
                    <span className="text-emerald-700 font-black text-xl">{imcCalculado}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">% Grasa</label>
                      <input type="number" value={porcentajeGrasa} onChange={e => setPorcentajeGrasa(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-50" placeholder="%" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cintura</label>
                      <input type="number" value={cintura} onChange={e => setCintura(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-50" placeholder="cm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cadera</label>
                      <input type="number" value={cadera} onChange={e => setCadera(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-50" placeholder="cm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Lista de Medicamentos</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={nuevoMed}
                        onChange={(e) => setNuevoMed(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && agregarMedicamento()}
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Añadir medicamento..."
                      />
                      <button 
                        onClick={agregarMedicamento}
                        className="bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    {medicamentos.length > 0 && (
                      <ul className="space-y-1.5 max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-xl border border-gray-100">
                        {medicamentos.map((med, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-gray-700 font-medium">{med}</span>
                            <button onClick={() => removerMedicamento(idx)} className="text-gray-400 hover:text-red-500">
                              <X size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 md:py-4 rounded-xl text-gray-600 font-semibold bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 md:py-4 rounded-xl text-white font-semibold bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Guardar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
