/**
 * Stream Service
 * 
 * Manages Server-Sent Events (SSE) for real-time order updates.
 * Uses an event emitter pattern to broadcast order changes to connected clients.
 */

import { FastifyReply } from 'fastify';
import { Order } from '../types/order';

type OrderUpdateEvent = {
  type: 'order.created' | 'order.updated' | 'order.status_changed';
  order: Order;
  timestamp: number;
};

type StreamCallback = (event: OrderUpdateEvent) => void;

// Store active stream connections
const streamCallbacks = new Set<StreamCallback>();

/**
 * Subscribe to order update events
 */
export const subscribeToOrderUpdates = (callback: StreamCallback): () => void => {
  streamCallbacks.add(callback);
  
  // Return unsubscribe function
  return () => {
    streamCallbacks.delete(callback);
  };
};

/**
 * Broadcast order update to all connected clients
 */
export const broadcastOrderUpdate = (event: OrderUpdateEvent): void => {
  streamCallbacks.forEach((callback) => {
    try {
      callback(event);
    } catch (error) {
      // Remove callback if it throws (connection closed)
      streamCallbacks.delete(callback);
    }
  });
};

/**
 * Get number of active connections
 */
export const getActiveConnections = (): number => {
  return streamCallbacks.size;
};

/**
 * Clear all subscribers (for testing purposes)
 */
export const clearAllSubscribers = (): void => {
  streamCallbacks.clear();
};

/**
 * Broadcast order created event
 */
export const broadcastOrderCreated = (order: Order): void => {
  broadcastOrderUpdate({
    type: 'order.created',
    order,
    timestamp: Date.now(),
  });
};

/**
 * Broadcast order updated event
 */
export const broadcastOrderUpdated = (order: Order): void => {
  broadcastOrderUpdate({
    type: 'order.updated',
    order,
    timestamp: Date.now(),
  });
};

/**
 * Broadcast order status changed event
 */
export const broadcastOrderStatusChanged = (order: Order): void => {
  broadcastOrderUpdate({
    type: 'order.status_changed',
    order,
    timestamp: Date.now(),
  });
};

/**
 * Set SSE headers on response
 * Required for Server-Sent Events to work properly
 */
export const setSSEHeaders = (reply: FastifyReply): void => {
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
};

