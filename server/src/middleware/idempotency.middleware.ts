import { FastifyRequest, FastifyReply } from 'fastify';
import { IdempotencyStore } from '../store/idempotency.store';

/**
 * Extended FastifyRequest with idempotency key
 */
export interface IdempotentRequest extends FastifyRequest {
  idempotencyKey?: string;
}

/**
 * Idempotency Middleware
 * 
 * Checks for Idempotency-Key header and returns cached response
 * if the same key was used before. This enables safe request retries.
 * 
 * Industry standard: Used by Stripe, PayPal, AWS, etc.
 * 
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 * @returns void (sends response if cached, otherwise continues)
 */
export const idempotencyMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // Get idempotency key from header (case-insensitive)
  const idempotencyKey = 
    (request.headers['idempotency-key'] as string) ||
    (request.headers['Idempotency-Key'] as string);

  // Idempotency key must be provided
  if (!idempotencyKey) {
    reply.code(400).send({
      message: 'Idempotency-Key header is required',
      error: 'Missing required header: Idempotency-Key',
    });
    return;
  }

  // Validate key format (should be a valid UUID or similar)
  // Allow alphanumeric, hyphens, underscores, up to 128 chars
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(idempotencyKey)) {
    reply.code(400).send({
      message: 'Invalid idempotency key format. Must be 1-128 alphanumeric characters, hyphens, or underscores.',
    });
    return;
  }

  // Check if we've seen this key before
  const cached = IdempotencyStore.get(idempotencyKey);

  if (cached) {
    // Return cached response with original status code
    // This is the key to idempotency: same request = same response
    reply.code(cached.statusCode).send(cached.response);
    return;
  }

  // Store key on request for later use (to cache the response)
  (request as IdempotentRequest).idempotencyKey = idempotencyKey;
};

