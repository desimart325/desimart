import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/api';

export default function AdminInventory() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Record<number, number>>({});

  const { data: items } = useQuery<any[]>({
    queryKey: ['admin-inventory'],
    queryFn: () => api.get('/admin/inventory').then((r) => r.data),
  });

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api.put(`/admin/inventory/${id}`, { quantity }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      setEditing((e) => { const n = { ...e }; delete n[id]; return n; });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Inventory</h1>
      <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                {['SKU', 'Product', 'Category', 'Stock', 'Action'].map((h) => (
                  <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items?.map((item) => (
                <tr key={item.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3 text-white max-w-xs truncate">{item.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{item.category_slug}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${(item.quantity ?? 0) === 0 ? 'text-red-400' : (item.quantity ?? 0) < 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {item.quantity ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editing[item.id] ?? item.quantity ?? 0}
                        onChange={(e) => setEditing((p) => ({ ...p, [item.id]: parseInt(e.target.value) || 0 }))}
                        className="w-20 bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#f5c518]"
                      />
                      <button
                        onClick={() => update.mutate({ id: item.id, quantity: editing[item.id] ?? item.quantity ?? 0 })}
                        className="bg-[#f5c518] text-black text-xs font-bold px-3 py-1 rounded-lg hover:bg-[#ffd740] transition-colors"
                      >
                        Save
                      </button>
                    </div>
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
