/**
 * Order Cache Store
 * 
 * Caches order lookups to reduce database/store access.
 * Entries expire after a TTL to ensure data freshness.
 */

import { Order } from '../../types/order';

interface OrderCacheEntry {
  order: Order;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for orders
const orderCache = new Map<string, OrderCacheEntry>();

// Default TTL: 5 minutes (in milliseconds)
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Cleanup expired entries periodically
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of orderCache.entries()) {
    if (entry.expiresAt < now) {
      orderCache.delete(key);
    }
  }
};

// Run cleanup every minute
setInterval(cleanupExpiredEntries, 60 * 1000);

export const OrderCacheStore = {
  /**
   * Get cached order by ID
   */
  get(orderId: string): Order | null {
    const entry = orderCache.get(orderId);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt < Date.now()) {
      orderCache.delete(orderId);
      return null;
    }
    
    return entry.order;
  },

  /**
   * Cache an order
   */
  set(
    orderId: string,
    order: Order,
    ttlMs: number = DEFAULT_TTL_MS
  ): void {
    const now = Date.now();
    orderCache.set(orderId, {
      order,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  },

  /**
   * Invalidate cache for an order (when order is updated)
   */
  invalidate(orderId: string): boolean {
    return orderCache.delete(orderId);
  },

  /**
   * Clear all cached orders
   */
  clear(): void {
    orderCache.clear();
  },

  /**
   * Get cache size (for monitoring)
   */
  size(): number {
    return orderCache.size;
  },

  /**
   * Get cache entry age in seconds (for headers)
   */
  getAge(orderId: string): number | null {
    const entry = orderCache.get(orderId);
    if (!entry) return null;
    
    const ageSeconds = Math.floor((Date.now() - entry.timestamp) / 1000);
    return ageSeconds;
  },
};

