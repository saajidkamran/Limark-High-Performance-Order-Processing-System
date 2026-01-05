
import React, { memo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useOrderStore } from '../store/store';
import { mockApi } from '../services/api';

const ChartContainer = memo(({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <h3 className="text-sm font-bold mb-6 flex items-center text-slate-500 uppercase tracking-widest">
      <span className="mr-2 grayscale">{icon}</span> {title}
    </h3>
    <div className="h-[300px]">
      {children}
    </div>
  </div>
));

export const Analytics: React.FC = () => {
  const systemMemory = useOrderStore(s => s.systemMemory);
  const throughputHistory = useOrderStore(s => s.throughputHistory);
  const latencyHistory = useOrderStore(s => s.latencyHistory);
  const bottlenecks = useOrderStore(s => s.bottlenecks);
  const isStressTesting = useOrderStore(s => s.isStressTesting);
  const setStressTesting = useOrderStore(s => s.setStressTesting);
  const addBottleneck = useOrderStore(s => s.addBottleneck);

  const handleToggleStressTest = async () => {
    const newState = !isStressTesting;
    setStressTesting(newState);
    await mockApi.toggleStressTest(newState);
    
    if (newState) {
       addBottleneck({
         id: Date.now().toString(),
         type: 'THROUGHPUT',
         message: 'Critical Load: Stress test initiated. System load at 10x capacity.',
         timestamp: Date.now(),
         severity: 'critical'
       });
    }
  };

  if (!LineChart || !ResponsiveContainer) {
    return <div className="p-8 text-rose-500 font-bold">Chart Engine Failure</div>;
  }

  return (
    <div className="p-8 space-y-8 flex-1 overflow-auto bg-slate-50/50 animate-in fade-in duration-300">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">System Analytics</h1>
          <p className="text-slate-500">Global node performance and resource telemetry.</p>
        </div>
        <button 
          onClick={handleToggleStressTest}
          className={`px-6 py-3 rounded-xl font-bold transition-all shadow-xl ${
            isStressTesting 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isStressTesting ? 'DEACTIVATE STRESS LOAD' : 'ACTIVATE STRESS LOAD'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Memory Utilization (MB)" icon="🧠">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={systemMemory}>
              <defs>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" hide />
              <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="heapUsed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMemory)" strokeWidth={3} name="JS Heap" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Network Throughput (RPS)" icon="🚀">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={throughputHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="rps" stroke="#10b981" strokeWidth={4} dot={false} name="Req/Sec" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Global Latency (ms)" icon="⏱️">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Line type="step" dataKey="latency" stroke="#f59e0b" strokeWidth={3} dot={false} name="Latency" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold mb-6 flex items-center text-slate-500 uppercase tracking-widest">
            <span className="mr-2">⚠️</span> Anomaly Detection Log
          </h3>
          <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
            {bottlenecks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No critical incidents logged.</div>
            ) : (
              bottlenecks.map((log) => (
                <div key={log.id} className={`p-4 rounded-xl border flex items-start space-x-4 transition-all hover:scale-[1.01] ${
                  log.severity === 'critical' ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'
                }`}>
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.severity === 'critical' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`}></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-[10px] uppercase tracking-tighter text-slate-500">{log.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
