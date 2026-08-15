import type { Paciente, ParametroClinico } from '@/types';

export interface RiesgoNutricional {
  tipo: 'IMC' | 'CB' | 'CP';
  nivel: 'info' | 'warning' | 'danger';
  descripcion: string;
  valor?: number;
  umbral?: number;
}

export interface ClasificacionIMC {
  label: string;
  color: string;
  bgColor: string;
  esNormopeso: boolean;
}

/** Clasificación IMC para pacientes adultos mayores */
export const clasificarIMC = (imc: number): ClasificacionIMC => {
  if (imc <= 0) return { label: 'Sin datos', color: 'text-gray-400', bgColor: 'bg-gray-100', esNormopeso: false };
  if (imc < 16)  return { label: 'Desnutrición grave', color: 'text-red-700', bgColor: 'bg-red-100', esNormopeso: false };
  if (imc < 17)  return { label: 'Desnutrición moderada', color: 'text-red-600', bgColor: 'bg-red-50', esNormopeso: false };
  if (imc < 18.5) return { label: 'Desnutrición leve', color: 'text-orange-600', bgColor: 'bg-orange-50', esNormopeso: false };
  if (imc < 22)  return { label: 'Peso insuficiente', color: 'text-orange-500', bgColor: 'bg-orange-50', esNormopeso: false };
  if (imc < 27)  return { label: 'Normopeso', color: 'text-emerald-600', bgColor: 'bg-emerald-50', esNormopeso: true };
  if (imc < 30)  return { label: 'Sobrepeso', color: 'text-yellow-600', bgColor: 'bg-yellow-50', esNormopeso: false };
  if (imc < 35)  return { label: 'Obesidad grado I', color: 'text-amber-600', bgColor: 'bg-amber-50', esNormopeso: false };
  if (imc < 40)  return { label: 'Obesidad grado II', color: 'text-orange-700', bgColor: 'bg-orange-100', esNormopeso: false };
  if (imc < 50)  return { label: 'Obesidad grado III', color: 'text-red-600', bgColor: 'bg-red-50', esNormopeso: false };
  return { label: 'Obesidad grado IV (extrema)', color: 'text-red-700', bgColor: 'bg-red-100', esNormopeso: false };
};

/** Tabla IMC para ancianos (solo lectura, informativa) */
export const TABLA_IMC_ANCIANOS = [
  { valoracion: 'Desnutrición grave',          rango: '< 16 kg/m²' },
  { valoracion: 'Desnutrición moderada',        rango: '16 – 16.9 kg/m²' },
  { valoracion: 'Desnutrición leve',            rango: '17 – 18.4 kg/m²' },
  { valoracion: 'Peso insuficiente',            rango: '18.5 – 22 kg/m²' },
  { valoracion: 'Normopeso',                   rango: '22 – 27 kg/m²' },
  { valoracion: 'Sobrepeso',                   rango: '27 – 29.9 kg/m²' },
  { valoracion: 'Obesidad grado I',             rango: '30 – 34.9 kg/m²' },
  { valoracion: 'Obesidad grado II',            rango: '35 – 39.9 kg/m²' },
  { valoracion: 'Obesidad grado III',           rango: '40 – 49.9 kg/m²' },
  { valoracion: 'Obesidad grado IV (extrema)',  rango: '≥ 50 kg/m²' },
];

export const calcularRiesgos = (
  paciente: Pick<Paciente, 'imc' | 'sexo' | 'circunferenciaBraquial' | 'circunferenciaPantorrilla'>,
  parametros: ParametroClinico[]
): RiesgoNutricional[] => {
  const riesgos: RiesgoNutricional[] = [];

  const imcClasif = clasificarIMC(paciente.imc);
  if (paciente.imc > 0 && !imcClasif.esNormopeso) {
    const nivel: RiesgoNutricional['nivel'] = paciente.imc < 17 ? 'danger' : 'warning';
    riesgos.push({ tipo: 'IMC', nivel, descripcion: `${imcClasif.label} (IMC: ${paciente.imc.toFixed(1)})`, valor: paciente.imc });
  }

  const cbParam = parametros.find(p => p.nombre === 'cb_riesgo');
  if (cbParam && paciente.circunferenciaBraquial !== undefined) {
    const umbral = paciente.sexo === 'M' ? cbParam.valor_hombre : cbParam.valor_mujer;
    if (paciente.circunferenciaBraquial < umbral) {
      riesgos.push({ tipo: 'CB', nivel: 'danger', descripcion: `CB baja: ${paciente.circunferenciaBraquial} cm (umbral ${umbral} cm)`, valor: paciente.circunferenciaBraquial, umbral });
    }
  }

  const cpParam = parametros.find(p => p.nombre === 'cp_riesgo');
  if (cpParam && paciente.circunferenciaPantorrilla !== undefined) {
    const umbral = paciente.sexo === 'M' ? cpParam.valor_hombre : cpParam.valor_mujer;
    if (paciente.circunferenciaPantorrilla < umbral) {
      riesgos.push({ tipo: 'CP', nivel: 'danger', descripcion: `CP baja: ${paciente.circunferenciaPantorrilla} cm (umbral ${umbral} cm)`, valor: paciente.circunferenciaPantorrilla, umbral });
    }
  }

  return riesgos;
};
