import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Pure function: Validates order ID shape
 */
export const validateOrderId = (id: unknown): { valid: boolean; error?: string } => {
  if (typeof id !== 'string') {
    return {
      valid: false,
      error: 'Order ID must be a string',
    };
  }

  if (!id || id.trim().length === 0) {
    return {
      valid: false,
      error: 'Order ID cannot be empty',
    };
  }

  // Validate ID format - alphanumeric, hyphens, underscores, reasonable length
  // Adjust regex pattern based on your ID format requirements
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return {
      valid: false,
      error: 'Order ID must be 1-128 alphanumeric characters, hyphens, or underscores',
    };
  }

  return { valid: true };
};

/**
 * Middleware: Validates order ID parameter shape
 */
export const validateOrderIdMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id } = request.params as { id: string };
  const validation = validateOrderId(id);

  if (!validation.valid) {
    reply.code(400).send({ message: validation.error });
    return;
  }

  // ID is valid, continue to route handler
};

