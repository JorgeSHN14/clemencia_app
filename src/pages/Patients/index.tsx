import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Plus, Edit2, Trash2, Activity, X, AlertTriangle,
  Settings, Info, CheckSquare, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePatientStore } from '@/store/usePatientStore';
import { useParametrosStore } from '@/store/useParametrosStore';
import type { Paciente, CondicionClinicaDetalle, CategoriaCondicion } from '@/types';
import { calcularRiesgos, clasificarIMC, TABLA_IMC_ANCIANOS } from '@/utils/riesgos';

// ─── Subcomponente: Badge de Riesgo en card ─────────────────────────────────
const RiesgoBadge: React.FC<{ patient: Paciente; parametros: any[] }> = ({ patient, parametros }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const riesgos = calcularRiesgos(patient, parametros);

  if (riesgos.length === 0) return null;

  const hasDanger = riesgos.some(r => r.nivel === 'danger');

  return (
    <>
      <div className="relative">
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className={`p-1.5 rounded-lg transition-colors ${hasDanger ? 'text-red-500 hover:bg-red-50' : 'text-yellow-500 hover:bg-yellow-50'}`}
          title="Ver riesgos nutricionales"
        >
          <AlertTriangle size={16} />
        </button>

        {showTooltip && !showModal && (
          <div className="absolute right-0 top-8 z-40 bg-gray-900 text-white text-xs rounded-xl p-3 w-52 shadow-2xl">
            <p className="font-bold mb-1.5 text-yellow-300">Riesgos detectados:</p>
            <ul className="space-y-1">
              {riesgos.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.nivel === 'danger' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <span>{r.descripcion}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-gray-400 text-[10px]">Click para ver detalle</p>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Riesgos Nutricionales
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Paciente: <span className="font-semibold text-gray-800">{patient.nombre}</span>
            </p>

            <div className="space-y-3">
              {riesgos.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${r.nivel === 'danger' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.nivel === 'danger' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {r.tipo}
                    </span>
                    <span className={`text-xs font-semibold ${r.nivel === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                      {r.nivel === 'danger' ? 'Riesgo Nutricional' : 'Advertencia'}
                    </span>
                  </div>
                  <p className={`text-sm ${r.nivel === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                    {r.descripcion}
                  </p>
                  {r.umbral && (
                    <p className="text-xs text-gray-500 mt-1">Valor actual: {r.valor} cm | Umbral: {r.umbral} cm</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Subcomponente: Alerta inline de riesgo ─────────────────────────────────
const AlertaRiesgo: React.FC<{ mensaje: string }> = ({ mensaje }) => (
  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded-lg mt-1">
    <AlertTriangle size={14} className="flex-shrink-0" />
    <span>{mensaje}</span>
  </div>
);

// ─── Subcomponente: Toggle multi-select de condiciones ──────────────────────
const COLOR_STYLES: Record<string, { label: string; active: string; inactive: string }> = {
  blue:   { label: 'text-blue-700',   active: 'bg-blue-500 text-white shadow-sm',   inactive: 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50' },
  purple: { label: 'text-purple-700', active: 'bg-purple-500 text-white shadow-sm', inactive: 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50' },
  amber:  { label: 'text-amber-700',  active: 'bg-amber-500 text-white shadow-sm',  inactive: 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50' },
  emerald:{ label: 'text-emerald-700',active: 'bg-emerald-500 text-white shadow-sm',inactive: 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50' },
};

const ToggleGroup: React.FC<{
  titulo: string;
  items: CondicionClinicaDetalle[];
  seleccionados: string[];
  onToggle: (nombre: string) => void;
  colorClass?: string;
}> = ({ titulo, items, seleccionados, onToggle, colorClass = 'emerald' }) => {
  if (items.length === 0) return null;
  const styles = COLOR_STYLES[colorClass] ?? COLOR_STYLES.emerald;
  return (
    <div>
      <p className={`text-[10px] font-bold ${styles.label} uppercase tracking-wider mb-1.5`}>{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const isActive = seleccionados.includes(item.nombre);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.nombre)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${isActive ? styles.active : styles.inactive}`}
            >
              {item.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export const Patients: React.FC = () => {
  const { patients, addPatient, updatePatient, removePatient } = usePatientStore();
  const {
    parametros, condiciones,
    fetchParametros, updateParametro,
    fetchCondiciones, addCondicion, updateCondicionCategoria, removeCondicion
  } = useParametrosStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [paramsTab, setParamsTab] = useState<'umbrales' | 'condiciones'>('umbrales');

  // Formulario de parámetros
  const [editingParam, setEditingParam] = useState<Record<string, { h: string; m: string }>>({});
  const [nuevaCondNombre, setNuevaCondNombre] = useState('');
  const [nuevaCondCategoria, setNuevaCondCategoria] = useState<CategoriaCondicion>('comorbilidad');

  useEffect(() => {
    fetchParametros();
    fetchCondiciones();
  }, []);

  // ── Form State ──
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [sexo, setSexo] = useState<Paciente['sexo']>('M');
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [porcentajeGrasa, setPorcentajeGrasa] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [cb, setCb] = useState('');
  const [cp, setCp] = useState('');
  const [diagnostico, setDiagnostico] = useState<string[]>([]);
  const [discapacidadFisica, setDiscapacidadFisica] = useState<string[]>([]);
  const [dificultadMasticacion, setDificultadMasticacion] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [medicamentos, setMedicamentos] = useState<string[]>([]);
  const [nuevoMed, setNuevoMed] = useState('');
  const [error, setError] = useState('');

  // ── IMC Dinámico ──
  const imcCalculado = useMemo(() => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (!isNaN(p) && !isNaN(t) && t > 0) return (p / (t * t)).toFixed(1);
    return '0.0';
  }, [peso, talla]);

  const imcClasif = useMemo(() => clasificarIMC(parseFloat(imcCalculado)), [imcCalculado]);

  // ── Alertas inline CB/CP ──
  const cbRiesgo = useMemo(() => {
    const val = parseFloat(cb);
    const cbParam = parametros.find(p => p.nombre === 'cb_riesgo');
    if (!cbParam || isNaN(val)) return null;
    const umbral = sexo === 'M' ? cbParam.valor_hombre : cbParam.valor_mujer;
    return val < umbral ? `CB por debajo del umbral (${umbral} cm para ${sexo === 'M' ? 'hombres' : 'mujeres'})` : null;
  }, [cb, sexo, parametros]);

  const cpRiesgo = useMemo(() => {
    const val = parseFloat(cp);
    const cpParam = parametros.find(p => p.nombre === 'cp_riesgo');
    if (!cpParam || isNaN(val)) return null;
    const umbral = sexo === 'M' ? cpParam.valor_hombre : cpParam.valor_mujer;
    return val < umbral ? `CP por debajo del umbral (${umbral} cm para ${sexo === 'M' ? 'hombres' : 'mujeres'})` : null;
  }, [cp, sexo, parametros]);

  // ── Condiciones por categoría ──
  const comorbilidades = condiciones.filter(c => c.categoria === 'comorbilidad');
  const discapacidades = condiciones.filter(c => c.categoria === 'discapacidad');
  const dificultades   = condiciones.filter(c => c.categoria === 'dificultad');

  const toggleCondicion = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    current: string[],
    nombre: string
  ) => {
    setter(current.includes(nombre) ? current.filter(x => x !== nombre) : [...current, nombre]);
  };

  // ── Medicamentos ──
  const agregarMedicamento = () => {
    if (!nuevoMed.trim()) return;
    setMedicamentos(prev => [...prev, nuevoMed.trim()]);
    setNuevoMed('');
  };
  const removerMedicamento = (idx: number) => setMedicamentos(prev => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setNombre(''); setEdad(''); setSexo('M'); setPeso(''); setTalla('');
    setPorcentajeGrasa(''); setCintura(''); setCadera(''); setCb(''); setCp('');
    setDiagnostico([]); setDiscapacidadFisica([]); setDificultadMasticacion(false);
    setObservaciones(''); setMedicamentos([]); setNuevoMed(''); setError('');
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
      setCb(patient.circunferenciaBraquial?.toString() || '');
      setCp(patient.circunferenciaPantorrilla?.toString() || '');
      setDiagnostico(patient.diagnostico || []);
      setDiscapacidadFisica(patient.discapacidadFisica || []);
      setDificultadMasticacion(patient.dificultadMasticacion || false);
      setObservaciones(patient.observaciones || '');
      setMedicamentos(patient.medicamentos || []);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) return setError('El nombre completo es obligatorio.');
    const parsedEdad = parseInt(edad);
    if (isNaN(parsedEdad) || parsedEdad < 0) return setError('La edad debe ser un número válido.');
    const parsedPeso = parseFloat(peso);
    if (isNaN(parsedPeso) || parsedPeso <= 0) return setError('El peso debe ser mayor a 0 kg.');
    const parsedTalla = parseFloat(talla);
    if (isNaN(parsedTalla) || parsedTalla <= 0 || parsedTalla > 3) return setError('La talla debe estar en metros (ej. 1.70).');

    const payload: Omit<Paciente, 'id'> = {
      nombre: nombre.trim(),
      edad: parsedEdad,
      sexo,
      peso: parsedPeso,
      talla: parsedTalla,
      imc: parseFloat(imcCalculado),
      porcentajeGrasa: porcentajeGrasa ? parseFloat(porcentajeGrasa) : undefined,
      circunferenciaCintura: cintura ? parseFloat(cintura) : undefined,
      circunferenciaCadera: cadera ? parseFloat(cadera) : undefined,
      circunferenciaBraquial: cb ? parseFloat(cb) : undefined,
      circunferenciaPantorrilla: cp ? parseFloat(cp) : undefined,
      diagnostico,
      discapacidadFisica,
      dificultadMasticacion,
      observaciones: observaciones.trim() || undefined,
      medicamentos,
    };

    try {
      if (editingId) {
        await updatePatient(editingId, payload);
        toast.success('Expediente actualizado con éxito');
      } else {
        await addPatient(payload);
        toast.success('Paciente registrado correctamente');
      }
      setIsModalOpen(false);
    } catch {
      setError('Error al guardar. Verifica la conexión e intenta de nuevo.');
    }
  };

  const handleDelete = async (id: string) => {
    await removePatient(id);
    toast.success('Paciente eliminado del sistema');
  };

  // ── Panel Parámetros: inicializar estado de edición ──
  const openParamsModal = () => {
    const init: Record<string, { h: string; m: string }> = {};
    parametros.forEach(p => {
      init[p.id] = { h: p.valor_hombre.toString(), m: p.valor_mujer.toString() };
    });
    setEditingParam(init);
    setIsParamsModalOpen(true);
  };

  const handleSaveParam = async (id: string) => {
    const vals = editingParam[id];
    if (!vals) return;
    try {
      await updateParametro(id, parseFloat(vals.h), parseFloat(vals.m));
      toast.success('Parámetro actualizado');
    } catch {
      toast.error('Error al actualizar parámetro');
    }
  };

  const handleAddCondicion = async () => {
    if (!nuevaCondNombre.trim()) return;
    try {
      await addCondicion(nuevaCondNombre.trim(), nuevaCondCategoria);
      setNuevaCondNombre('');
      toast.success('Condición agregada');
    } catch {
      toast.error('Error al agregar condición (puede estar duplicada)');
    }
  };

  const categoriaBadgeColor = (cat: CategoriaCondicion) => {
    if (cat === 'comorbilidad') return 'bg-blue-100 text-blue-700';
    if (cat === 'discapacidad') return 'bg-purple-100 text-purple-700';
    return 'bg-amber-100 text-amber-700';
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
        <div className="flex gap-2">
          <button
            onClick={openParamsModal}
            className="border border-emerald-300 text-emerald-700 hover:bg-emerald-50 p-3 md:px-4 md:py-3 rounded-xl transition-all flex items-center gap-2"
          >
            <Settings size={20} />
            <span className="hidden md:inline font-semibold text-sm">Parámetros</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 md:px-6 md:py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={24} />
            <span className="hidden md:inline font-semibold">Añadir Paciente</span>
          </button>
        </div>
      </header>

      {/* ── Grid de Pacientes ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {patients.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-500 text-sm">No hay pacientes registrados en la base de datos.</p>
          </div>
        ) : (
          patients.map(patient => {
            const imcCat = clasificarIMC(patient.imc);
            const barColor =
              imcCat.esNormopeso ? 'bg-emerald-500' :
              patient.imc < 22 ? 'bg-orange-500' :
              patient.imc < 30 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div
                key={patient.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />

                <div>
                  <div className="flex justify-between items-start pl-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-800 text-lg leading-tight truncate pr-2" title={patient.nombre}>
                        {patient.nombre}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {patient.edad} años • {patient.sexo === 'M' ? 'Masculino' : patient.sexo === 'F' ? 'Femenino' : 'Otro'}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <RiesgoBadge patient={patient} parametros={parametros} />
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
                    <div className={`p-2 rounded-lg text-center ${imcCat.bgColor}`}>
                      <p className="text-[10px] uppercase font-bold text-gray-400">IMC</p>
                      <p className={`font-bold text-sm ${imcCat.color}`}>{patient.imc}</p>
                    </div>
                  </div>

                  {!imcCat.esNormopeso && patient.imc > 0 && (
                    <div className="pl-2 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${imcCat.bgColor} ${imcCat.color}`}>
                        {imcCat.label}
                      </span>
                    </div>
                  )}

                  <div className="pl-2 mt-3 flex flex-wrap gap-1">
                    {patient.diagnostico.slice(0, 2).map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">{d}</span>
                    ))}
                    {patient.discapacidadFisica?.slice(0, 1).map((d, i) => (
                      <span key={`d${i}`} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md">{d}</span>
                    ))}
                    {patient.dificultadMasticacion && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">Dif. masticación</span>
                    )}
                    {(patient.diagnostico.length + (patient.discapacidadFisica?.length || 0)) > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">
                        +{(patient.diagnostico.length + (patient.discapacidadFisica?.length || 0)) - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── Modal Formulario ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-6 animate-fade-in-up">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center gap-2">
                <Activity size={24} className="text-emerald-600" />
                {editingId ? 'Editar Expediente' : 'Nuevo Paciente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── COLUMNA IZQUIERDA: Datos Básicos + Detalles Clínicos ── */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Datos Básicos
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input
                      type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Edad *</label>
                      <input
                        type="number" value={edad} onChange={e => setEdad(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Años" min="0"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sexo *</label>
                      <select
                        value={sexo} onChange={e => setSexo(e.target.value as Paciente['sexo'])}
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {/* Detalles Clínicos ─────────── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                      Detalles Clínicos
                    </h3>

                    <ToggleGroup
                      titulo="Comorbilidades"
                      items={comorbilidades}
                      seleccionados={diagnostico}
                      onToggle={n => toggleCondicion(setDiagnostico, diagnostico, n)}
                      colorClass="blue"
                    />

                    <ToggleGroup
                      titulo="Discapacidad Física"
                      items={discapacidades}
                      seleccionados={discapacidadFisica}
                      onToggle={n => toggleCondicion(setDiscapacidadFisica, discapacidadFisica, n)}
                      colorClass="purple"
                    />

                    {/* Dificultades */}
                    {dificultades.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Dificultades</p>
                        <div className="space-y-1.5">
                          {dificultades.map(d => {
                            const isChecked = d.nombre === 'Dificultad para masticar/deglutir'
                              ? dificultadMasticacion
                              : diagnostico.includes(d.nombre);
                            return (
                              <button
                                key={d.id}
                                onClick={() => {
                                  if (d.nombre === 'Dificultad para masticar/deglutir') {
                                    setDificultadMasticacion(prev => !prev);
                                  } else {
                                    toggleCondicion(setDiagnostico, diagnostico, d.nombre);
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                                  isChecked
                                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-amber-200'
                                }`}
                              >
                                {isChecked ? <CheckSquare size={14} className="text-amber-600" /> : <Square size={14} className="text-gray-400" />}
                                {d.nombre}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Observaciones</label>
                      <textarea
                        value={observaciones}
                        onChange={e => setObservaciones(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 resize-none"
                        placeholder="Observaciones generales del paciente..."
                      />
                    </div>
                  </div>
                </div>

                {/* ── COLUMNA DERECHA: Antropometría + Medicamentos ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Mediciones Antropométricas
                  </h3>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Peso (kg) *</label>
                      <input
                        type="number" value={peso} onChange={e => setPeso(e.target.value)} step="0.1"
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Ej. 70.5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Talla (m) *</label>
                      <input
                        type="number" value={talla} onChange={e => setTalla(e.target.value)} step="0.01"
                        className="w-full border border-gray-200 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Ej. 1.75"
                      />
                    </div>
                  </div>

                  {/* IMC con clasificación ancianos */}
                  <div className={`p-3 rounded-xl flex justify-between items-center border ${imcClasif.bgColor} border-opacity-50`}>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">IMC:</span>
                      <span className={`ml-2 font-black text-xl ${imcClasif.color}`}>{imcCalculado}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${imcClasif.bgColor} ${imcClasif.color}`}>
                      {imcClasif.label}
                    </span>
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

                  {/* CB y CP con alertas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        CB — Circ. Braquial (cm)
                      </label>
                      <input
                        type="number" value={cb} onChange={e => setCb(e.target.value)} step="0.1"
                        className={`w-full border rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 ${cbRiesgo ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Ej. 27"
                      />
                      {cbRiesgo && <AlertaRiesgo mensaje={cbRiesgo} />}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        CP — Circ. Pantorrilla (cm)
                      </label>
                      <input
                        type="number" value={cp} onChange={e => setCp(e.target.value)} step="0.1"
                        className={`w-full border rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 ${cpRiesgo ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Ej. 30"
                      />
                      {cpRiesgo && <AlertaRiesgo mensaje={cpRiesgo} />}
                    </div>
                  </div>

                  {/* Medicamentos */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Lista de Medicamentos</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text" value={nuevoMed} onChange={e => setNuevoMed(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && agregarMedicamento()}
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                        placeholder="Añadir medicamento..."
                      />
                      <button onClick={agregarMedicamento} className="bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-lg transition-colors">
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

      {/* ── Modal de Parámetros ── */}
      {isParamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                <Settings size={22} className="text-emerald-600" />
                Configuración de Parámetros
              </h2>
              <button onClick={() => setIsParamsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {(['umbrales', 'condiciones'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setParamsTab(tab)}
                  className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                    paramsTab === tab
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'umbrales' ? 'Umbrales Antropométricos' : 'Condiciones Clínicas'}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {paramsTab === 'umbrales' && (
                <div className="space-y-6">
                  {/* Parámetros editables */}
                  {parametros.map(param => (
                    <div key={param.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="font-semibold text-gray-800 mb-0.5">
                        {param.nombre === 'cb_riesgo' ? 'Circunferencia Braquial (CB)' : 'Circunferencia de Pantorrilla (CP)'}
                      </p>
                      {param.descripcion && (
                        <p className="text-xs text-gray-500 mb-3">{param.descripcion}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Umbral Hombres (cm)</label>
                          <input
                            type="number" step="0.1"
                            value={editingParam[param.id]?.h ?? param.valor_hombre}
                            onChange={e => setEditingParam(prev => ({ ...prev, [param.id]: { ...prev[param.id], h: e.target.value } }))}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-pink-600 uppercase mb-1">Umbral Mujeres (cm)</label>
                          <input
                            type="number" step="0.1"
                            value={editingParam[param.id]?.m ?? param.valor_mujer}
                            onChange={e => setEditingParam(prev => ({ ...prev, [param.id]: { ...prev[param.id], m: e.target.value } }))}
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleSaveParam(param.id)}
                        className="mt-3 text-xs font-semibold px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  ))}

                  {/* Tabla IMC (solo lectura) */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={16} className="text-emerald-600" />
                      <p className="font-semibold text-gray-700 text-sm">Clasificación IMC para Adultos Mayores</p>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Solo lectura</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-200">
                          <th className="pb-2 font-bold">Valoración</th>
                          <th className="pb-2 font-bold text-right">IMC (kg/m²)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {TABLA_IMC_ANCIANOS.map((row, i) => (
                          <tr key={i} className={`${row.valoracion === 'Normopeso' ? 'bg-emerald-50' : ''}`}>
                            <td className={`py-1.5 font-medium ${row.valoracion === 'Normopeso' ? 'text-emerald-700' : 'text-gray-700'}`}>
                              {row.valoracion}
                            </td>
                            <td className="py-1.5 text-right text-gray-500">{row.rango}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {paramsTab === 'condiciones' && (
                <div className="space-y-4">
                  {/* Agregar nueva condición */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="font-semibold text-gray-700 text-sm mb-3">Agregar nueva condición</p>
                    <div className="flex gap-2">
                      <input
                        type="text" value={nuevaCondNombre} onChange={e => setNuevaCondNombre(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCondicion()}
                        className="flex-1 border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Nombre de la condición"
                      />
                      <select
                        value={nuevaCondCategoria} onChange={e => setNuevaCondCategoria(e.target.value as CategoriaCondicion)}
                        className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="comorbilidad">Comorbilidad</option>
                        <option value="discapacidad">Discapacidad</option>
                        <option value="dificultad">Dificultad</option>
                      </select>
                      <button onClick={handleAddCondicion} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Lista de condiciones */}
                  <div className="space-y-2">
                    {condiciones.map(cond => (
                      <div key={cond.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                        <span className="flex-1 text-sm font-medium text-gray-700">{cond.nombre}</span>
                        <select
                          value={cond.categoria}
                          onChange={async e => {
                            await updateCondicionCategoria(cond.id, e.target.value as CategoriaCondicion);
                            toast.success('Categoría actualizada');
                          }}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${categoriaBadgeColor(cond.categoria)}`}
                        >
                          <option value="comorbilidad">Comorbilidad</option>
                          <option value="discapacidad">Discapacidad</option>
                          <option value="dificultad">Dificultad</option>
                        </select>
                        <button
                          onClick={async () => {
                            await removeCondicion(cond.id);
                            toast.success('Condición eliminada');
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {condiciones.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No hay condiciones registradas.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
