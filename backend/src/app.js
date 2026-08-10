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

const app = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Responder preflight manualmente
app.options('*', cors());

app.use(express.json());

// ── Rutas ─────────────────────────────────────────────
app.use('/v1/auth',    authRouter);
app.use('/v1/queues',  queueRouter);
app.use('/v1/canasta', canastaRouter);
app.use('/v1/turns',   turnRouter);

// ── Socket.io ─────────────────────────────────────────
initSocket(server);

server.listen(process.env.PORT || 4000, () => {
  console.log(`✅ Q-Remoto backend activo en puerto ${process.env.PORT || 4000}`);
});