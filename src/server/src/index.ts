import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ApiResponse } from '@zenova/shared';

import { userRoutes } from './routes/users.js';

dotenv.config();

// Utilidad para rutas ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// 1. Middlewares
await fastify.register(cors, { origin: true });

// 2. Rutas del Backend (API)
await fastify.register(userRoutes);

fastify.get('/api/health', async (request, reply) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'Fastify backend running smoothly!' }
  };
  return response;
});

// 3. Servir el Frontend de React/Vite compilado
// Asumiendo la estructura: src/server/dist y src/client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
console.log('Directorio del cliente resuelto en:', clientDistPath);

await fastify.register(fastifyStatic, {
  root: clientDistPath,
  // IMPORTANTE: Evita que el plugin intente manejar las rutas de /api
  wildcard: false 
});

// 4. Fallback para React Router (Single Page App)
// Cualquier ruta que no sea /api/... devolverá el index.html de React
fastify.get('/*', async (request, reply) => {
  if (request.url.startsWith('/api')) {
    return reply.status(404).send({ error: 'API route not found' });
  }
  return reply.sendFile('index.html');
});

// Inicialización
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🟢 [server]: Servidor Fastify listo en http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();