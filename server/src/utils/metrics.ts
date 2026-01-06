let requestCount = 0;
let totalResponseTime = 0;

export function recordRequest(durationMs: number) {
  requestCount++;
  totalResponseTime += durationMs;
}

export function getMetrics() {
  const mem = process.memoryUsage();
  
  return {
    latencyMs: requestCount === 0 ? 0 : Math.round(totalResponseTime / requestCount),
    systemHealth: 100, // Simple - can enhance later
    requestsPerSecond: 0, // Can calculate from requestCount / uptime if needed
    requestCount,
    avgResponseTimeMs: requestCount === 0 ? 0 : Math.round(totalResponseTime / requestCount),
    uptime: process.uptime(),
    memoryUsage: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024), 
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024), 
      rss: Math.round(mem.rss / 1024 / 1024), 
    },
    timestamp: Date.now(),
  };
}

export function resetMetrics() {
  requestCount = 0;
  totalResponseTime = 0;
}

