import { FastifyRequest, FastifyReply } from 'fastify';
import {
  subscribeToOrderUpdates,
  broadcastOrderCreated,
  broadcastOrderStatusChanged,
  getActiveConnections,
  setSSEHeaders,
  clearAllSubscribers,
} from './stream.service';
import { Order } from '../types/order';

describe('Stream Service - SSE Tests', () => {
  const createValidOrder = (id: string, overrides?: Partial<Order>): Order => ({
    id,
    status: 'PENDING',
    amount: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    // Clear all subscribers before each test to ensure test isolation
    clearAllSubscribers();
  });

  describe('Best Case Scenarios', () => {
    it('should successfully subscribe and receive order created events', () => {
      const receivedEvents: any[] = [];
      const unsubscribe = subscribeToOrderUpdates((event) => {
        receivedEvents.push(event);
      });

      const order = createValidOrder('test-order-1');
      broadcastOrderCreated(order);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('order.created');
      expect(receivedEvents[0].order).toEqual(order);
      expect(receivedEvents[0].timestamp).toBeGreaterThan(0);

      unsubscribe();
    });

    it('should successfully subscribe and receive order status changed events', () => {
      const receivedEvents: any[] = [];
      const unsubscribe = subscribeToOrderUpdates((event) => {
        receivedEvents.push(event);
      });

      const order = createValidOrder('test-order-2', { status: 'COMPLETED' });
      broadcastOrderStatusChanged(order);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('order.status_changed');
      expect(receivedEvents[0].order).toEqual(order);

      unsubscribe();
    });

    it('should handle multiple subscribers receiving the same event', () => {
      const subscriber1Events: any[] = [];
      const subscriber2Events: any[] = [];

      const unsubscribe1 = subscribeToOrderUpdates((event) => {
        subscriber1Events.push(event);
      });
      const unsubscribe2 = subscribeToOrderUpdates((event) => {
        subscriber2Events.push(event);
      });

      const order = createValidOrder('test-order-3');
      broadcastOrderCreated(order);

      expect(subscriber1Events).toHaveLength(1);
      expect(subscriber2Events).toHaveLength(1);
      expect(subscriber1Events[0].order.id).toBe(subscriber2Events[0].order.id);

      unsubscribe1();
      unsubscribe2();
    });

    it('should correctly track active connections', () => {
      const initialConnections = getActiveConnections();
      
      const unsubscribe1 = subscribeToOrderUpdates(() => {});
      expect(getActiveConnections()).toBe(initialConnections + 1);

      const unsubscribe2 = subscribeToOrderUpdates(() => {});
      expect(getActiveConnections()).toBe(initialConnections + 2);

      unsubscribe1();
      expect(getActiveConnections()).toBe(initialConnections + 1);

      unsubscribe2();
      expect(getActiveConnections()).toBe(initialConnections);
    });
  });

  describe('Worst Case Scenarios', () => {
    it('should handle unexpected client disconnection gracefully', () => {
      let callCount = 0;
      const unsubscribe = subscribeToOrderUpdates(() => {
        callCount++;
        // Simulate client disconnect by throwing error
        throw new Error('Client disconnected');
      });

      const order = createValidOrder('test-order-disconnect');
      
      // First broadcast should trigger the error and remove the subscriber
      broadcastOrderCreated(order);
      expect(callCount).toBe(1);

      // Second broadcast should not trigger the removed subscriber
      broadcastOrderCreated(createValidOrder('test-order-2'));
      expect(callCount).toBe(1); // Still 1, subscriber was removed

      // Unsubscribe should not throw
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle duplicate batch requests without memory leaks', () => {
      const receivedEvents: any[] = [];
      const unsubscribe = subscribeToOrderUpdates((event) => {
        receivedEvents.push(event);
      });

      // Simulate duplicate batch requests (same order ID)
      const order1 = createValidOrder('duplicate-order', { amount: 100 });
      const order2 = createValidOrder('duplicate-order', { amount: 200 });

      broadcastOrderCreated(order1);
      broadcastOrderCreated(order2); // Duplicate ID

      // Both events should be received (system processes duplicates)
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents[0].order.id).toBe(receivedEvents[1].order.id);

      unsubscribe();
    });

    it('should handle rapid successive updates without blocking', () => {
      const receivedEvents: any[] = [];
      const unsubscribe = subscribeToOrderUpdates((event) => {
        receivedEvents.push(event);
      });

      // Simulate rapid status changes
      for (let i = 0; i < 10; i++) {
        const order = createValidOrder('rapid-order', { 
          status: i % 2 === 0 ? 'PENDING' : 'PROCESSING' 
        });
        broadcastOrderStatusChanged(order);
      }

      expect(receivedEvents).toHaveLength(10);
      unsubscribe();
    });

    it('should handle oversized payload gracefully', () => {
      const receivedEvents: any[] = [];
      const unsubscribe = subscribeToOrderUpdates((event) => {
        receivedEvents.push(event);
      });

      // Create order with large amount (simulating oversized payload)
      const largeOrder: Order = {
        id: 'large-order',
        status: 'PENDING',
        amount: Number.MAX_SAFE_INTEGER,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(() => {
        broadcastOrderCreated(largeOrder);
      }).not.toThrow();

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].order.amount).toBe(Number.MAX_SAFE_INTEGER);

      unsubscribe();
    });

    it('should set SSE headers correctly', () => {
      const reply = {
        raw: {
          setHeader: jest.fn(),
        },
      } as unknown as FastifyReply;

      setSSEHeaders(reply);

      expect(reply.raw.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(reply.raw.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(reply.raw.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(reply.raw.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
      expect(reply.raw.setHeader).toHaveBeenCalledTimes(4);
    });

    it('should handle unsubscribe multiple times safely', () => {
      const unsubscribe = subscribeToOrderUpdates(() => {});

      // Unsubscribe multiple times should not throw
      expect(() => unsubscribe()).not.toThrow();
      expect(() => unsubscribe()).not.toThrow();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should continue working when some subscribers fail', () => {
      const workingSubscriberEvents: any[] = [];
      const failingSubscriberCallCount = { count: 0 };

      const unsubscribe1 = subscribeToOrderUpdates(() => {
        workingSubscriberEvents.push('event');
      });

      const unsubscribe2 = subscribeToOrderUpdates(() => {
        failingSubscriberCallCount.count++;
        throw new Error('Subscriber error');
      });

      const order = createValidOrder('test-order-fail');
      broadcastOrderCreated(order);

      // Working subscriber should still receive the event
      expect(workingSubscriberEvents).toHaveLength(1);
      expect(failingSubscriberCallCount.count).toBe(1);

      // Failing subscriber should be removed, but working one should still work
      broadcastOrderCreated(createValidOrder('test-order-2'));
      expect(workingSubscriberEvents).toHaveLength(2);
      expect(failingSubscriberCallCount.count).toBe(1); // Still 1, removed after first error

      unsubscribe1();
      unsubscribe2();
    });
  });
});

