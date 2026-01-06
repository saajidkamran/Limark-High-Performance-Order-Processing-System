/**
 * Stress Test Service
 * 
 * Generates high-volume load to test system performance and reliability.
 * Used for load testing and performance benchmarking.
 */

import { Order } from '../types/order';
import { processOrdersBatch } from './order.service';
import { OrderStore } from '../store/order.store';
import { getActiveConnections } from './stream.service';

interface StressTestConfig {
  orderCount: number;
  batchSize: number;
  concurrentBatches?: number;
}

interface StressTestResult {
  success: boolean;
  totalOrders: number;
  processed: number;
  failed: number;
  duration: number;
  ordersPerSecond: number;
  averageLatency: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  activeConnections: number;
  timestamp: number;
}

/**
 * Generate random order for stress testing
 */
const generateTestOrder = (index: number): Order => {
  const statuses: Order['status'][] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
  return {
    id: `stress-test-order-${Date.now()}-${index}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    amount: Math.floor(Math.random() * 10000),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

/**
 * Run stress test with specified configuration
 */
export const runStressTest = async (
  config: StressTestConfig
): Promise<StressTestResult> => {
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage();
  
  const { orderCount, batchSize } = config;

  // Generate all test orders
  const allOrders: Order[] = [];
  for (let i = 0; i < orderCount; i++) {
    allOrders.push(generateTestOrder(i));
  }

  // Process all orders using existing processOrdersBatch function
  // It handles batching, validation, and aggregation internally
  let result;
  try {
    result = await processOrdersBatch(allOrders, batchSize);
  } catch (e) {
    // If processing fails completely, all orders failed
    result = {
      totalProcessed: 0,
      totalFailed: orderCount,
      batchResults: [],
    };
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const memoryAfter = process.memoryUsage();

  // Calculate metrics
  const ordersPerSecond = duration > 0
    ? (result.totalProcessed / duration) * 1000
    : 0;

  // Calculate average latency from batch results
  const averageLatency = result.batchResults.length > 0
    ? duration / result.batchResults.length
    : 0;

  return {
    success: result.totalFailed === 0,
    totalOrders: orderCount,
    processed: result.totalProcessed,
    failed: result.totalFailed,
    duration,
    ordersPerSecond: Math.round(ordersPerSecond),
    averageLatency: Math.round(averageLatency),
    memoryUsage: {
      heapUsed: Math.round(memoryAfter.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryAfter.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memoryAfter.rss / 1024 / 1024), // MB
    },
    activeConnections: getActiveConnections(),
    timestamp: endTime,
  };
};

