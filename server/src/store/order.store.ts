import { Order } from "../types/order";

const orders = new Map<string, Order>();

export const OrderStore = {
  bulkInsert(newOrders: Order[]) {
    newOrders.forEach((o) => orders.set(o.id, o));
  },

  getById(id: string) {
    return orders.get(id);
  },

  updateStatus(id: string, status: Order["status"]) {
    const order = orders.get(id);
    if (!order) return null;

    const updated = {
      ...order,
      status,
      updatedAt: Date.now(),
    };

    orders.set(id, updated);
    return updated;
  },

  getAll() {
    return Array.from(orders.values());
  },

  clear() {
    orders.clear();
  },
};
