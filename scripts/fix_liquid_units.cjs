/**
 * Script de corrección: Cambia la unidad de 'g' a 'ml'
 * para todos los alimentos líquidos del inventario.
 *
 * Afecta:
 *   - Leches fluidas (vaca, cabra, materna, UHT, evaporada, chocolatada)
 *   - Cremas de leche (espesa, rala) y crema agria
 *   - Yogurts (todas las variantes)
 *   - Bebida láctea
 *   - Jugos/pulpas líquidas de frutas (naranja zumo, guanabana pulpa líquida,
 *     tomate de árbol pulpa líquida, naranjilla pulpa congelada)
 *
 * Ejecutar: node scripts/fix_liquid_units.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yrrmbvedpzrnamhgymrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlycm1idmVkcHpybmFtaGd5bXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwODk5NDcsImV4cCI6MjEwMTY2NTk0N30.a05s7Lk6S2zJz5lkQf5NretXY9FzdmY51MvGZf-TxaQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LIQUID_PATTERNS = [
  // LÁCTEOS — Leches fluidas
  'leche de vaca, fluida',
  'leche, de vaca, fluida',
  'leche, de vaca, chocolatada, fluida',
  'leche, de vaca, semidescremada',
  'leche de vaca, descremada',
  'leche, de vaca, descremada',
  'leche, de cabra, fluida',
  'leche, de vaca, evaporada',
  'leche, materna, fluida',
  'leche, de vaca, uht',
  'leche de vaca, uht',
  // LÁCTEOS — Cremas
  'crema de leche',
  'crema, de leche',
  'crema agria',
  // LÁCTEOS — Yogurts
  'yogurt',
  'yougurt',
  // LÁCTEOS — Bebida láctea
  'bebida láctea',
  'bebida lactea',
  // FRUTAS — Jugos y pulpas líquidas
  'naranja, agria, zumo',
  'naranja, agria, jugo natural',
  'guanabana, pulpa líquida',
  'guanabana, pulpa liquida',
  'tomate de árbol, pulpa líquida',
  'tomate de arbol, pulpa liquida',
  'tomate de Árbol, pulpa líquida',
  'naranjilla, lulo, pulpa, congelada',
];

function esLiquido(nombre) {
  const n = nombre.toLowerCase();
  return LIQUID_PATTERNS.some(p => n.includes(p.toLowerCase()));
}

async function fixLiquidUnits() {
  console.log('Obteniendo todos los alimentos de la base de datos...');
  
  const { data: alimentos, error } = await supabase
    .from('alimentos')
    .select('id, nombre, unidad')
    .order('nombre');

  if (error) {
    console.error('Error al obtener alimentos:', error.message);
    process.exit(1);
  }

  console.log('   Total registros en DB: ' + alimentos.length);

  const aCorregir = alimentos.filter(a => esLiquido(a.nombre) && a.unidad !== 'ml');
  const yaCorrectos = alimentos.filter(a => esLiquido(a.nombre) && a.unidad === 'ml');

  console.log('\nAlimentos liquidos ya con unidad ml: ' + yaCorrectos.length);
  console.log('Alimentos liquidos con unidad incorrecta: ' + aCorregir.length);

  if (aCorregir.length === 0) {
    console.log('\nNo hay nada que corregir. Todo esta bien!');
    return;
  }

  console.log('\nAlimentos a corregir:');
  aCorregir.forEach(a => console.log('   - [' + a.unidad + '->ml] ' + a.nombre));

  console.log('\nAplicando correcciones...');
  const BATCH_SIZE = 20;
  let corregidos = 0;
  let errores = 0;

  for (let i = 0; i < aCorregir.length; i += BATCH_SIZE) {
    const batch = aCorregir.slice(i, i + BATCH_SIZE);
    const ids = batch.map(a => a.id);

    const { error: updateErr } = await supabase
      .from('alimentos')
      .update({ unidad: 'ml' })
      .in('id', ids);

    if (updateErr) {
      console.error('Error en batch ' + (Math.floor(i / BATCH_SIZE) + 1) + ':', updateErr.message);
      for (const item of batch) {
        const { error: singleErr } = await supabase
          .from('alimentos')
          .update({ unidad: 'ml' })
          .eq('id', item.id);
        if (singleErr) {
          errores++;
          console.error('   Fallo: ' + item.nombre);
        } else {
          corregidos++;
        }
      }
    } else {
      corregidos += batch.length;
      process.stdout.write('\r   Corregidos: ' + corregidos + '/' + aCorregir.length);
    }
  }

  console.log('\n');
  console.log('-------------------------------------------');
  console.log('Correccion completada:');
  console.log('   Corregidos exitosamente: ' + corregidos);
  if (errores > 0) console.log('   Errores: ' + errores);
  console.log('-------------------------------------------');

  console.log('\nVerificacion final — alimentos con unidad ml:');
  const { data: verificacion } = await supabase
    .from('alimentos')
    .select('nombre, unidad, categoria')
    .eq('unidad', 'ml')
    .order('categoria');

  if (verificacion) {
    console.log('   Total con unidad ml: ' + verificacion.length);
    verificacion.forEach(a => console.log('   [' + a.categoria + '] ' + a.nombre));
  }
}

fixLiquidUnits().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
