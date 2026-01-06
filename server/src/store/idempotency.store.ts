interface IdempotencyEntry {
  response: unknown;
  statusCode: number;
  timestamp: number;
  expiresAt: number;
}

// In-memory store for idempotency keys
// In production, this should be Redis or a database
const idempotencyStore = new Map<string, IdempotencyEntry>();

// Default TTL: 24 hours (in milliseconds)
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cleanup expired entries periodically
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (entry.expiresAt < now) {
      idempotencyStore.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

export const IdempotencyStore = {
  /**
   * Get cached response for an idempotency key
   */
  get(key: string): IdempotencyEntry | null {
    const entry = idempotencyStore.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      idempotencyStore.delete(key);
      return null;
    }

    return entry;
  },

  /**
   * Store response for an idempotency key
   */
  set(
    key: string,
    response: unknown,
    statusCode: number,
    ttlMs: number = DEFAULT_TTL_MS
  ): void {
    const now = Date.now();
    idempotencyStore.set(key, {
      response,
      statusCode,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  },

  /**
   * Delete an idempotency key (for testing/cleanup)
   */
  delete(key: string): boolean {
    return idempotencyStore.delete(key);
  },

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    idempotencyStore.clear();
  },

  /**
   * Get store size (for monitoring)
   */
  size(): number {
    return idempotencyStore.size;
  },
};
