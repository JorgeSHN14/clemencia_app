/**
 * Script de Seed: Limpia la tabla de alimentos y la re-puebla con los 958 alimentos
 * del catálogo JSON incluyendo datos nutricionales.
 * 
 * NOTA: El grupo de alimentos se maneja solo en el frontend (foodCatalog.ts)
 * porque no podemos ejecutar ALTER TABLE desde el cliente anon.
 * 
 * Ejecutar: node scripts/seed_catalog.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials from .env
const SUPABASE_URL = 'https://yrrmbvedpzrnamhgymrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlycm1idmVkcHpybmFtaGd5bXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODk5NDcsImV4cCI6MjEwMTY2NTk0N30.a05s7Lk6S2zJz5lkQf5NretXY9FzdmY51MvGZf-TxaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapeo de grupos del JSON a categorías de la app
const GRUPO_TO_CATEGORIA = {
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

// Determinar unidad basada en el grupo
function getUnidad(grupo) {
  if (grupo === 'Alimentos expresados en 100 ml') return 'ml';
  return 'g';
}

async function seed() {
  console.log('🔄 Leyendo catálogo JSON...');
  const jsonPath = path.join(__dirname, '..', 'grupos_alimentos_completo.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Step 1: Obtener todos los IDs existentes y borrarlos
  console.log('🗑️  Eliminando todos los alimentos existentes...');
  const { data: existing, error: fetchErr } = await supabase.from('alimentos').select('id');
  
  if (fetchErr) {
    console.error('Error al obtener alimentos existentes:', fetchErr);
  } else if (existing && existing.length > 0) {
    console.log('  Encontrados ' + existing.length + ' alimentos a eliminar...');
    // Borrar en batches de 20 usando IDs
    for (let i = 0; i < existing.length; i += 20) {
      const ids = existing.slice(i, i + 20).map(a => a.id);
      const { error: delErr } = await supabase.from('alimentos').delete().in('id', ids);
      if (delErr) console.error('  Error eliminando batch:', delErr.message);
      else process.stdout.write('\r  Eliminados: ' + Math.min(i + 20, existing.length) + '/' + existing.length);
    }
    console.log('');
    console.log('  ✅ Alimentos anteriores eliminados');
  } else {
    console.log('  ✅ No había alimentos previos');
  }

  // Step 2: Preparar registros (sin grupo_alimento ya que la columna puede no existir)
  console.log('📦 Preparando ' + data.length + ' grupos de alimentos...');
  const registros = [];
  const nombresVistos = new Set();

  for (const grupo of data) {
    const categoria = GRUPO_TO_CATEGORIA[grupo.grupo] || 'Otros';
    const unidad = getUnidad(grupo.grupo);

    for (const alimento of grupo.alimentos) {
      const nombre = alimento.alimento.replace(/\n/g, ' ').trim();
      
      // Evitar duplicados (hay nombres repetidos en el JSON)
      if (nombresVistos.has(nombre.toLowerCase())) continue;
      nombresVistos.add(nombre.toLowerCase());

      registros.push({
        nombre: nombre,
        cantidad_total: 0,
        unidad: unidad,
        categoria: categoria,
        calorias_por_100g: alimento.energia_kcal || null,
        proteinas_por_100g: alimento.proteina_g || null,
        grasas_por_100g: alimento.grasa_total_g || null,
        carbohidratos_por_100g: alimento.carbohidratos_g || null,
      });
    }
  }

  console.log('  Total alimentos únicos a insertar: ' + registros.length);

  // Step 3: Insertar en batches de 30
  const BATCH_SIZE = 30;
  let insertados = 0;
  let errores = 0;

  for (let i = 0; i < registros.length; i += BATCH_SIZE) {
    const batch = registros.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('alimentos').insert(batch);
    if (error) {
      console.error('\n  ❌ Error en batch ' + Math.floor(i / BATCH_SIZE + 1) + ':', error.message);
      // Intentar insertar uno por uno del batch que falló
      for (const item of batch) {
        const { error: singleErr } = await supabase.from('alimentos').insert([item]);
        if (singleErr) {
          errores++;
          console.error('    ❌ Fallo: ' + item.nombre + ' -> ' + singleErr.message);
        } else {
          insertados++;
        }
      }
    } else {
      insertados += batch.length;
      process.stdout.write('\r  ✅ Insertados: ' + insertados + '/' + registros.length);
    }
  }

  console.log('');
  console.log('');
  console.log('🎉 Seed completado:');
  console.log('   - Insertados exitosamente: ' + insertados);
  console.log('   - Errores: ' + errores);
  console.log('   - Total esperado: ' + registros.length);
}

seed().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
