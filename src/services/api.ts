
import axios from 'axios';
import { Order, OrderStatus, SystemMemory, SystemPerformance, BottleneckLog } from '../types';

const generateInitialOrders = (count: number): Order[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `ORD-${10000 + i}`,
    customer: ['Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Prince', 'Evan Wright'][Math.floor(Math.random() * 5)],
    timestamp: new Date(Date.now() - Math.random() * 10000000).toISOString(),
    items: Math.floor(Math.random() * 10) + 1,
    total: parseFloat((Math.random() * 500).toFixed(2)),
    status: [OrderStatus.PENDING, OrderStatus.PROCESSED, OrderStatus.SHIPPED][Math.floor(Math.random() * 3)],
    latency: Math.floor(Math.random() * 150) + 20,
  }));
};

const generateIdempotencyKey = (): string => {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2)}`;
};

let db = generateInitialOrders(10000);
// TODO: Move for env 
const API_BASE_URL = 'http://localhost:3002/api';

const transformToServerFormat = (order: any) => {
  if (order.amount !== undefined && order.createdAt !== undefined) {
    return {
      id: order.id,
      status: order.status,
      amount: order.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || Date.now(),
    };
  }
  return {
    id: order.id,
    status: order.status,
    amount: order.total || 0,
    createdAt: order.timestamp ? new Date(order.timestamp).getTime() : Date.now(),
    updatedAt: Date.now(),
  };
};

export const mockApi = {
  // 1. POST /api/orders/batch
  async uploadBatch(ordersOrCount: Order[] | number = 1000): Promise<Order[]> {
    const orders: Order[] = typeof ordersOrCount === 'number' 
      ? generateInitialOrders(ordersOrCount)
      : ordersOrCount;

    const idempotencyKey = generateIdempotencyKey();
    const serverOrders = orders.map(transformToServerFormat);

    try {
      await axios.post(`${API_BASE_URL}/orders/batch`, serverOrders, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return orders;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data?.message || 'Upload failed');
      }
      throw new Error('Upload failed');
    }
  },

  // 2. GET /api/orders/{id}
  async getOrderById(id: string): Promise<Order | null> {
    await new Promise(r => setTimeout(r, 50));
    return db.find(o => o.id === id) || null;
  },

  // 3. PUT /api/orders/{id}/status
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await new Promise(r => setTimeout(r, 100));
    const index = db.findIndex(o => o.id === id);
    if (index !== -1) {
      db[index] = { ...db[index], status };
      return db[index];
    }
    return null;
  },

  // 4. GET /api/orders/stream
  async getInitialOrders(): Promise<Order[]> {
    return db;
  },

  // 5. POST /api/orders/stress-test
  async toggleStressTest(active: boolean): Promise<{ status: string }> {
    return { status: active ? 'Stress test started' : 'Stress test stopped' };
  },

  // 6. GET /api/system/memory
  async getMemoryUsage(): Promise<SystemMemory> {
    const usage = window.performance && (window.performance as any).memory;
    return {
      heapUsed: usage ? usage.usedJSHeapSize / (1024 * 1024) : 45 + Math.random() * 10,
      heapTotal: usage ? usage.totalJSHeapSize / (1024 * 1024) : 128,
      external: Math.random() * 5,
      timestamp: Date.now()
    };
  },

  // 7. GET /api/system/performance
  async getPerformance(): Promise<SystemPerformance> {
    return {
      latencyMs: 120 + Math.random() * 40,
      systemHealth: 98 + Math.random() * 2,
      requestsPerSecond: 4500 + Math.random() * 1000
    };
  },

  // 8. GET /api/system/health
  async getHealth(): Promise<{ status: string; uptime: number }> {
    return { status: 'healthy', uptime: Math.floor(Date.now() / 1000) };
  },

  // 9. GET /api/analytics/throughput
  async getThroughput(): Promise<number> {
    return 5200 + Math.random() * 800;
  },

  // 10. GET /api/analytics/latency
  async getAverageLatency(): Promise<number> {
    return 135.5;
  },

  // 11. GET /api/analytics/bottlenecks
  async getBottlenecks(): Promise<BottleneckLog[]> {
    return [
      { id: '1', type: 'LATENCY', message: 'DB Connection pool saturation at 85%', timestamp: Date.now(), severity: 'warning' }
    ];
  }
};
