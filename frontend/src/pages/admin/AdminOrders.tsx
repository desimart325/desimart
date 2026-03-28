import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronDown } from 'lucide-react';
import api from '../../lib/api';

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];
const PAYMENT_STATUSES = ['pending','paid','failed','refunded'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PAY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  paid: 'bg-green-500/10 text-green-400',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-gray-500/10 text-gray-400',
};

const PAY_METHOD_ICONS: Record<string, string> = {
  stripe: '💳', paypal: '🅿️', zelle: '💲', cash: '💵',
};

function OrderDrawer({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery<any>({
    queryKey: ['admin-order', orderId],
    queryFn: () => api.get(`/admin/orders/${orderId}`).then(r => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/admin/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order', orderId] });
    },
  });

  const updatePayStatus = useMutation({
    mutationFn: (payment_status: string) =>
      api.put(`/admin/orders/${orderId}/payment-status`, { payment_status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order', orderId] });
    },
  });

  const addr = (() => {
    try { return order?.shipping_address ? JSON.parse(order.shipping_address) : null; }
    catch { return null; }
  })();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0f0f0f] border-l border-[#2a2a2a] h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#0f0f0f] z-10">
          <h2 className="text-white font-bold">{order?.order_number || 'Loading...'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="p-6 text-gray-500 text-sm">Loading...</div>
        ) : order ? (
          <div className="p-5 space-y-5">
            <section>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Customer</p>
              <p className="text-white font-medium">{order.first_name} {order.last_name}</p>
              <p className="text-gray-400 text-sm">{order.email}</p>
              {order.customer_phone && <p className="text-gray-400 text-sm">{order.customer_phone}</p>}
            </section>

            {addr && (
              <section>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
                <div className="text-sm text-gray-300 leading-relaxed">
                  <p>{addr.street}</p>
                  <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                  {addr.phone && <p>{addr.phone}</p>}
                </div>
              </section>
            )}

            <section>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Payment</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-white">
                  {PAY_METHOD_ICONS[order.payment_method] || '💰'} {order.payment_method?.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAY_STATUS_COLORS[order.payment_status] || ''}`}>
                  {order.payment_status}
                </span>
                {order.payment_id && (
                  <span className="text-xs text-gray-600 font-mono truncate max-w-[160px]" title={order.payment_id}>
                    {order.payment_id}
                  </span>
                )}
              </div>
              {(order.payment_method === 'zelle' || order.payment_method === 'cash') &&
                order.payment_status === 'pending' && (
                <button
                  onClick={() => updatePayStatus.mutate('paid')}
                  className="mt-2 text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
                >
                  Mark as Paid
                </button>
              )}
            </section>

            <section>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.product_name}
                      <span className="text-gray-600 ml-1">x{item.quantity}</span>
                    </span>
                    <span className="text-white font-medium">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a2a2a] mt-3 pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-[#f5c518]">${order.total_amount?.toFixed(2)}</span>
              </div>
            </section>

            <section>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Order Status</p>
              <div className="grid grid-cols-2 gap-2">
                {ORDER_STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus.mutate(s)}
                    className={`text-xs py-2 px-3 rounded-lg border font-semibold transition-all ${
                      order.status === s
                        ? STATUS_COLORS[s]
                        : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500 hover:border-[#444]'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <p className="text-xs text-gray-600">Placed {new Date(order.created_at).toLocaleString()}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: orders } = useQuery<any[]>({
    queryKey: ['admin-orders', statusFilter, payFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (payFilter) params.set('payment_status', payFilter);
      return api.get(`/admin/orders?${params}`).then(r => r.data);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div>
      {selectedId !== null && (
        <OrderDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Orders</h1>
        <div className="flex gap-2">
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#f5c518]">
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={payFilter} onChange={e => setPayFilter(e.target.value)}
              className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#f5c518]">
              <option value="">All Payments</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['Order #','Customer','Items','Amount','Payment','Status','Date',''].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders?.map(o => (
                <tr key={o.id} onClick={() => setSelectedId(o.id)}
                  className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-white font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-white">{o.first_name} {o.last_name}</p>
                    <p className="text-gray-500 text-xs">{o.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{o.summary}</td>
                  <td className="px-4 py-3 text-[#f5c518] font-bold">${o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-300 mb-1">{PAY_METHOD_ICONS[o.payment_method]} {o.payment_method}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PAY_STATUS_COLORS[o.payment_status] || ''}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <select value={o.status}
                      onChange={e => updateStatus.mutate({ id: o.id, status: e.target.value })}
                      className="bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#f5c518]">
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">View</td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-600">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
