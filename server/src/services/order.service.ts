import { Order } from '../types/order';
import {
  BatchProcessResult,
  BatchResult,
  ProcessResult,
  
} from '../types/order.service';
import { OrderStore } from '../store/order.store';
import { OrderCacheStore } from '../store/cache/order.store';
import { validateOrder, validateBatchSize } from '../validators/order.validator';
import { splitIntoBatches, aggregateBatchResults, calculateProgress } from '../utils/batch.utils';
import { broadcastOrderCreated, broadcastOrderStatusChanged } from './stream.service';

/**
 * Pure function: Processes a single order and returns result
 * Note: Idempotency is handled at the request level via idempotency middleware
 */
export const processOrder = (order: Order): ProcessResult => {
  if (!validateOrder(order)) {
    return {
      success: false,
      order,
      error: `Order ${order.id}: Invalid order data`,
    };
  }

  try {
    // Insert order into store
    // Idempotency is handled at request level, so we don't check for duplicates here
    OrderStore.bulkInsert([order]);
    
    // Broadcast order created event for SSE
    broadcastOrderCreated(order);
    
    return {
      success: true,
      order,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      order,
      error: `Order ${order.id}: ${errorMessage}`,
    };
  }
};

/**
 * Pure function: Processes a batch of orders using functional composition
 */
export const processBatch = async (
  batch: readonly Order[],
  batchIndex: number
): Promise<BatchResult> => {
  const results = batch.map(processOrder);

  const processed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const errors = results
    .filter((r) => !r.success && r.error)
    .map((r) => r.error!)
    .filter(Boolean);

  return {
    batchIndex,
    processed,
    failed,
    ...(errors.length > 0 && { errors }),
  };
};

/**
 * Higher-order function: Sequential batch processor
 */
const processBatchesSequentially = async (
  batches: readonly Order[][]
): Promise<readonly BatchResult[]> => {
  const results: BatchResult[] = [];
  
  for (const [index, batch] of batches.entries()) {
    const result = await processBatch(batch, index);
    results.push(result);
  }
  
  return results;
};

/**
 * Main function: Process orders in batches with validation
 */
export const processOrdersBatch = async (
  orders: readonly Order[],
  batchSize?: number
): Promise<BatchProcessResult> => {
  const validation = validateBatchSize(batchSize);
  
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid batch size');
  }

  const batches = splitIntoBatches(orders, validation.batchSize);
  const batchResults = await processBatchesSequentially(batches);
  const { totalProcessed, totalFailed } = aggregateBatchResults(batchResults);

  return {
    totalProcessed,
    totalFailed,
    batchResults,
  };
};

/**
 * Get order by ID with caching
 * Returns order and cache metadata for HTTP headers
 */
export const getOrderById = (id: string): { 
  order: Order | null; 
  cacheHit: boolean; 
  cacheAge?: number;
} => {
  // Check cache first
  const cachedOrder = OrderCacheStore.get(id);
  if (cachedOrder) {
    const cacheAge = OrderCacheStore.getAge(id);
    return {
      order: cachedOrder,
      cacheHit: true,
      cacheAge: cacheAge ?? undefined,
    };
  }

  // Cache miss - get from store
  const order = OrderStore.getById(id);
  if (order) {
    // Cache the order for future requests
    OrderCacheStore.set(id, order);
  }

  return {
    order: order || null,
    cacheHit: false,
  };
};

/**
 * Update order status with cache invalidation
 */
export const updateOrderStatus = (
  id: string,
  status: Order['status']
): Order | null => {
  const updated = OrderStore.updateStatus(id, status);
  
  if (updated) {
    // Invalidate old cache and cache the updated order
    OrderCacheStore.invalidate(id);
    OrderCacheStore.set(id, updated);
    
    // Broadcast order status changed event for SSE
    broadcastOrderStatusChanged(updated);
  }
  
  return updated;
};

/**
 * Cache orders after batch processing
 */
export const cacheOrdersAfterBatch = (orders: readonly Order[]): void => {
  orders.forEach((order) => {
    const cachedOrder = OrderStore.getById(order.id);
    if (cachedOrder) {
      OrderCacheStore.set(order.id, cachedOrder);
    }
  });
};

