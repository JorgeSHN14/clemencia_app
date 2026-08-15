/**
 * Estimación de vida útil por grupo de alimento.
 * Valores en días desde la fecha de ingreso.
 */

const VIDA_UTIL_POR_GRUPO: Record<string, number> = {
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

const VIDA_UTIL_DEFAULT = 30;

/**
 * Estima la fecha de vencimiento para un alimento dado su grupo.
 * @param grupo - Nombre del grupo del catálogo
 * @param parametrosDinamicos - Mapeo de grupo -> días desde la base de datos
 * @param fechaBase - Fecha de referencia (por defecto hoy)
 * @returns Fecha en formato ISO 'YYYY-MM-DD'
 */
export function estimarFechaVencimiento(
  grupo: string, 
  parametrosDinamicos?: Record<string, number>,
  fechaBase: Date = new Date()
): string {
  const dias = parametrosDinamicos?.[grupo] ?? VIDA_UTIL_POR_GRUPO[grupo] ?? VIDA_UTIL_DEFAULT;
  const fecha = new Date(fechaBase);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split('T')[0];
}

/**
 * Retorna la vida útil estimada en días para un grupo.
 */
export function getDiasVidaUtil(grupo: string, parametrosDinamicos?: Record<string, number>): number {
  return parametrosDinamicos?.[grupo] ?? VIDA_UTIL_POR_GRUPO[grupo] ?? VIDA_UTIL_DEFAULT;
}

/**
 * Convierte cantidad entre unidades compatibles.
 * Devuelve null si las unidades no son compatibles.
 *
 * Masa: kg <-> g  (1 kg = 1000 g)
 * Volumen: l <-> ml  (1 l = 1000 ml)
 */
export function convertirUnidad(
  cantidad: number,
  desde: string,
  hacia: string
): number | null {
  if (desde === hacia) return cantidad;

  const conversiones: Record<string, { base: string; factor: number }> = {
    'kg': { base: 'g', factor: 1000 },
    'g':  { base: 'g', factor: 1 },
    'l':  { base: 'ml', factor: 1000 },
    'ml': { base: 'ml', factor: 1 },
  };

  const desdeCfg = conversiones[desde];
  const haciaCfg = conversiones[hacia];

  if (!desdeCfg || !haciaCfg) return null;
  if (desdeCfg.base !== haciaCfg.base) return null;

  const enBase = cantidad * desdeCfg.factor;
  return enBase / haciaCfg.factor;
}

/**
 * Retorna true si dos unidades son compatibles para conversión.
 */
export function sonUnidadesCompatibles(u1: string, u2: string): boolean {
  return convertirUnidad(1, u1, u2) !== null;
}

/**
 * Grupo de unidades para masa y volumen.
 */
export const UNIDADES_MASA = ['kg', 'g'];
export const UNIDADES_VOLUMEN = ['l', 'ml'];
export const UNIDADES_CONVERTIBLES = [...UNIDADES_MASA, ...UNIDADES_VOLUMEN];
