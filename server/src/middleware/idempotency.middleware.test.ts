import { FastifyRequest, FastifyReply } from 'fastify';
import { idempotencyMiddleware, IdempotentRequest } from './idempotency.middleware';
import { IdempotencyStore } from '../store/idempotency.store';

const createMockRequest = (headers: Record<string, string> = {}): Partial<FastifyRequest> => ({
  headers,
  method: 'POST',
  body: {},
});

const createMockReply = (): Partial<FastifyReply> => {
  const reply = {
    code: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
};

describe('idempotencyMiddleware - Critical Tests', () => {
  beforeEach(() => {
    IdempotencyStore.clear();
    jest.clearAllMocks();
  });

  it('should accept valid idempotency key and continue', async () => {
    const request = createMockRequest({ 'idempotency-key': 'valid-key-123' });
    const reply = createMockReply();

    await idempotencyMiddleware(
      request as FastifyRequest,
      reply as FastifyReply
    );

    expect(reply.code).not.toHaveBeenCalled();
    expect((request as IdempotentRequest).idempotencyKey).toBe('valid-key-123');
  });

  it('should return cached response when key exists', async () => {
    const key = 'cached-key';
    const cachedResponse = { success: true, data: 'cached' };
    const statusCode = 201;

    IdempotencyStore.set(key, cachedResponse, statusCode);

    const request = createMockRequest({ 'idempotency-key': key });
    const reply = createMockReply();

    await idempotencyMiddleware(
      request as FastifyRequest,
      reply as FastifyReply
    );

    expect(reply.code).toHaveBeenCalledWith(statusCode);
    expect(reply.send).toHaveBeenCalledWith(cachedResponse);
  });

  it('should reject request without idempotency key', async () => {
    const request = createMockRequest();
    const reply = createMockReply();

    await idempotencyMiddleware(
      request as FastifyRequest,
      reply as FastifyReply
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      message: 'Idempotency-Key header is required',
      error: 'Missing required header: Idempotency-Key',
    });
  });

  it('should reject invalid key format', async () => {
    const request = createMockRequest({ 'idempotency-key': 'key with spaces' });
    const reply = createMockReply();

    await idempotencyMiddleware(
      request as FastifyRequest,
      reply as FastifyReply
    );

    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Invalid idempotency key format'),
      })
    );
  });
});

