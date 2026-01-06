import { FastifyRequest, FastifyReply } from 'fastify';

interface StressTestConfig {
  orderCount: number;
  batchSize: number;
  concurrentBatches?: number;
}

/**
 * Pure function: Validates stress test configuration
 */
export const validateStressTestConfig = (
  body: unknown
): { valid: boolean; error?: string; config?: StressTestConfig } => {
  if (typeof body !== 'object' || body === null) {
    return {
      valid: false,
      error: 'Body must be an object',
    };
  }

  const config = body as Partial<StressTestConfig>;
  
  // Validate orderCount
  const orderCount = config.orderCount ?? 1000;
  if (typeof orderCount !== 'number' || isNaN(orderCount)) {
    return {
      valid: false,
      error: 'orderCount must be a number',
    };
  }
  if (orderCount < 1 || orderCount > 10000) {
    return {
      valid: false,
      error: 'orderCount must be between 1 and 10000',
    };
  }

  // Validate batchSize
  const batchSize = config.batchSize ?? 100;
  if (typeof batchSize !== 'number' || isNaN(batchSize)) {
    return {
      valid: false,
      error: 'batchSize must be a number',
    };
  }
  if (batchSize < 1 || batchSize > 1000) {
    return {
      valid: false,
      error: 'batchSize must be between 1 and 1000',
    };
  }


  return {
    valid: true,
    config: {
      orderCount,
      batchSize,
      concurrentBatches: config.concurrentBatches ?? 1,
    },
  };
};

/**
 * Middleware: Validates stress test configuration
 */
export const validateStressTestMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const validation = validateStressTestConfig(request.body);

  if (!validation.valid) {
    reply.code(400).send({ message: validation.error });
    return;
  }

  (request as any).validatedStressTestConfig = validation.config;
};

