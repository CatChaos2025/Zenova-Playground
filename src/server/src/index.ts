import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import type { ApiResponse } from '@zenova/shared';

// 1. Importa tus rutas de usuarios (asegúrate de incluir la extensión .js para ESM)
import { userRoutes } from './routes/users.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Registrar Middlewares
await fastify.register(cors, {
  origin: true
});

// 2. Registra las rutas de usuarios
await fastify.register(userRoutes);

// Rutas directas de la API
fastify.get('/api/health', async (request, reply) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'Fastify backend running smoothly!' }
  };
  
  return response;
});

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