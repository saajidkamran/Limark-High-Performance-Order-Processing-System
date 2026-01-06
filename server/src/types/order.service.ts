import { Order } from './order';


export type BatchProcessResult = {
  readonly totalProcessed: number;
  readonly totalFailed: number;
  readonly batchResults: readonly BatchResult[];
};

export type BatchResult = {
  readonly batchIndex: number;
  readonly processed: number;
  readonly failed: number;
  readonly errors?: readonly string[];
};

export type ProcessResult = {
  readonly success: boolean;
  readonly order: Order;
  readonly error?: string;
};

export type Progress = {
  readonly processed: number;
  readonly total: number;
  readonly percentage: number;
};

export type BatchSizeValidation = {
  readonly valid: boolean;
  readonly error?: string;
  readonly batchSize: number;
};

