import { FastifyRequest, FastifyReply } from 'fastify';
import { Order } from '../types/order';

//TODO :move to env
const MAX_ORDERS_PER_REQUEST = 1000;

/**
 * Pure function: Validates input shape - checks if body is a valid array of orders
 */
export const validateOrdersInput = (
  body: unknown
): { valid: boolean; error?: string; orders?: Order[] } => {
  if (!Array.isArray(body)) {
    return {
      valid: false,
      error: 'Body must be an array',
    };
  }

  if (body.length === 0) {
    return {
      valid: false,
      error: 'Orders array cannot be empty',
    };
  }

  // Basic shape validation - check if items have required fields
  for (const item of body) {
    if (typeof item !== 'object' || item === null) {
      return {
        valid: false,
        error: 'All items must be objects',
      };
    }

    const order = item as Partial<Order>;
    if (!order.id || typeof order.id !== 'string') {
      return {
        valid: false,
        error: 'All orders must have a valid id (string)',
      };
    }

    if (!order.status || typeof order.status !== 'string') {
      return {
        valid: false,
        error: 'All orders must have a valid status (string)',
      };
    }

    if (typeof order.amount !== 'number') {
      return {
        valid: false,
        error: 'All orders must have a valid amount (number)',
      };
    }
  }

  return {
    valid: true,
    orders: body as Order[],
  };
};

/**
 * Middleware: Validates orders batch input shape
 */

export const validateOrdersBatchMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const validation = validateOrdersInput(request.body);

  if (!validation.valid) {
    reply.code(400).send({ message: validation.error });
    return;
  }

  if (validation.orders && validation.orders.length > MAX_ORDERS_PER_REQUEST) {
    reply.code(413).send({ 
      message: `Maximum ${MAX_ORDERS_PER_REQUEST} orders allowed per request` 
    });
    return;
  }

  (request as any).validatedOrders = validation.orders;
};
