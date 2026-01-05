import { FastifyRequest, FastifyReply } from 'fastify';
import { validateOrderId, validateOrderIdMiddleware } from './validateId.middleware';

describe('Validate ID Middleware Tests', () => {
  describe('validateOrderId - Main Scenarios', () => {
    it('should validate valid order ID', () => {
      const result = validateOrderId('order-123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid ID format', () => {
      const result = validateOrderId('invalid id with spaces');

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Order ID must be 1-128 alphanumeric characters, hyphens, or underscores'
      );
    });

    it('should reject empty ID', () => {
      const result = validateOrderId('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Order ID cannot be empty');
    });
  });

  describe('validateOrderIdMiddleware - Main Scenarios', () => {
    it('should accept valid ID and continue', async () => {
      const request = {
        params: { id: 'valid-order-123' },
      } as FastifyRequest;
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      await validateOrderIdMiddleware(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect(reply.send).not.toHaveBeenCalled();
    });

    it('should reject invalid ID with 400', async () => {
      const request = {
        params: { id: 'invalid id' },
      } as FastifyRequest;
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      await validateOrderIdMiddleware(request, reply);

      expect(reply.code).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalled();
    });
  });
});

