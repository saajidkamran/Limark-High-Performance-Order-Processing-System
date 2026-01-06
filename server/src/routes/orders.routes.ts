import { FastifyInstance, FastifyRequest } from "fastify";
import { Order } from "../types/order";
import {
  processOrdersBatch,
  getOrderById,
  updateOrderStatus,
  cacheOrdersAfterBatch,
} from "../services/order.service";
import { validateOrdersBatchMiddleware } from "../middleware/ordersValidate.middleware";
import {
  idempotencyMiddleware,
  IdempotentRequest,
} from "../middleware/idempotency.middleware";
import { IdempotencyStore } from "../store/idempotency.store";
import { validateOrderIdMiddleware } from "../middleware/validateId.middleware";
import {
  subscribeToOrderUpdates,
  setSSEHeaders,
} from "../services/stream.service";
import { runStressTest } from "../services/stress-test.service";
import { validateStressTestMiddleware } from "../middleware/stressTestValidate.middleware";

interface BatchRequest extends IdempotentRequest {
  validatedOrders?: Order[];
}

interface StressTestRequest extends FastifyRequest {
  validatedStressTestConfig?: {
    orderCount: number;
    batchSize: number;
    concurrentBatches?: number;
  };
}

export default async function ordersRoutes(app: FastifyInstance) {
  app.post(
    "/batch",
    {
      preHandler: [idempotencyMiddleware, validateOrdersBatchMiddleware],
    },
    async (req: BatchRequest, reply) => {
      const orders = req.validatedOrders!;

      try {
        //Process orders as batches
        const result = await processOrdersBatch(orders);

        //Cache newly created orders
        cacheOrdersAfterBatch(orders);

        const response = {
          success: true,
          total: orders.length,
          processed: result.totalProcessed,
          failed: result.totalFailed,
          batches: result.batchResults.length,
          batchResults: result.batchResults,
        };

        //Cache response with idempotency key
        if (req.idempotencyKey) {
          IdempotencyStore.set(req.idempotencyKey, response, 201);
        }

        return reply.code(201).send(response);
      } catch (error) {
        app.log.error(error);

        let statusCode = 500;
        let errorResponse: { message: string; error?: string } = {
          message: "Failed to process batch",
          error: error instanceof Error ? error.message : "Unknown error",
        };

        if (error instanceof Error && error.message.includes("batch size")) {
          statusCode = 400;
          errorResponse = {
            message: error.message,
          };
        }

        if (req.idempotencyKey) {
          IdempotencyStore.set(req.idempotencyKey, errorResponse, statusCode);
        }

        return reply.code(statusCode).send(errorResponse);
      }
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [validateOrderIdMiddleware],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const { order, cacheHit, cacheAge } = getOrderById(id);

      reply.header("X-Cache", cacheHit ? "HIT" : "MISS");
      if (cacheAge !== undefined) {
        reply.header("X-Cache-Age", cacheAge.toString());
      }

      if (!order) {
        return reply.code(404).send({ message: "Not found" });
      }

      return order;
    }
  );

  app.put(
    "/:id/status",
    {
      preHandler: [validateOrderIdMiddleware],
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: Order["status"] };

      const updated = updateOrderStatus(id, status);
      if (!updated) return reply.code(404).send({ message: "Not found" });

      return updated;
    }
  );

  app.get("/stream", async (req, reply) => {
    setSSEHeaders(reply);

    reply.raw.write(": connected\n\n");

    const unsubscribe = subscribeToOrderUpdates((event) => {
      try {
        const data = JSON.stringify(event);
        reply.raw.write(`event: ${event.type}\n`);
        reply.raw.write(`data: ${data}\n\n`);
      } catch (error) {
        app.log.error({ error }, "Error sending SSE event");
        unsubscribe();
      }
    });

    const heartbeatInterval = setInterval(() => {
      try {
        reply.raw.write(": heartbeat\n\n");
      } catch (error) {
        clearInterval(heartbeatInterval);
        unsubscribe();
      }
    }, 30000);

    req.raw.on("close", () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
      reply.raw.end();
    });
  });

  app.post(
    "/stress-test",
    {
      preHandler: [validateStressTestMiddleware],
    },
    async (req: StressTestRequest, reply) => {
      try {
        const config = req.validatedStressTestConfig!;

        const result = await runStressTest(config);

        return reply.code(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Stress test failed");

        return reply.code(500).send({
          message: "Stress test failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );
}
