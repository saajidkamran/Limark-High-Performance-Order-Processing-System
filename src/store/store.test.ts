import { describe, it, expect, beforeEach } from '@jest/globals';
import { useOrderStore } from './store';
import { Order, OrderStatus, SystemMemory, SystemPerformance, BottleneckLog } from '../types';

describe('Order Store - Main Scenarios', () => {
  beforeEach(() => {
    // Reset store before each test
    useOrderStore.setState({
      orders: [],
      orderMap: {},
      isStressTesting: false,
      systemMemory: [],
      performance: { latencyMs: 0, systemHealth: 100, requestsPerSecond: 0 },
      bottlenecks: [],
      throughputHistory: [],
      latencyHistory: [],
    });
  });

  describe('Happy Path - Normal Operations', () => {
    it('should set orders and create orderMap correctly', () => {
      const orders: Order[] = [
        {
          id: 'ORD-10001',
          customer: 'John Doe',
          timestamp: new Date().toISOString(),
          items: 5,
          total: 250.50,
          status: OrderStatus.PENDING,
          latency: 50,
        },
        {
          id: 'ORD-10002',
          customer: 'Jane Smith',
          timestamp: new Date().toISOString(),
          items: 3,
          total: 150.75,
          status: OrderStatus.PROCESSED,
          latency: 30,
        },
      ];

      useOrderStore.getState().setOrders(orders);

      const state = useOrderStore.getState();
      expect(state.orders).toHaveLength(2);
      expect(state.orderMap['ORD-10001']).toEqual(orders[0]);
      expect(state.orderMap['ORD-10002']).toEqual(orders[1]);
    });

    it('should update order status successfully', () => {
      const order: Order = {
        id: 'ORD-10001',
        customer: 'John Doe',
        timestamp: new Date().toISOString(),
        items: 5,
        total: 250.50,
        status: OrderStatus.PENDING,
        latency: 50,
      };

      useOrderStore.getState().setOrders([order]);
      useOrderStore.getState().updateOrderStatus('ORD-10001', OrderStatus.PROCESSED);

      const state = useOrderStore.getState();
      expect(state.orderMap['ORD-10001'].status).toBe(OrderStatus.PROCESSED);
      expect(state.orders[0].status).toBe(OrderStatus.PROCESSED);
    });

    it('should add orders batch correctly', () => {
      const batch: Order[] = [
        {
          id: 'ORD-10001',
          customer: 'John Doe',
          timestamp: new Date().toISOString(),
          items: 5,
          total: 250.50,
          status: OrderStatus.PENDING,
          latency: 50,
        },
        {
          id: 'ORD-10002',
          customer: 'Jane Smith',
          timestamp: new Date().toISOString(),
          items: 3,
          total: 150.75,
          status: OrderStatus.PROCESSED,
          latency: 30,
        },
      ];

      useOrderStore.getState().addOrdersBatch(batch);

      const state = useOrderStore.getState();
      expect(state.orders).toHaveLength(2);
      expect(state.orderMap['ORD-10001']).toBeDefined();
      expect(state.orderMap['ORD-10002']).toBeDefined();
    });

    it('should update system metrics correctly', () => {
      const memory: SystemMemory = {
        heapUsed: 50.5,
        heapTotal: 128,
        external: 2.3,
        timestamp: Date.now(),
      };

      const perf: SystemPerformance = {
        latencyMs: 120,
        systemHealth: 98,
        requestsPerSecond: 5000,
      };

      useOrderStore.getState().updateSystemMetrics(memory, perf);

      const state = useOrderStore.getState();
      expect(state.systemMemory).toHaveLength(1);
      expect(state.performance).toEqual(perf);
      expect(state.throughputHistory).toHaveLength(1);
      expect(state.latencyHistory).toHaveLength(1);
    });

    it('should toggle stress testing mode', () => {
      useOrderStore.getState().setStressTesting(true);
      expect(useOrderStore.getState().isStressTesting).toBe(true);

      useOrderStore.getState().setStressTesting(false);
      expect(useOrderStore.getState().isStressTesting).toBe(false);
    });

    it('should add bottleneck logs', () => {
      const bottleneck: BottleneckLog = {
        id: '1',
        type: 'LATENCY',
        message: 'High latency detected',
        timestamp: Date.now(),
        severity: 'warning',
      };

      useOrderStore.getState().addBottleneck(bottleneck);

      const state = useOrderStore.getState();
      expect(state.bottlenecks).toHaveLength(1);
      expect(state.bottlenecks[0]).toEqual(bottleneck);
    });
  });

  describe('Best Case - Optimal Scenarios', () => {
    it('should handle large batch of orders efficiently (10k orders)', () => {
      const largeBatch: Order[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `ORD-${10000 + i}`,
        customer: `Customer ${i}`,
        timestamp: new Date().toISOString(),
        items: Math.floor(Math.random() * 10) + 1,
        total: Math.random() * 500,
        status: OrderStatus.PENDING,
        latency: 20,
      }));

      const startTime = performance.now();
      useOrderStore.getState().addOrdersBatch(largeBatch);
      const endTime = performance.now();

      const state = useOrderStore.getState();
      expect(state.orders.length).toBeLessThanOrEqual(15000); // Should cap at 15000
      expect(state.orderMap).toHaveProperty('ORD-10000');
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should maintain performance history limit (30 entries)', () => {
      const memory: SystemMemory = {
        heapUsed: 50,
        heapTotal: 128,
        external: 2,
        timestamp: Date.now(),
      };

      const perf: SystemPerformance = {
        latencyMs: 120,
        systemHealth: 98,
        requestsPerSecond: 5000,
      };

      // Add 35 metrics
      for (let i = 0; i < 35; i++) {
        useOrderStore.getState().updateSystemMetrics(memory, perf);
      }

      const state = useOrderStore.getState();
      expect(state.systemMemory.length).toBe(30);
      expect(state.throughputHistory.length).toBe(30);
      expect(state.latencyHistory.length).toBe(30);
    });

    it('should handle rapid status updates efficiently', () => {
      const order: Order = {
        id: 'ORD-10001',
        customer: 'John Doe',
        timestamp: new Date().toISOString(),
        items: 5,
        total: 250.50,
        status: OrderStatus.PENDING,
        latency: 50,
      };

      useOrderStore.getState().setOrders([order]);

      // Simulate rapid updates
      const statuses = [
        OrderStatus.PROCESSED,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
      ];

      statuses.forEach((status) => {
        useOrderStore.getState().updateOrderStatus('ORD-10001', status);
      });

      const state = useOrderStore.getState();
      expect(state.orderMap['ORD-10001'].status).toBe(OrderStatus.DELIVERED);
    });

    it('should maintain bottleneck log limit (50 entries)', () => {
      // Add 55 bottlenecks
      for (let i = 0; i < 55; i++) {
        useOrderStore.getState().addBottleneck({
          id: `${i}`,
          type: 'LATENCY',
          message: `Bottleneck ${i}`,
          timestamp: Date.now(),
          severity: 'warning',
        });
      }

      const state = useOrderStore.getState();
      expect(state.bottlenecks.length).toBe(50);
    });

    it('should handle concurrent batch additions', () => {
      const batch1: Order[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `ORD-${10000 + i}`,
        customer: `Customer ${i}`,
        timestamp: new Date().toISOString(),
        items: 5,
        total: 250,
        status: OrderStatus.PENDING,
        latency: 50,
      }));

      const batch2: Order[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `ORD-${11000 + i}`,
        customer: `Customer ${i + 1000}`,
        timestamp: new Date().toISOString(),
        items: 3,
        total: 150,
        status: OrderStatus.PROCESSED,
        latency: 30,
      }));

      useOrderStore.getState().addOrdersBatch(batch1);
      useOrderStore.getState().addOrdersBatch(batch2);

      const state = useOrderStore.getState();
      expect(state.orders.length).toBeLessThanOrEqual(15000);
      expect(state.orderMap['ORD-10000']).toBeDefined();
      expect(state.orderMap['ORD-11000']).toBeDefined();
    });
  });

  describe(' Error Handling & Edge Cases', () => {
    it('should not update status if order does not exist', () => {
      const initialState = useOrderStore.getState();
      useOrderStore.getState().updateOrderStatus('NON-EXISTENT', OrderStatus.PROCESSED);

      const state = useOrderStore.getState();
      expect(state.orders).toEqual(initialState.orders);
      expect(state.orderMap).toEqual(initialState.orderMap);
    });

    it('should not update status if status is the same', () => {
      const order: Order = {
        id: 'ORD-10001',
        customer: 'John Doe',
        timestamp: new Date().toISOString(),
        items: 5,
        total: 250.50,
        status: OrderStatus.PENDING,
        latency: 50,
      };

      useOrderStore.getState().setOrders([order]);
      const stateBefore = useOrderStore.getState();
      useOrderStore.getState().updateOrderStatus('ORD-10001', OrderStatus.PENDING);

      const stateAfter = useOrderStore.getState();
      // Should return early and not update
      expect(stateAfter.orders[0].status).toBe(OrderStatus.PENDING);
    });

    it('should handle empty orders array', () => {
      useOrderStore.getState().setOrders([]);

      const state = useOrderStore.getState();
      expect(state.orders).toHaveLength(0);
      expect(Object.keys(state.orderMap)).toHaveLength(0);
    });

    it('should handle empty batch addition', () => {
      const initialState = useOrderStore.getState();
      useOrderStore.getState().addOrdersBatch([]);

      const state = useOrderStore.getState();
      expect(state.orders).toEqual(initialState.orders);
    });

    it('should handle duplicate order IDs in batch (last one wins)', () => {
      const batch: Order[] = [
        {
          id: 'ORD-10001',
          customer: 'John Doe',
          timestamp: new Date().toISOString(),
          items: 5,
          total: 250.50,
          status: OrderStatus.PENDING,
          latency: 50,
        },
        {
          id: 'ORD-10001', // Duplicate ID
          customer: 'Jane Smith',
          timestamp: new Date().toISOString(),
          items: 3,
          total: 150.75,
          status: OrderStatus.PROCESSED,
          latency: 30,
        },
      ];

      useOrderStore.getState().addOrdersBatch(batch);

      const state = useOrderStore.getState();
      expect(state.orderMap['ORD-10001'].customer).toBe('Jane Smith'); // Last one wins
    });

    it('should handle invalid system metrics gracefully', () => {
      const invalidMemory: SystemMemory = {
        heapUsed: -1, // Invalid
        heapTotal: 0, // Invalid
        external: NaN, // Invalid
        timestamp: Date.now(),
      };

      const invalidPerf: SystemPerformance = {
        latencyMs: Infinity,
        systemHealth: -100, // Invalid
        requestsPerSecond: -1, // Invalid
      };

      // Should not throw
      expect(() => {
        useOrderStore.getState().updateSystemMetrics(invalidMemory, invalidPerf);
      }).not.toThrow();

      const state = useOrderStore.getState();
      expect(state.performance).toEqual(invalidPerf); // Store accepts but validation should be in UI
    });

    it('should handle extremely large order batch (cap at 15000)', () => {
      const hugeBatch: Order[] = Array.from({ length: 20000 }, (_, i) => ({
        id: `ORD-${10000 + i}`,
        customer: `Customer ${i}`,
        timestamp: new Date().toISOString(),
        items: 5,
        total: 250,
        status: OrderStatus.PENDING,
        latency: 50,
      }));

      useOrderStore.getState().addOrdersBatch(hugeBatch);

      const state = useOrderStore.getState();
      expect(state.orders.length).toBeLessThanOrEqual(15000);
    });

    it('should handle null/undefined order properties gracefully', () => {
      const invalidOrder = {
        id: 'ORD-10001',
        customer: null as any,
        timestamp: undefined as any,
        items: NaN,
        total: Infinity,
        status: OrderStatus.PENDING,
        latency: -1,
      };

      // Should not throw
      expect(() => {
        useOrderStore.getState().setOrders([invalidOrder as Order]);
      }).not.toThrow();
    });

    it('should handle bottleneck with missing required fields', () => {
      const incompleteBottleneck = {
        id: '1',
        type: 'LATENCY' as const,
        message: '',
        timestamp: Date.now(),
        severity: 'warning' as const,
      };

      expect(() => {
        useOrderStore.getState().addBottleneck(incompleteBottleneck);
      }).not.toThrow();

      const state = useOrderStore.getState();
      expect(state.bottlenecks[0]).toEqual(incompleteBottleneck);
    });
  });
});

