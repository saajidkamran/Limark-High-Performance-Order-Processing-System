
import React, { useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './src/components/Layout';
import { Dashboard } from './src/pages/Dashboard';
import { Analytics } from './src/pages/Analytics';
import { OrderDetail } from './src/pages/OrderDetail';
import { useOrderStore } from './src/store/store';
import { mockApi } from './src/services/api';
import { OrderStatus } from './src/types';

const App: React.FC = () => {
  const { isStressTesting, updateSystemMetrics, orders, addBottleneck } = useOrderStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateMetrics = async () => {
      if (document.hidden) return;

      const memory = await mockApi.getMemoryUsage();
      let perf = await mockApi.getPerformance();
      
      if (isStressTesting) {
        perf = {
          latencyMs: perf.latencyMs * (1.5 + Math.random()),
          requestsPerSecond: perf.requestsPerSecond * 2.2,
          systemHealth: Math.max(70, perf.systemHealth - (Math.random() * 20))
        };
        
        if (perf.latencyMs > 250) {
           addBottleneck({
             id: Date.now().toString(),
             type: 'LATENCY',
             message: `CRITICAL: Latency spike detected: ${perf.latencyMs.toFixed(0)}ms`,
             timestamp: Date.now(),
             severity: 'warning'
           });
        }
      }

      updateSystemMetrics(memory, perf);

      // Status randomization simulation
      if (orders.length > 0) {
        const updateCount = isStressTesting ? 50 : 2;
        requestAnimationFrame(() => {
          // Note: In a real app, this logic would happen in the Zustand store 
          // or via a batching utility. We keep it light here for the simulation.
          const statuses = Object.values(OrderStatus);
          for (let i = 0; i < updateCount; i++) {
            const randomIndex = Math.floor(Math.random() * orders.length);
            const target = orders[randomIndex];
            const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
            // We call the store update; Zustand will batch these calls in the same tick 
            // if triggered within a single task/rAF.
            useOrderStore.getState().updateOrderStatus(target.id, nextStatus);
          }
        });
      }
    };

    const interval = isStressTesting ? 300 : 1500;
    timerRef.current = setInterval(updateMetrics, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStressTesting, orders.length, updateSystemMetrics, addBottleneck]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
