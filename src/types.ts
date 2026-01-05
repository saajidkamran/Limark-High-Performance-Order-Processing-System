
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED'
}

export interface Order {
  id: string;
  customer: string;
  timestamp: string;
  items: number;
  total: number;
  status: OrderStatus;
  latency: number;
}

export interface SystemMemory {
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: number;
}

export interface SystemPerformance {
  latencyMs: number;
  systemHealth: number;
  requestsPerSecond: number;
}

export interface BottleneckLog {
  id: string;
  type: 'LATENCY' | 'MEMORY' | 'THROUGHPUT';
  message: string;
  timestamp: number;
  severity: 'warning' | 'critical';
}

export interface ThroughputData {
  time: string;
  rps: number;
}

export interface LatencyData {
  time: string;
  latency: number;
}
