import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { ToggleLeft, ToggleRight, Star } from 'lucide-react';

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data: products } = useQuery<any[]>({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/admin/products').then((r) => r.data),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/admin/products/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const toggle = (p: any, field: 'is_active' | 'is_featured') =>
    update.mutate({ ...p, [field]: p[field] ? 0 : 1, id: p.id });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Products</h1>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['SKU', 'Name', 'Category', 'Price', 'Stock', 'Active', 'Featured'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors ${!p.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-white max-w-xs">
                    <p className="truncate">{p.name}</p>
                    <p className="text-gray-600 text-xs">{p.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.category_slug}</td>
                  <td className="px-4 py-3 text-[#f5c518] font-bold">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-xs ${(p.stock ?? 0) === 0 ? 'text-red-400' : (p.stock ?? 0) < 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(p, 'is_active')} className={p.is_active ? 'text-green-400' : 'text-gray-600'}>
                      {p.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(p, 'is_featured')} className={p.is_featured ? 'text-[#f5c518]' : 'text-gray-600'}>
                      <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
