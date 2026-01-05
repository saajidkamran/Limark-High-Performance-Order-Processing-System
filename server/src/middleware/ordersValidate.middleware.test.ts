import { FastifyRequest, FastifyReply } from 'fastify';
import { validateOrdersInput, validateOrdersBatchMiddleware } from './ordersValidate.middleware';
import { Order } from '../types/order';

describe('Orders Validation Middleware Tests', () => {
  const createValidOrder = (id: string): Order => ({
    id,
    status: 'PENDING',
    amount: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  describe('validateOrdersInput - best case Scenarios', () => {
    it('should validate valid orders array', () => {
      const orders = [createValidOrder('order-1'), createValidOrder('order-2')];

      const result = validateOrdersInput(orders);

      expect(result.valid).toBe(true);
      expect(result.orders).toEqual(orders);
      expect(result.error).toBeUndefined();
    });

    it('should validate single order', () => {
      const orders = [createValidOrder('order-1')];

      const result = validateOrdersInput(orders);

      expect(result.valid).toBe(true);
      expect(result.orders).toEqual(orders);
    });
  });

  describe('validateOrdersInput - worst case Scenarios', () => {
    it('should reject non-array input', () => {
      const result = validateOrdersInput({ not: 'array' });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Body must be an array');
    });

    it('should reject empty array', () => {
      const result = validateOrdersInput([]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Orders array cannot be empty');
    });

    it('should reject order without id', () => {
      const orders = [{ status: 'PENDING', amount: 100 } as any];

      const result = validateOrdersInput(orders);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('All orders must have a valid id (string)');
    });

    it('should reject order without status', () => {
      const orders = [{ id: 'order-1', amount: 100 } as any];

      const result = validateOrdersInput(orders);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('All orders must have a valid status (string)');
    });

    it('should reject order without amount', () => {
      const orders = [{ id: 'order-1', status: 'PENDING' } as any];

      const result = validateOrdersInput(orders);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('All orders must have a valid amount (number)');
    });

    it('should reject null items', () => {
      const result = validateOrdersInput([null]);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('All items must be objects');
    });
  });

  describe('validateOrdersBatchMiddleware - Good Scenarios', () => {
    it('should accept valid orders and set validatedOrders', async () => {
      const orders = [createValidOrder('order-1')];
      const request = {
        body: orders,
      } as FastifyRequest;
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      await validateOrdersBatchMiddleware(request, reply);

      expect(reply.code).not.toHaveBeenCalled();
      expect((request as any).validatedOrders).toEqual(orders);
    });
  });

  describe('validateOrdersBatchMiddleware - worst case Scenarios', () => {
    it('should reject invalid input with 400', async () => {
      const request = {
        body: { not: 'array' },
      } as FastifyRequest;
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      await validateOrdersBatchMiddleware(request, reply);

      expect(reply.code).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        message: 'Body must be an array',
      });
    });

    it('should reject too many orders with 413', async () => {
      const orders = Array.from({ length: 1001 }, (_, i) =>
        createValidOrder(`order-${i}`)
      );
      const request = {
        body: orders,
      } as FastifyRequest;
      const reply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      await validateOrdersBatchMiddleware(request, reply);

      expect(reply.code).toHaveBeenCalledWith(413);
      expect(reply.send).toHaveBeenCalledWith({
        message: 'Maximum 1000 orders allowed per request',
      });
    });
  });
});

