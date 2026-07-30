const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando datos anteriores...');
  await prisma.turn.deleteMany();
  await prisma.queue.deleteMany();

  console.log('Creando filas...');
  const fila1 = await prisma.queue.create({
    data: { name: 'Fila 1', laneNumber: 1, floor: 1, isActive: true, minsPerPerson: 3, eventType: 'COMEDOR' }
  });
  const fila2 = await prisma.queue.create({
    data: { name: 'Fila 2', laneNumber: 2, floor: 1, isActive: true, minsPerPerson: 3, eventType: 'COMEDOR' }
  });


  console.log('Creando turnos de prueba en Fila 1...');
  for (let i = 1; i <= 8; i++) {
    await prisma.turn.create({
      data: {
        ticketNumber: i,
        queueId: fila1.id,
        status: 'WAITING',
        waitMinutes: (i - 1) * 3,
      }
    });
  }

  console.log('Creando turnos de prueba en Fila 2...');
  for (let i = 1; i <= 5; i++) {
    await prisma.turn.create({
      data: {
        ticketNumber: i,
        queueId: fila2.id,
        status: 'WAITING',
        waitMinutes: (i - 1) * 3,
      }
    });
  }

  
  console.log('✅ Seed completado — 2 filas con 16 turnos en total');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
