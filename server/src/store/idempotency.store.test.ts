import { IdempotencyStore } from './idempotency.store';

describe('IdempotencyStore  Tests', () => {
  beforeEach(() => {
    IdempotencyStore.clear();
  });

  it('should store and retrieve a response successfully', () => {
    const key = 'test-key-123';
    const response = { success: true, data: 'test' };
    const statusCode = 201;

    IdempotencyStore.set(key, response, statusCode);
    const cached = IdempotencyStore.get(key);

    expect(cached).not.toBeNull();
    expect(cached?.response).toEqual(response);
    expect(cached?.statusCode).toBe(statusCode);
  });

  it('should return null for expired entries', () => {
    const key = 'expired-key';
    const expiredTTL = -1000; // Negative TTL = already expired
    
    IdempotencyStore.set(key, { data: 'test' }, 200, expiredTTL);
    const cached = IdempotencyStore.get(key);

    expect(cached).toBeNull();
  });

  it('should return null for non-existent key', () => {
    const cached = IdempotencyStore.get('non-existent-key');
    expect(cached).toBeNull();
  });
});

