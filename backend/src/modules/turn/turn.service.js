import { prisma } from '../../config/database.js';

export const TurnService = {

  async cancelTurn(turnId) {
    return prisma.turn.update({
      where: { id: turnId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  },

  async cedeTurn(myTurnId, swapWithId) {
    // Obtener ambos turnos
    const myTurn   = await prisma.turn.findUnique({ where: { id: myTurnId } });
    const nextTurn = await prisma.turn.findUnique({ where: { id: swapWithId } });

    if (!myTurn || !nextTurn) throw new Error('Turnos no encontrados');
    if (myTurn.queueId !== nextTurn.queueId) throw new Error('Turnos en filas distintas');

    // Intercambiar tiempos de creación para cambiar posición en la fila
    let newMyCreatedAt   = nextTurn.createdAt;
    let newNextCreatedAt = myTurn.createdAt;

    // Garantizar que newMyCreatedAt sea posterior a newNextCreatedAt
    if (newMyCreatedAt.getTime() <= newNextCreatedAt.getTime()) {
      newMyCreatedAt = new Date(newNextCreatedAt.getTime() + 1000);
    }

    await prisma.turn.update({
      where: { id: myTurnId },
      data: { createdAt: newMyCreatedAt, cedido: true },
    });
    await prisma.turn.update({
      where: { id: swapWithId },
      data: { createdAt: newNextCreatedAt },
    });

    const { QueueService } = await import('../queue/queue.service.js');
    await QueueService.refreshQueueCache(myTurn.queueId);

    return { ...myTurn, queueId: myTurn.queueId };
  },
};