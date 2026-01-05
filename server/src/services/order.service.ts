import { Order } from '../types/order';
import {
  BatchProcessResult,
  BatchResult,
  ProcessResult,
  Progress,
} from '../types/order.service';
import { OrderStore } from '../store/order.store';
import { validateOrder, validateBatchSize } from '../validators/order.validator';
import { splitIntoBatches, aggregateBatchResults, calculateProgress } from '../utils/batch.utils';

/**
 * Pure function: Processes a single order and returns result
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
    OrderStore.bulkInsert([order]);
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

