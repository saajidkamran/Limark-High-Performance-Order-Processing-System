import Fastify from 'fastify';
import cors from '@fastify/cors';
import ordersRoutes from './routes/orders.routes';
import systemRoutes from './routes/system.routes';
import { recordRequest } from './utils/metrics';

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  // Track request start time
  app.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
  });

  // Track request completion and record metrics
  app.addHook('onResponse', async (request) => {
    const startTime = (request as any).startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      recordRequest(duration);
    }
  });

  app.register(cors);
  app.register(ordersRoutes, { prefix: '/api/orders' });
  app.register(systemRoutes, { prefix: '/api/system' });

  return app;
};
