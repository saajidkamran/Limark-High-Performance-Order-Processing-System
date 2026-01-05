import { FastifyInstance, FastifyRequest } from 'fastify';
import { Order } from '../types/order';
import { processOrdersBatch } from '../services/order.service';
import { OrderStore } from '../store/order.store';
import { validateOrdersBatchMiddleware } from '../middleware/ordersValidate.middleware';
import { idempotencyMiddleware, IdempotentRequest } from '../middleware/idempotency.middleware';
import { IdempotencyStore } from '../store/idempotency.store';

// Extend FastifyRequest type to include validatedOrders
interface BatchRequest extends IdempotentRequest {
  validatedOrders?: Order[];
}

export default async function ordersRoutes(app: FastifyInstance) {
  // Batch insert orders with proper batching and idempotency
  app.post(
    '/batch',
    {
      preHandler: [idempotencyMiddleware, validateOrdersBatchMiddleware],
    },
    async (req: BatchRequest, reply) => {
      const orders = req.validatedOrders!;

      try {
        // Process orders in batches - uses BATCH_SIZE from env (service handles validation)
        const result = await processOrdersBatch(orders);

        const response = {
          success: true,
          total: orders.length,
          processed: result.totalProcessed,
          failed: result.totalFailed,
          batches: result.batchResults.length,
          batchResults: result.batchResults,
        };

        // Cache response with idempotency key if present
        if (req.idempotencyKey) {
          IdempotencyStore.set(req.idempotencyKey, response, 201);
        }

        return reply.code(201).send(response);
      } catch (error) {
        app.log.error(error);

        let statusCode = 500;
        let errorResponse: { message: string; error?: string } = {
          message: 'Failed to process batch',
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        // Handle batch size validation errors from service
        if (error instanceof Error && error.message.includes('batch size')) {
          statusCode = 400;
          errorResponse = {
            message: error.message,
          };
        }

        // Cache error response with idempotency key if present
        // This ensures retries get the same error response
        if (req.idempotencyKey) {
          IdempotencyStore.set(req.idempotencyKey, errorResponse, statusCode);
        }

        return reply.code(statusCode).send(errorResponse);
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
