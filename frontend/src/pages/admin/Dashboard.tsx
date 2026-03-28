import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400', CONFIRMED: 'text-blue-400', PROCESSING: 'text-purple-400',
  SHIPPED: 'text-indigo-400', DELIVERED: 'text-green-400', CANCELLED: 'text-red-400',
};

export default function AdminDashboard() {
  const { data } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const stats = [
    { label: 'Total Orders', value: data?.totalOrders ?? '—', icon: <ShoppingBag size={20} />, color: 'text-blue-400' },
    { label: 'Revenue', value: data ? `$${data.totalRevenue.toFixed(0)}` : '—', icon: <TrendingUp size={20} />, color: 'text-[#f5c518]' },
    { label: 'Products', value: data?.totalProducts ?? '—', icon: <Package size={20} />, color: 'text-green-400' },
    { label: 'Customers', value: data?.totalUsers ?? '—', icon: <Users size={20} />, color: 'text-purple-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-gray-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Recent Orders</h2>
          <Link to="/admin/orders" className="text-[#f5c518] text-sm hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {data?.recentOrders?.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#1a1a1a]">
              <div>
                <p className="text-white text-sm font-medium">{o.order_number}</p>
                <p className="text-gray-500 text-xs">{o.first_name} {o.last_name} · {o.email}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f5c518] font-bold text-sm">${o.total_amount.toFixed(2)}</p>
                <span className={`text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
