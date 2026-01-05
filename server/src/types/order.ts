export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type Order = {
  id: string;
  status: OrderStatus;
  amount: number;
  createdAt: number;
  updatedAt: number;
};
