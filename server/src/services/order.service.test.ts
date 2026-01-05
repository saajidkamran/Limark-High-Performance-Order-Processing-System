import { Order } from '../types/order';
import { 
  processOrder, 
  processBatch, 
  processOrdersBatch,
  getOrderById,
  updateOrderStatus
} from './order.service';
import { OrderStore } from '../store/order.store';
import { OrderCacheStore } from '../store/cache/order.store';

describe('Order Service - Critical Batch Processing Tests', () => {
  beforeEach(() => {
    OrderStore.clear();
    OrderCacheStore.clear();
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

  describe('getOrderById - Caching Scenarios', () => {
    it('should return order from DB on first request', () => {
      const order = createValidOrder('cache-test-1');
      OrderStore.bulkInsert([order]);

      const result = getOrderById('cache-test-1');

      expect(result.order).toEqual(order);
      expect(result.cacheHit).toBe(false); // First request = cache miss
      expect(result.cacheAge).toBeUndefined();
    });

    it('should return order from cache on second request', () => {
      const order = createValidOrder('cache-test-2');
      OrderStore.bulkInsert([order]);

      // First request - should be from DB
      const firstResult = getOrderById('cache-test-2');
      expect(firstResult.cacheHit).toBe(false);
      expect(firstResult.order).toEqual(order);

      // Second request - should be from cache
      const secondResult = getOrderById('cache-test-2');
      expect(secondResult.cacheHit).toBe(true);
      expect(secondResult.order).toEqual(order);
      expect(secondResult.cacheAge).toBeDefined();
      expect(secondResult.cacheAge).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 (null) for missing order', () => {
      const result = getOrderById('non-existent-order');

      expect(result.order).toBeNull();
      expect(result.cacheHit).toBe(false);
      expect(result.cacheAge).toBeUndefined();
    });
  });

  describe('updateOrderStatus - Cache Invalidation', () => {
    it('should invalidate cache after status update', () => {
      const order = createValidOrder('cache-invalidation-test', { status: 'PENDING' });
      OrderStore.bulkInsert([order]);

      // First request - cache the order
      const firstResult = getOrderById('cache-invalidation-test');
      expect(firstResult.cacheHit).toBe(false);
      expect(firstResult.order?.status).toBe('PENDING');

      // Second request - should be from cache
      const secondResult = getOrderById('cache-invalidation-test');
      expect(secondResult.cacheHit).toBe(true);
      expect(secondResult.order?.status).toBe('PENDING');

      // Update order status - this should invalidate cache
      const updated = updateOrderStatus('cache-invalidation-test', 'COMPLETED');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('COMPLETED');

      // Third request - should be from DB (cache was invalidated and re-cached)
      // Since updateOrderStatus re-caches immediately, it should be a cache hit
      const thirdResult = getOrderById('cache-invalidation-test');
      expect(thirdResult.order?.status).toBe('COMPLETED');
      // Cache was invalidated and immediately re-cached, so it's a hit with fresh data
      expect(thirdResult.cacheHit).toBe(true);
    });

    it('should return null when updating non-existent order', () => {
      const result = updateOrderStatus('non-existent', 'COMPLETED');
      expect(result).toBeNull();
    });
  });
});

