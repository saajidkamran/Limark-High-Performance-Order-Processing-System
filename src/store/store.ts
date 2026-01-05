
import { create } from 'zustand';
import { Order, SystemMemory, SystemPerformance, BottleneckLog, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  orderMap: Record<string, Order>;
  isStressTesting: boolean;
  systemMemory: SystemMemory[];
  performance: SystemPerformance;
  bottlenecks: BottleneckLog[];
  throughputHistory: { time: string; rps: number }[];
  latencyHistory: { time: string; latency: number }[];
  
  // Actions
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  addOrdersBatch: (batch: Order[]) => void;
  setStressTesting: (active: boolean) => void;
  updateSystemMetrics: (memory: SystemMemory, perf: SystemPerformance) => void;
  addBottleneck: (log: BottleneckLog) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  orderMap: {},
  isStressTesting: false,
  systemMemory: [],
  performance: { latencyMs: 0, systemHealth: 100, requestsPerSecond: 0 },
  bottlenecks: [],
  throughputHistory: [],
  latencyHistory: [],

  setOrders: (orders) => {
    const map = orders.reduce((acc, order) => {
      acc[order.id] = order;
      return acc;
    }, {} as Record<string, Order>);
    set({ orders, orderMap: map });
  },

  updateOrderStatus: (id, status) => set((state) => {
    const existingOrder = state.orderMap[id];
    if (!existingOrder || existingOrder.status === status) return state;

    const updatedOrder = { ...existingOrder, status };
    const newOrderMap = { ...state.orderMap, [id]: updatedOrder };
    
    // Efficiently update the array without iterating the whole thing if possible
    // For virtualization, we still need a new array reference
    const newOrders = state.orders.map(o => o.id === id ? updatedOrder : o);

    return { orders: newOrders, orderMap: newOrderMap };
  }),

  addOrdersBatch: (batch) => set((state) => {
    const newOrders = [...batch, ...state.orders].slice(0, 15000); 
    const newMap = { ...state.orderMap };
    batch.forEach(o => { newMap[o.id] = o; });
    return { orders: newOrders, orderMap: newMap };
  }),

  setStressTesting: (active) => set({ isStressTesting: active }),

  updateSystemMetrics: (memory, perf) => set((state) => {
    const timeStr = new Date().toLocaleTimeString();
    return {
      systemMemory: [...state.systemMemory, memory].slice(-30),
      performance: perf,
      throughputHistory: [...state.throughputHistory, { time: timeStr, rps: perf.requestsPerSecond }].slice(-30),
      latencyHistory: [...state.latencyHistory, { time: timeStr, latency: perf.latencyMs }].slice(-30),
    };
  }),

  addBottleneck: (log) => set((state) => ({
    bottlenecks: [log, ...state.bottlenecks].slice(0, 50)
  })),
}));
