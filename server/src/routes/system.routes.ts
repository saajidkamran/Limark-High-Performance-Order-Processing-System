import { FastifyInstance } from 'fastify';
import { getMetrics } from '../utils/metrics';

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

  app.get('/performance', async () => {
    return getMetrics();
  });
}
