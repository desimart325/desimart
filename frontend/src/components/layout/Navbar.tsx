import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import type { Product } from '../../lib/types';

const CATEGORY_EMOJI: Record<string, string> = {
  'fresh-produce': '🥦', 'spices-masalas': '🌶️', 'lentils-dal': '🫘',
  'rice-grains': '🌾', 'flour-atta': '🫓', 'snacks-namkeen': '🍿',
  'pickles-chutneys': '🫙', 'oils-ghee': '🫒', 'tea-coffee': '☕',
  'beverages': '🥤', 'sweets-mithai': '🍮', 'frozen-foods': '❄️',
  'hot-foods': '🔥', 'dairy': '🥛', 'instant-mixes': '📦',
  'ready-to-eat': '🍱', 'biscuits-cookies': '🍪', 'noodles-vermicelli': '🍜',
  'breads-rotis': '🫓', 'nuts-seeds': '🥜', 'paste-concentrate': '🥫',
  'baking': '🧁', 'chocolates': '🍫', 'salt-sugar': '🧂',
  'digestive-refreshers': '🫖', 'personal-care': '🧴', 'misc': '🛒',
};

const BRAND_LOGOS: Record<string, string> = {
  'deep': '/brands/deep.png',
  'laxmi': '/brands/laxmi.png',
};

function getBrandLogo(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [brand, logo] of Object.entries(BRAND_LOGOS)) {
    if (lower.startsWith(brand + ' ') || lower.startsWith(brand + '-')) return logo;
  }
  return null;
}

function SearchBar({ className }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = (q: string) => {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    api.get(`/products?search=${encodeURIComponent(q)}&limit=7`)
      .then((r) => {
        setSuggestions(r.data.products || []);
        setOpen(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (p: Product) => {
    setQuery('');
    setOpen(false);
    navigate(`/products/${p.slug}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && suggestions.length > 0 && setOpen(true)}
          placeholder="Search products..."
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-4 pr-16 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f5c518] transition-colors"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && (
            <button type="button" onClick={handleClear} className="p-1.5 text-gray-500 hover:text-gray-300">
              <X size={13} />
            </button>
          )}
          <button type="submit" className="p-1.5 text-gray-400 hover:text-[#f5c518]">
            <Search size={15} />
          </button>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#161616] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-xs text-gray-500">Searching…</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-500">No results for "{query}"</div>
          )}
          {!loading && suggestions.map((p) => {
            const brandLogo = getBrandLogo(p.name);
            const emoji = CATEGORY_EMOJI[p.category_slug] || '🛒';
            return (
              <button
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1f1f1f] transition-colors text-left"
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg bg-[#222] flex items-center justify-center shrink-0 overflow-hidden">
                  {brandLogo ? (
                    <img src={brandLogo} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span className="text-lg">{emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-tight truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.category_name}</p>
                </div>
                <span className="text-sm text-[#f5c518] font-bold shrink-0">${p.price.toFixed(2)}</span>
              </button>
            );
          })}
          {!loading && suggestions.length > 0 && (
            <button
              onMouseDown={handleSubmit as any}
              className="w-full px-4 py-2.5 text-xs text-[#f5c518] hover:bg-[#1f1f1f] border-t border-[#2a2a2a] text-left transition-colors"
            >
              See all results for "{query}" →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { count, openCart } = useCartStore();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src="/logo.png"
            alt="Desi Mart"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-[#f5c518]/40"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Link>

        {/* Desktop search */}
        <SearchBar className="flex-1 max-w-xl hidden md:block" />

        <div className="flex items-center gap-2 ml-auto">
          {/* Cart */}
          <button onClick={openCart} className="relative p-2 text-gray-400 hover:text-[#f5c518] transition-colors">
            <ShoppingCart size={22} />
            {count() > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#f5c518] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count()}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-1">
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="p-2 text-gray-400 hover:text-[#f5c518] transition-colors" title="Admin">
                  <LayoutDashboard size={20} />
                </Link>
              )}
              <Link to="/account/orders" className="p-2 text-gray-400 hover:text-[#f5c518] transition-colors" title="Orders">
                <User size={20} />
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="bg-[#f5c518] text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#ffd740] transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </nav>
  );
}
