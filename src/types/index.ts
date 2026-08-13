export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string;
}

export type CategoriaAlimento = 
  | 'Cereales/tubérculos'
  | 'Frutas'
  | 'Vegetales'
  | 'Lácteos'
  | 'Carnes/mariscos/huevos'
  | 'Leguminosas'
  | 'Grasas/semillas'
  | 'Azúcares'
  | 'Otros';

export type CondicionClinica = string;

export interface Lote {
  id: string;
  fechaIngreso: string; // ISO 8601
  fechaVencimiento?: string; // ISO 8601
  cantidadOriginal: number;
  cantidadRestante: number;
}

export interface MovimientoInventario {
  id: string;
  fecha: string; // ISO 8601 con hora
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  loteId?: string; // Opcional, puede afectar múltiples lotes o ninguno específico
  motivo?: string;
}

export interface Alimento {
  id: string;
  nombre: string;
  // cantidadTotal es derivado, pero lo guardamos para fácil acceso
  cantidadTotal: number;
  unidad: 'kg' | 'g' | 'l' | 'ml' | 'unidades' | 'tazas' | 'cucharadas';
  categoria: CategoriaAlimento;
  grupoAlimento?: string; // Grupo de intercambio del catálogo
  lotes: Lote[];
  movimientos: MovimientoInventario[];
  // Información Nutricional (por cada 100g o 100ml)
  caloriasPor100g?: number;
  proteinasPor100g?: number;
  grasasPor100g?: number;
  carbohidratosPor100g?: number;
}

export interface IngredienteReceta {
  nombre: string;
  cantidad: number;
  unidad: string;
  sustitutoSugerido?: string;
}

export interface Macronutrientes {
  proteinasPorcentaje: number;
  carbohidratosPorcentaje: number;
  grasasPorcentaje: number;
}

export interface Receta {
  id: string;
  titulo: string;
  ingredientes: IngredienteReceta[];
  procedimiento: string[];
  porciones: number;
  calorias: number;
  proteinas: number; // en gramos
  macros?: Macronutrientes;
  aptoPara: CondicionClinica[];
  imagenUrl?: string; // Para mejor estética
}

export interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  sexo: 'M' | 'F' | 'Otro';
  peso: number; // kg
  talla: number; // metros
  imc: number;
  // Nuevas mediciones antropométricas opcionales
  porcentajeGrasa?: number;
  circunferenciaCintura?: number; // cm
  circunferenciaCadera?: number; // cm
  diagnostico: CondicionClinica[];
  medicamentos: string[];
}
