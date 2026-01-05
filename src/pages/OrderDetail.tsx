
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderStatus } from '../types';
import { mockApi } from '../services/api';
import { useOrderStore } from '../store/store';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateStoreStatus = useOrderStore(state => state.updateOrderStatus);

  // Fetch single order metadata via React Query
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => mockApi.getOrderById(id!),
    enabled: !!id,
  });

  // Mutation for status transition
  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => mockApi.updateStatus(id!, status),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(['order', id], updated);
        updateStoreStatus(id!, updated.status);
      }
    },
  });

  const handleStatusChange = (newStatus: OrderStatus) => {
    statusMutation.mutate({ status: newStatus });
  };

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Retrieving Metadata...</p>
      </div>
    </div>
  );

  if (isError || !order) return (
    <div className="flex-1 p-8 bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 text-center max-w-lg">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Resource Undefined</h2>
        <p className="text-slate-500 mt-2">The requested object hash <span className="font-mono text-rose-500">{id}</span> was not found in the global registry.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center space-x-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Entity Inspector</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-500">{order.id}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Node: US-EAST-1</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Metadata Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Subject</p>
                  <p className="text-3xl font-black text-slate-900">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Timestamp</p>
                  <p className="text-slate-600 font-medium">{new Date(order.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-[0.2em] mb-2">IO Latency</p>
                  <p className="text-3xl font-black text-emerald-700">{order.latency}<span className="text-sm font-medium ml-1">ms</span></p>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-[0.2em] mb-2">Quantity</p>
                  <p className="text-3xl font-black text-blue-700">{order.items}<span className="text-sm font-medium ml-1">unt</span></p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Total Value</p>
                  <p className="text-3xl font-black text-slate-900">${order.total.toFixed(0)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">JSON Payload Registry</p>
                <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 leading-relaxed shadow-2xl overflow-x-auto border border-slate-800">
                  <pre>{JSON.stringify({
                    metadata: {
                      id: order.id,
                      origin: "SYSTEM_GEN",
                      security: "Level-1-Clearance"
                    },
                    content: order,
                    history: [
                      { state: "INIT", time: order.timestamp },
                      { state: order.status, time: new Date().toISOString() }
                    ]
                  }, null, 2)}</pre>
                </div>
              </div>
            </div>
            
            <div className="px-10 py-8 bg-slate-900 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Final Settlement</span>
                <span className="text-xs text-slate-400">Validated through distributed consensus</span>
              </div>
              <span className="text-5xl font-black text-white tracking-tighter">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* State Management Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sticky top-8">
            <h3 className="font-bold text-xl mb-8 tracking-tight text-slate-900 flex items-center">
              <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span>
              State Transition
            </h3>
            <div className="space-y-3">
              {Object.values(OrderStatus).map((status) => (
                <button
                  key={status}
                  disabled={statusMutation.isPending}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full py-4 px-6 rounded-2xl text-left font-bold text-sm transition-all flex justify-between items-center group relative overflow-hidden ${
                    order.status === status
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                      : 'bg-slate-50 text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 hover:shadow-md'
                  }`}
                >
                  <span className="relative z-10">{status}</span>
                  {order.status === status ? (
                    <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors"></div>
                  )}
                  {statusMutation.isPending && statusMutation.variables?.status === status && (
                    <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center">
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-10 p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-4">
              <span className="text-xl">🛡️</span>
              <p className="text-[10px] font-bold text-amber-700 leading-normal uppercase tracking-wider">
                Encryption: AES-256. Actions are logged to the immutable audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
