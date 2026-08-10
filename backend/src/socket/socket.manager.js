import { Server } from 'socket.io';
import { QueueService } from '../modules/queue/queue.service.js';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[WS] Conectado: ${socket.id}`);

    socket.on('queue:subscribe', async (queueId) => {
      socket.join(`queue:${queueId}`);
      const state = await QueueService.getQueueState(queueId);
      socket.emit('queue:state', state);
    });

    socket.on('disconnect', () => {
      console.log(`[WS] Desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastQueueUpdate(queueId, data) {
  if (!io) return;
  io.to(`queue:${queueId}`).emit('queue:update', data);
}

export function broadcastDelay(queueId, reason) {
  if (!io) return;
  io.to(`queue:${queueId}`).emit('delay:announced', { queueId, reason, timestamp: new Date() });
}

export function broadcastTurnCalled(queueId, turn) {
  if (!io) return;
  io.to(`queue:${queueId}`).emit('turn:called', turn);
}

export function broadcastCancellation(queueId, turnId) {
  if (!io) return;
  io.to(`queue:${queueId}`).emit('turn:cancelled', { turnId });
}