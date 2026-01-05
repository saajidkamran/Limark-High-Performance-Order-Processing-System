/**
 * Simple configuration - Only batch size from environment
 */

/**
 * Get batch size from environment variable or default to 100
 */
export const getBatchSize = (): number => {
  const value = process.env.BATCH_SIZE;
  if (!value) return 100;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed < 1 ? 100 : parsed;
};
