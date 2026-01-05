
import React, { memo } from 'react';
import * as ReactWindow from 'react-window';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import { useOrderStore } from '../store/store';
import { mockApi } from '../services/api';

const { FixedSizeList: List } = (ReactWindow as any).default || ReactWindow;

const StatusBadge = memo(({ status }: { status: OrderStatus }) => {
  const colors = {
    [OrderStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200',
    [OrderStatus.PROCESSED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [OrderStatus.SHIPPED]: 'bg-blue-100 text-blue-700 border-blue-200',
    [OrderStatus.DELIVERED]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [OrderStatus.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${colors[status]}`}>
      {status}
    </span>
  );
});

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    orders: Order[];
    updateStatus: (id: string, status: OrderStatus) => void;
    navigate: NavigateFunction;
  };
}

const Row = memo(({ index, style, data }: RowProps) => {
  const { orders, updateStatus, navigate } = data;
  const order = orders[index];
  if (!order) return null;

  const handleAction = async (e: React.MouseEvent, status: OrderStatus) => {
    e.stopPropagation();
    await mockApi.updateStatus(order.id, status);
    updateStatus(order.id, status);
  };

  return (
    <div 
      style={style} 
      className={`flex items-center px-6 border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div className="w-32 font-mono text-xs font-medium text-slate-400 group-hover:text-blue-500 transition-colors">{order.id}</div>
      <div className="flex-1 font-semibold text-slate-700 truncate pr-4">{order.customer}</div>
      <div className="w-24 text-right pr-8 text-sm text-slate-500">{order.items} <span className="text-[10px] text-slate-300">items</span></div>
      <div className="w-28 text-right font-bold pr-8 text-slate-900">${order.total.toFixed(2)}</div>
      <div className="w-32 text-center"><StatusBadge status={order.status} /></div>
      <div className="w-40 flex justify-end space-x-1.5">
        <button 
          onClick={(e) => handleAction(e, OrderStatus.PROCESSED)}
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        </button>
        <button 
          onClick={(e) => handleAction(e, OrderStatus.REJECTED)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
  // Custom comparison: Only re-render if the specific order data changes
  return prev.data.orders[prev.index] === next.data.orders[next.index] && prev.style === next.style;
});

interface OrderTableProps {
  orders?: Order[]; // Optional prop for filtered orders
}

export const OrderTable: React.FC<OrderTableProps> = memo(({ orders: propOrders }) => {
  const storeOrders = useOrderStore((state) => state.orders);
  const orders = propOrders ?? storeOrders; // Use prop if provided, otherwise use store
  const updateStatus = useOrderStore((state) => state.updateOrderStatus);
  const navigate = useNavigate();

  const itemData = React.useMemo(() => ({
    orders,
    updateStatus,
    navigate
  }), [orders, updateStatus, navigate]);

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="flex items-center px-6 py-4 bg-slate-50/50 border-b border-slate-200 font-bold text-[10px] uppercase tracking-[0.15em] text-slate-400">
        <div className="w-32">Reference</div>
        <div className="flex-1">Customer Details</div>
        <div className="w-24 text-right pr-8">Quantity</div>
        <div className="w-28 text-right pr-8">Total</div>
        <div className="w-32 text-center">Status</div>
        <div className="w-40 text-right">Actions</div>
      </div>
      <div className="flex-1">
        {List && orders.length > 0 ? (
          <List
            height={600}
            itemCount={orders.length}
            itemSize={60}
            width="100%"
            itemData={itemData}
            overscanCount={5}
          >
            {Row}
          </List>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <p className="text-sm font-medium">No orders found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
