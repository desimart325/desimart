import { Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Package, Boxes, ShoppingBag, ClipboardCheck } from 'lucide-react';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
  { to: '/admin/inventory', label: 'Inventory', icon: <Boxes size={18} /> },
  { to: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
  { to: '/admin/test', label: 'Test Checklist', icon: <ClipboardCheck size={18} /> },
];

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const loc = useLocation();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'ADMIN') return <Navigate to="/" />;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-52 shrink-0 border-r border-[#2a2a2a] bg-[#0d0d0d] p-4">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-4 px-3">Admin</p>
        <nav className="space-y-1">
          {nav.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-[#f5c518] text-black' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
                {n.icon} {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
