import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import type { Order } from '../lib/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400', CONFIRMED: 'text-blue-400', PROCESSING: 'text-purple-400',
  SHIPPED: 'text-indigo-400', DELIVERED: 'text-green-400', CANCELLED: 'text-red-400',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Loading...</div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Order not found</div>;

  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/account/orders" className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">{order.order_number}</h1>
          <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`font-bold text-lg ${STATUS_COLORS[order.status]}`}>{order.status}</span>
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 mb-4">
        <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Items</h2>
        <div className="space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-300">{item.product_name} <span className="text-gray-600">×{item.quantity}</span></span>
              <span className="text-white">${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[#2a2a2a] mt-3 pt-3 flex justify-between font-bold">
          <span className="text-white">Total</span>
          <span className="text-[#f5c518]">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4">
        <h2 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Delivery Address</h2>
        <div className="text-gray-300 text-sm space-y-1">
          <p>{addr.street}</p>
          <p>{addr.city}, {addr.state} {addr.zipCode}</p>
          {addr.phone && <p>📞 {addr.phone}</p>}
        </div>
      </div>
    </div>
  );
}
