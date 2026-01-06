import { buildApp } from '../app';
import { recordRequest, resetMetrics } from '../utils/metrics';

describe('System Routes Tests', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetMetrics();
  });

  describe('GET /api/system/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/system/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeGreaterThan(0);
    });
  });

  describe('GET /api/system/memory', () => {
    it('should return memory usage', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/system/memory',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.rss).toBeGreaterThan(0);
      expect(body.heapTotal).toBeGreaterThan(0);
      expect(body.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('GET /api/system/performance', () => {
    it('should return performance metrics with zero requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/system/performance',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body).toHaveProperty('latencyMs');
      expect(body).toHaveProperty('systemHealth');
      expect(body).toHaveProperty('requestsPerSecond');
      expect(body).toHaveProperty('requestCount');
      expect(body).toHaveProperty('avgResponseTimeMs');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('memoryUsage');
      expect(body).toHaveProperty('timestamp');
      
      expect(body.requestCount).toBe(0);
      expect(body.latencyMs).toBe(0);
      expect(body.avgResponseTimeMs).toBe(0);
      expect(body.systemHealth).toBe(100);
    });

    it('should return performance metrics after recording requests', async () => {
      // Record some test requests
      recordRequest(50);
      recordRequest(100);
      recordRequest(75);

      const response = await app.inject({
        method: 'GET',
        url: '/api/system/performance',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.requestCount).toBe(3);
      expect(body.avgResponseTimeMs).toBe(75); // (50 + 100 + 75) / 3 = 75
      expect(body.latencyMs).toBe(75);
      expect(body.memoryUsage).toHaveProperty('heapUsed');
      expect(body.memoryUsage).toHaveProperty('heapTotal');
      expect(body.memoryUsage).toHaveProperty('rss');
    });
  });
});

