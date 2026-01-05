import { FastifyInstance } from 'fastify';

export default async function systemRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  app.get('/memory', async () => {
    const mem = process.memoryUsage();
    return {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed
    };
  });
}
