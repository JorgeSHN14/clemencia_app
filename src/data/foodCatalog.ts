/**
 * Catálogo maestro de alimentos con datos nutricionales.
 * Fuente: grupos_alimentos_completo.json (958 alimentos en 11 grupos)
 * 
 * Usado para:
 * - Búsqueda y autocompletado en formularios
 * - Validación de alimentos al registrar entradas
 * - Proveer info nutricional al generador de recetas
 */

import catalogoRaw from '../../grupos_alimentos_completo.json';
import type { CategoriaAlimento } from '@/types';

export interface AlimentoCatalogo {
  nombre: string;
  grupo: string;
  categoria: CategoriaAlimento;
  energiaKcal: number | null;
  proteinaG: number | null;
  grasaTotalG: number | null;
  carbohidratosG: number | null;
  unidadBase: string; // 'g' o 'ml'
}

interface GrupoRaw {
  grupo: string;
  alimentos: {
    alimento: string;
    energia_kcal: number | null;
    proteina_g: number | null;
    grasa_total_g: number | null;
    carbohidratos_g: number | null;
  }[];
}

// Mapeo de grupos del JSON → categorías de la app
const GRUPO_TO_CATEGORIA: Record<string, CategoriaAlimento> = {
  'Cereales, tubérculos y plátanos': 'Cereales/tubérculos',
  'Frutas': 'Frutas',
  'Vegetales': 'Vegetales',
  'Leguminosas': 'Leguminosas',
  'Carnes y embutidos': 'Carnes/mariscos/huevos',
  'Pescados y mariscos': 'Carnes/mariscos/huevos',
  'Grasas y frutos secos': 'Grasas/semillas',
  'Azucares': 'Azúcares',
  'Snacks': 'Otros',
  'Alimentos expresados en 100 ml': 'Otros',
  'Lacteos': 'Lácteos',
};

// Construir catálogo plano
const catalogo: AlimentoCatalogo[] = [];
const gruposSet = new Set<string>();

for (const grupo of (catalogoRaw as GrupoRaw[])) {
  gruposSet.add(grupo.grupo);
  const categoria = GRUPO_TO_CATEGORIA[grupo.grupo] || 'Otros';
  const unidadBase = grupo.grupo === 'Alimentos expresados en 100 ml' ? 'ml' : 'g';

  for (const alimento of grupo.alimentos) {
    catalogo.push({
      nombre: alimento.alimento.replace(/\n/g, ' ').trim(),
      grupo: grupo.grupo,
      categoria,
      energiaKcal: alimento.energia_kcal,
      proteinaG: alimento.proteina_g,
      grasaTotalG: alimento.grasa_total_g,
      carbohidratosG: alimento.carbohidratos_g,
      unidadBase,
    });
  }
}

/** Catálogo plano de los 958 alimentos con info nutricional */
export const catalogoAlimentos = catalogo;

/** Nombres de los 11 grupos de alimentos */
export const gruposAlimentos = Array.from(gruposSet);

/** 
 * Busca alimentos en el catálogo por nombre (case-insensitive, parcial)
 * @param query - texto a buscar
 * @param maxResults - máximo de resultados (default 20)
 */
export function buscarEnCatalogo(query: string, maxResults = 20): AlimentoCatalogo[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase().trim();
  const results: AlimentoCatalogo[] = [];
  
  // Primero los que empiezan con el query, luego los que lo contienen
  for (const item of catalogo) {
    if (results.length >= maxResults) break;
    if (item.nombre.toLowerCase().startsWith(lower)) {
      results.push(item);
    }
  }
  for (const item of catalogo) {
    if (results.length >= maxResults) break;
    if (!results.includes(item) && item.nombre.toLowerCase().includes(lower)) {
      results.push(item);
    }
  }
  
  return results;
}

/**
 * Obtiene la info nutricional de un alimento por nombre exacto
 */
export function obtenerInfoNutricional(nombre: string): AlimentoCatalogo | undefined {
  return catalogo.find(a => a.nombre.toLowerCase() === nombre.toLowerCase());
}

/**
 * Obtiene todos los alimentos de un grupo específico
 */
export function alimentosPorGrupo(grupo: string): AlimentoCatalogo[] {
  return catalogo.filter(a => a.grupo === grupo);
}
