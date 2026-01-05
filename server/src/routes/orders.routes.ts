import { FastifyInstance, FastifyRequest } from 'fastify';
import { Order } from '../types/order';
import { processOrdersBatch } from '../services/order.service';
import { OrderStore } from '../store/order.store';
import { validateOrdersBatchMiddleware } from '../middleware/ordersValidate.middleware';

// Extend FastifyRequest type to include validatedOrders
interface BatchRequest extends FastifyRequest {
  validatedOrders?: Order[];
}

export default async function ordersRoutes(app: FastifyInstance) {
  // Batch insert orders with proper batching
  app.post(
    '/batch',
    {
      preHandler: validateOrdersBatchMiddleware,
    },
    async (req: BatchRequest, reply) => {
      const orders = req.validatedOrders!;

      try {
        // Process orders in batches - uses BATCH_SIZE from env (service handles validation)
        const result = await processOrdersBatch(orders);

        return reply.code(201).send({
          success: true,
          total: orders.length,
          processed: result.totalProcessed,
          failed: result.totalFailed,
          batches: result.batchResults.length,
          batchResults: result.batchResults,
        });
      } catch (error) {
        app.log.error(error);

        // Handle batch size validation errors from service
        if (error instanceof Error && error.message.includes('batch size')) {
          return reply.code(400).send({
            message: error.message,
          });
        }

        return reply.code(500).send({
          message: 'Failed to process batch',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Get order by ID
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const order = OrderStore.getById(id);
    if (!order) return reply.code(404).send({ message: 'Not found' });
    return order;
  });

  // Update order status
  app.put('/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: Order['status'] };

    const updated = OrderStore.updateStatus(id, status);
    if (!updated) return reply.code(404).send({ message: 'Not found' });

    return updated;
  });
}
