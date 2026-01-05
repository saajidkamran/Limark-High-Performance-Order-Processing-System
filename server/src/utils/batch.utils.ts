import { BatchResult, Progress } from '../types/order.service';

/**
 * Pure function: Splits an array into batches of specified size
 * Generic utility function - can be used with any type
 */
export const splitIntoBatches = <T>(items: readonly T[], batchSize: number): readonly T[][] => {
  return Array.from({ length: Math.ceil(items.length / batchSize) }, (_, i) =>
    items.slice(i * batchSize, (i + 1) * batchSize)
  );
};

/**
 * Pure function: Reduces batch results to final totals
 */
export const aggregateBatchResults = (
  batchResults: readonly BatchResult[]
): { readonly totalProcessed: number; readonly totalFailed: number } => {
  return batchResults.reduce(
    (acc, result) => ({
      totalProcessed: acc.totalProcessed + result.processed,
      totalFailed: acc.totalFailed + result.failed,
    }),
    { totalProcessed: 0, totalFailed: 0 }
  );
};

/**
 * Pure function: Calculate progress percentage
 */
export const calculateProgress = (
  processedBatches: number,
  totalOrders: number,
  batchSize: number
): Progress => {
  const processed = Math.min(processedBatches * batchSize, totalOrders);
  const percentage = Math.min((processed / totalOrders) * 100, 100);

  return {
    processed,
    total: totalOrders,
    percentage,
  };
};

