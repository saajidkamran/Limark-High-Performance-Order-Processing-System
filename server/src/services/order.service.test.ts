import { Order } from '../types/order';
import { processOrder, processBatch, processOrdersBatch } from './order.service';
import { OrderStore } from '../store/order.store';

describe('Order Service - Critical Batch Processing Tests', () => {
  beforeEach(() => {
    OrderStore.clear();
  });
  const createValidOrder = (id: string, overrides?: Partial<Order>): Order => ({
    id,
    status: 'PENDING',
    amount: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  describe('processOrder - Scenarios', () => {
    it('should process a valid new order successfully', () => {
      const order = createValidOrder('order-1');

      const result = processOrder(order);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(order);
      expect(OrderStore.getById('order-1')).toEqual(order);
    });

    it('should process duplicate order (idempotency handled at request level)', () => {
      const order = createValidOrder('order-2', { status: 'PENDING', amount: 200 });

      // First processing
      const result1 = processOrder(order);
      expect(result1.success).toBe(true);

      // Second processing - idempotency is handled at request level, so this will succeed
      const result2 = processOrder(order);

      expect(result2.success).toBe(true);
      // Order will be overwritten in store (idempotency prevents this at request level)
    });

    it('should reject order with invalid data', () => {
      const order = createValidOrder('order-3', { amount: -100 });

      const result = processOrder(order);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid order data');
    });
  });

  describe('processBatch - Scenarios', () => {
    it('should process a batch of valid orders', async () => {
      const orders = [
        createValidOrder('batch-1'),
        createValidOrder('batch-2'),
        createValidOrder('batch-3'),
      ];

      const result = await processBatch(orders, 0);

      expect(result.batchIndex).toBe(0);
      expect(result.processed).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle mixed success and failure in batch', async () => {
      const orders = [
        createValidOrder('batch-4'),
        createValidOrder('batch-5', { amount: -100 }), // Invalid
        createValidOrder('batch-6'),
      ];

      const result = await processBatch(orders, 0);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toBeDefined();
    });
  });

  describe('processOrdersBatch - Scenarios', () => {
    it('should process orders in batches successfully', async () => {
      const orders = Array.from({ length: 50 }, (_, i) =>
        createValidOrder(`batch-order-${i}`)
      );

      const result = await processOrdersBatch(orders, 10);

      expect(result.totalProcessed).toBe(50);
      expect(result.totalFailed).toBe(0);
      expect(result.batchResults.length).toBe(5); // 50 / 10 = 5 batches
    });

    it('should handle batch with mixed valid and invalid orders', async () => {
      const orders = [
        createValidOrder('mixed-1'),
        createValidOrder('mixed-2', { amount: -100 }), // Invalid
        createValidOrder('mixed-3'),
        createValidOrder('mixed-4', { status: 'INVALID' as any }), // Invalid
        createValidOrder('mixed-5'),
      ];

      const result = await processOrdersBatch(orders, 2);

      expect(result.totalProcessed).toBe(3);
      expect(result.totalFailed).toBe(2);
    });

    it('should throw error for invalid batch size', async () => {
      const orders = [createValidOrder('test-1')];

      await expect(processOrdersBatch(orders, 0)).rejects.toThrow();
      await expect(processOrdersBatch(orders, 1001)).rejects.toThrow();
    });
  });
});

