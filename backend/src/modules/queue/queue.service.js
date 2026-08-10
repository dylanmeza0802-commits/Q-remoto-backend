import { prisma } from '../../config/database.js';
import redis from '../../config/redis.js';

const QUEUE_TTL = 60 * 60 * 24; // 24h en segundos

export const QueueService = {

  async getActiveQueues() {
    return prisma.queue.findMany({
      where: { isActive: true },
      include: { turns: { where: { status: 'WAITING' }, orderBy: { createdAt: 'asc' } } },
      orderBy: { laneNumber: 'asc' },
    });
  },

  async getQueueState(queueId) {
    const cached = await redis.get(`queue:${queueId}`);
    if (cached) return JSON.parse(cached);
    return this.refreshQueueCache(queueId);
  },

  async refreshQueueCache(queueId) {
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: {
        turns: {
          where: { status: 'WAITING' },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!queue) return null;
    await redis.setEx(`queue:${queueId}`, QUEUE_TTL, JSON.stringify(queue));
    return queue;
  },

  async joinQueue(queueId, userId) {
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue || !queue.isActive) throw new Error('Fila no disponible');

    const lastTurn = await prisma.turn.findFirst({
      where: { queueId },
      orderBy: { ticketNumber: 'desc' },
    });

    const ticketNumber = (lastTurn?.ticketNumber ?? 0) + 1;
    const position = await prisma.turn.count({ where: { queueId, status: 'WAITING' } });

    /**
     * Tiempo de cuello de botella calibrado para 2500 alumnos en 240 minutos:
     * - Normal:  25 seg/alumno (promedio general) -> ~0.1 min (6 seg) escaneo
     * - Retraso: 60 seg/alumno -> 1.0 min (validación manual, fallo del sistema)
     */
    const bottleneckMin = queue.isDelayed ? 1.0 : 0.1;
    
    /**
     * Tiempo base del sistema (desde que entra hasta que se sienta)
     * - Normal: 4 minutos (recibir bandeja, servir comida)
     * - Retraso: 8 minutos (cambio de ollas, contratiempos)
     */
    const baseMin = queue.isDelayed ? 8.0 : 4.0;
    
    const waitMinutes = Math.round(baseMin + (position * bottleneckMin));

    const turn = await prisma.turn.create({
      data: { ticketNumber, userId, queueId, status: 'WAITING', waitMinutes },
    });

    await this.refreshQueueCache(queueId);
    return { turn, position: position + 1, waitMinutes };
  },

  async callNextTurn(queueId) {
    const next = await prisma.turn.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true } } },
    });
    if (!next) return null;

    const updated = await prisma.turn.update({
      where: { id: next.id },
      data: { status: 'CALLED', calledAt: new Date() },
    });

    await this.refreshQueueCache(queueId);
    return { ...updated, user: next.user };
  },

  async cancelTurn(turnId) {
    const turn = await prisma.turn.update({
      where: { id: turnId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await this.refreshQueueCache(turn.queueId);
    return turn;
  },

  async setDelay(queueId, reason) {
    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { isDelayed: true, delayReason: reason },
    });
    await redis.del(`queue:${queueId}`);
    return queue;
  },

  async clearDelay(queueId) {
    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: { isDelayed: false, delayReason: null },
    });
    await redis.del(`queue:${queueId}`);
    return queue;
  },
};