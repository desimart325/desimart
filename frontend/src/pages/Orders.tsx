import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Order } from '../lib/types';
import { Package } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  CONFIRMED: 'text-blue-400 bg-blue-400/10',
  PROCESSING: 'text-purple-400 bg-purple-400/10',
  SHIPPED: 'text-indigo-400 bg-indigo-400/10',
  DELIVERED: 'text-green-400 bg-green-400/10',
  CANCELLED: 'text-red-400 bg-red-400/10',
};

export default function Orders() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then((r) => r.data),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[#111] border border-[#2a2a2a] rounded-2xl animate-pulse" />)}
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="mb-4">No orders yet</p>
          <Link to="/products" className="text-[#f5c518] hover:underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`}
              className="block bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 hover:border-[#f5c518]/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white">{order.order_number}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {order.summary && <p className="text-xs text-gray-400 mt-2 line-clamp-1">{order.summary}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#f5c518]">${order.total_amount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${STATUS_COLORS[order.status] ?? 'text-gray-400 bg-gray-400/10'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
