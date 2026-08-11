import { Server } from 'socket.io';
import { QueueService } from '../modules/queue/queue.service.js';

let io;

export function initSocket(server) {
  // Socket.io necesita su propio CORS independiente del de Express.
  // Usamos una función dinámica por la misma razón que en app.js:
  // el valor de FRONTEND_URL se lee en cada handshake, no solo al arrancar.
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        console.log(`[WS CORS] Origen recibido: ${origin ?? '(sin origen)'}`);

        if (!origin) return callback(null, true);

        const allowed =
          origin === 'http://localhost:5173'  ||
          origin === 'http://127.0.0.1:5173' ||
          /\.vercel\.app$/.test(origin)       ||
          (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.trim());

        if (allowed) {
          callback(null, true);
        } else {
          console.warn(`[WS CORS] Bloqueado: ${origin}`);
          callback(null, false);
        }
      },
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