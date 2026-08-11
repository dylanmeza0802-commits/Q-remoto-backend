import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './socket/socket.manager.js';
import queueRouter   from './modules/queue/queue.controller.js';
import canastaRouter from './modules/canasta/canasta.controller.js';
import turnRouter    from './modules/turn/turn.controller.js';
import authRouter    from './modules/auth/auth.controller.js';

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    console.log(`[CORS] Origen recibido: ${origin ?? '(sin origen)'}`);

    // Sin origen → peticiones server-to-server, Postman, curl → permitir
    if (!origin) return callback(null, true);

    const allowed =
      origin === 'http://localhost:5173'  ||
      origin === 'http://127.0.0.1:5173' ||
      /\.vercel\.app$/.test(origin)       || // cualquier subdominio de Vercel
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.trim());

    if (allowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado: ${origin}`);
      callback(null, false); // false → 403, NO lanzar Error (evita 500 en preflight)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight con las mismas reglas

app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/v1/auth',    authRouter);
app.use('/v1/queues',  queueRouter);
app.use('/v1/canasta', canastaRouter);
app.use('/v1/turns',   turnRouter);

// ── Socket.io ──────────────────────────────────────────────────────────────────
initSocket(server);

server.listen(process.env.PORT || 4000, () => {
  const productionOrigin = process.env.FRONTEND_URL || '(no configurado)';
  console.log(`✅ Q-Remoto backend activo en puerto ${process.env.PORT || 4000}`);
  console.log(`   CORS permite: localhost:5173 + ${productionOrigin}`);
});