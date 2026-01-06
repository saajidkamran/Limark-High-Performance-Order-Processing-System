import { Order } from "../types/order";
import { BatchSizeValidation } from "../types/order.service";
import { getBatchSize } from "../config";

// Constants
const VALID_STATUSES: readonly Order["status"][] = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;
const MIN_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1000;

// Validates an order structure
export const validateOrder = (order: Order): boolean => {
  const hasValidId = Boolean(order.id && typeof order.id === "string");
  const hasValidStatus = VALID_STATUSES.includes(order.status);
  const hasValidAmount = typeof order.amount === "number" && order.amount >= 0;
  const hasValidCreatedAt =
    typeof order.createdAt === "number" && order.createdAt > 0;
  const hasValidUpdatedAt =
    typeof order.updatedAt === "number" && order.updatedAt > 0;

  return (
    hasValidId &&
    hasValidStatus &&
    hasValidAmount &&
    hasValidCreatedAt &&
    hasValidUpdatedAt
  );
};
// Validates batch size
export const validateBatchSize = (
  batchSize: number | undefined
): BatchSizeValidation => {
  const defaultBatchSize = getBatchSize();
  const sizeToUse = batchSize ?? defaultBatchSize;

  if (isNaN(sizeToUse)) {
    return {
      valid: false,
      error: `Batch size must be a number`,
      batchSize: defaultBatchSize,
    };
  }

  if (sizeToUse < MIN_BATCH_SIZE) {
    return {
      valid: false,
      error: `Batch size must be at least ${MIN_BATCH_SIZE}`,
      batchSize: defaultBatchSize,
    };
  }

  if (sizeToUse > MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: `Batch size cannot exceed ${MAX_BATCH_SIZE}`,
      batchSize: defaultBatchSize,
    };
  }

  return {
    valid: true,
    batchSize: sizeToUse,
  };
};
