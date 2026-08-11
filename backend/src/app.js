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
// Usamos una función de origen dinámica para leer FRONTEND_URL en cada
// petición, no solo al iniciar el proceso. Así los cambios en variables de
// entorno en Render se aplican sin redeploy.
const corsOptions = {
  origin: (origin, callback) => {
    // Orígenes siempre permitidos (desarrollo local)
    const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

    // Origen de producción leído en tiempo de ejecución desde la variable de entorno
    const productionOrigin = process.env.FRONTEND_URL?.trim();

    const allowed = productionOrigin
      ? [...localOrigins, productionOrigin]
      : localOrigins;

    // Sin origen (peticiones server-to-server, curl, Postman, etc.) → permitir
    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      callback(new Error(`CORS: origen no permitido → ${origin}`));
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