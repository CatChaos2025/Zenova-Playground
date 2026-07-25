import type { FastifyInstance } from 'fastify';
import type { User } from '@zenova/shared';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
    const { id } = request.params;

    const mockUser: User = {
      id,
      username: 'CatChaos',
      role: 'admin'
    };

    return { success: true, data: mockUser };
  });
}