import Fastify from 'fastify';
import cors from '@fastify/cors';
import ordersRoutes from './routes/orders.routes';
import systemRoutes from './routes/system.routes';

export const buildApp = () => {
  const app = Fastify({
    logger: true
  });

  app.register(cors);
  app.register(ordersRoutes, { prefix: '/api/orders' });
  app.register(systemRoutes, { prefix: '/api/system' });

  return app;
};
