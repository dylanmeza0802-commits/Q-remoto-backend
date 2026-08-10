import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed para el Comedor UNSAAC
 *
 * Configuración física:
 *   - 1 fila por defecto (Piso 1)
 *   - Se puede habilitar una segunda fila al activar el Piso 2 desde el admin
 *
 * Análisis de capacidad (2500 alumnos, 11 AM – 3 PM = 240 min):
 *   ⚠️  Con 1 sola fila: COLAPSA — utilización del 87% con escáner ultrarrápido de 6 seg
 *   ✅  Con 2 filas y escáner de 6 seg/alumno: ρ ≈ 52% — seguro con margen
 */
async function main() {
  console.log('🌱 Iniciando seed del Comedor UNSAAC...');

  // Fila 1 (Piso 1) — siempre activa
  await prisma.queue.upsert({
    where:  { laneNumber: 1 },
    update: {},
    create: {
      name:       'Fila 1 — Piso 1',
      laneNumber: 1,
      floor:      1,
      isActive:   true,
      isDelayed:  false,
      minsPerPerson: 0,
      eventType:  'COMEDOR',
    },
  });
  console.log('  ✅ Fila 1 (Piso 1) lista');

  // Fila 2 (Piso 2) — inactiva por defecto; el admin la activa cuando se requieran 2 pisos
  await prisma.queue.upsert({
    where:  { laneNumber: 2 },
    update: {},
    create: {
      name:       'Fila 2 — Piso 2',
      laneNumber: 2,
      floor:      2,
      isActive:   false, // Se activa manualmente cuando se habilita el Piso 2
      isDelayed:  false,
      minsPerPerson: 0,
      eventType:  'COMEDOR',
    },
  });
  console.log('  ⏸  Fila 2 (Piso 2) creada en modo inactivo — actívala cuando habilites el segundo piso');

  console.log('\n📊 Resumen de capacidad:');
  console.log('  1 fila activa:  ~1200 alumnos en 240 min ❌ (colapsa con 2500)');
  console.log('  2 filas activas: ~2500 alumnos en 240 min ✅ (ρ ≈ 87% con escáner de 10 seg)');
  console.log('\n🎉 Seed completado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
