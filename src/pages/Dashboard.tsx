
import React, { useState, memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrderStore } from '../store/store';
import { mockApi } from '../services/api';
import { OrderTable } from '../components/OrderTable';
import { UploadModal } from '../components/UploadModal';
import { useDebounce } from '../hooks/useDebounce';
import { Order } from '../types';

const StatCard = memo(({ label, value, subValue, colorClass, highlight }: { 
  label: string, value: string, subValue?: string, colorClass?: string, highlight?: boolean 
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline space-x-1 mt-2">
      <p className={`text-3xl font-bold ${colorClass || 'text-slate-900'}`}>{value}</p>
      {subValue && <span className="text-sm font-normal text-slate-400">{subValue}</span>}
      {highlight && <span className="ml-2 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>}
    </div>
  </div>
));

export const Dashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Granular selectors to prevent unnecessary re-renders
  const allOrders = useOrderStore(s => s.orders);
  const ordersCount = useOrderStore(s => s.orders.length);
  const performance = useOrderStore(s => s.performance);
  const setOrders = useOrderStore(s => s.setOrders);
  const addOrdersBatch = useOrderStore(s => s.addOrdersBatch);

  // Debounce search input for performance (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter orders by customer name (case-insensitive)
  const filteredOrders = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return allOrders;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    return allOrders.filter(order => 
      order.customer.toLowerCase().includes(searchLower)
    );
  }, [allOrders, debouncedSearchTerm]);

  const { isLoading } = useQuery({
    queryKey: ['orders-initial'],
    queryFn: async () => {
      const data = await mockApi.getInitialOrders();
      setOrders(data);
      return data;
    },
    
    enabled: ordersCount === 0
  });

  const handleManualBatch = async () => {
    setIsGenerating(true);
    const batch = await mockApi.uploadBatch(1000);
    addOrdersBatch(batch);
    setIsGenerating(false);
  };

  return (
    <div className="p-8 space-y-8 flex-1 overflow-auto animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Order Management</h1>
          <p className="text-slate-500 mt-1">Real-time processing engine for 10,000+ active records.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button 
            onClick={handleManualBatch}
            disabled={isGenerating || isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isGenerating ? 'GEN-NODE-BUSY...' : 'Generate 1k'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Active Orders" value={ordersCount.toLocaleString()} />
        <StatCard label="Avg Latency" value={`${performance.latencyMs.toFixed(0)}ms`} colorClass="text-emerald-600" />
        <StatCard label="Throughput" value={(performance.requestsPerSecond / 1000).toFixed(1)} subValue="k RPS" colorClass="text-blue-600" />
        <StatCard label="Node Health" value={`${performance.systemHealth.toFixed(1)}%`} highlight />
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              aria-label="Search orders by customer name"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-sm text-slate-600 whitespace-nowrap">
              <span className="font-medium">{filteredOrders.length}</span> of <span className="font-medium">{ordersCount}</span> orders
            </div>
          )}
        </div>
      </div>

      <OrderTable orders={filteredOrders} />

      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpload={addOrdersBatch} />
    </div>
  );
};
