import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import type { Category, Product } from '../lib/types';
import ProductCard from '../components/product/ProductCard';

// Smart pagination: shows window around current page + first/last
function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;

  const getPages = () => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const nums: (number | '…')[] = [];
    const addRange = (start: number, end: number) => {
      for (let i = start; i <= end; i++) nums.push(i);
    };
    nums.push(1);
    if (page > 4) nums.push('…');
    addRange(Math.max(2, page - 2), Math.min(pages - 1, page + 2));
    if (page < pages - 3) nums.push('…');
    nums.push(pages);
    // dedupe
    return nums.filter((v, i, a) => v === '…' ? a[i - 1] !== '…' : true);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#f5c518]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} /> Prev
      </button>

      {getPages().map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="w-9 text-center text-gray-600 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
              p === page
                ? 'bg-[#f5c518] text-black'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#f5c518]/50'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === pages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#f5c518]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next <ChevronRight size={15} />
      </button>

      <span className="text-xs text-gray-600 ml-2">Page {page} of {pages}</span>
    </div>
  );
}

export default function Products() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const urlSearch = params.get('search') || '';

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local search input with URL param changes (e.g. coming from Navbar)
  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [category, urlSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (val.trim()) next.set('search', val.trim());
      else next.delete('search');
      next.delete('category');
      setParams(next, { replace: true });
    }, 320);
  };

  const clearSearch = () => {
    setLocalSearch('');
    const next = new URLSearchParams(params);
    next.delete('search');
    setParams(next, { replace: true });
  };

  const { data: cats } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data, isLoading } = useQuery<{ products: Product[]; total: number; pages: number }>({
    queryKey: ['products', category, urlSearch, page],
    queryFn: () => api.get(`/products?category=${category}&search=${urlSearch}&page=${page}&limit=24`).then((r) => r.data),
  });

  const handlePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-24">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-0.5">
              <Link to="/products"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-[#f5c518] text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
                All Products
              </Link>
              {cats?.map((c) => (
                <Link key={c.slug} to={`/products?category=${c.slug}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${category === c.slug ? 'bg-[#f5c518] text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Header + inline search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">
                {urlSearch ? `Results for "${urlSearch}"` : category ? cats?.find((c) => c.slug === category)?.name : 'All Products'}
              </h1>
              {data && <p className="text-gray-500 text-sm mt-0.5">{data.total.toLocaleString()} products</p>}
            </div>
            {/* Inline search within the products page */}
            <div className="relative w-full sm:w-64">
              <input
                value={localSearch}
                onChange={handleSearchChange}
                placeholder="Filter products…"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c518] transition-colors"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              {localSearch && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Mobile category strip */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 md:hidden scrollbar-hide">
            <Link to="/products" className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!category ? 'bg-[#f5c518] text-black' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'}`}>All</Link>
            {cats?.map((c) => (
              <Link key={c.slug} to={`/products?category=${c.slug}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${category === c.slug ? 'bg-[#f5c518] text-black' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'}`}>
                {c.name}
              </Link>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-[#2a2a2a] rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : data?.products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-white font-bold text-lg">No products found</p>
              <p className="text-gray-500 text-sm mt-1">Try a different search or category</p>
              <Link to="/products" className="mt-4 inline-block text-[#f5c518] text-sm hover:underline">Clear filters</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data?.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination page={page} pages={data?.pages ?? 1} onPage={handlePage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
