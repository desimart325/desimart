import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Category, Product } from '../lib/types';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';

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

export default function Home() {
  const { data: cats } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data: featured } = useQuery<{ products: Product[] }>({
    queryKey: ['featured'],
    queryFn: () => api.get('/products?featured=1&limit=12').then((r) => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0d0d0d] border-b border-[#2a2a2a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#f5c51820,_transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-[#f5c518] text-sm font-bold tracking-widest uppercase mb-4">All Your Indian Grocery Needs</p>
            <h1 style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0.03em' }} className="text-6xl md:text-8xl text-white leading-none mb-3">
              <span className="text-[#f5c518]">DESI</span> MART
            </h1>
            <p className="text-gray-300 text-xl font-semibold mb-6">Fresh. Authentic. Delivered.</p>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              1,300+ Indian grocery essentials — from aromatic spices to fresh produce, all in one place.
            </p>
            <div className="flex gap-3">
              <Link to="/products" className="bg-[#f5c518] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#ffd740] transition-colors flex items-center gap-2">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link to="/products?category=spices-masalas" className="border border-[#2a2a2a] text-white font-bold px-8 py-3 rounded-xl hover:border-[#f5c518] transition-colors">
                Browse Spices
              </Link>
            </div>
          </div>
          <div className="text-[160px] select-none opacity-20 hidden md:block">🛒</div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[#2a2a2a] bg-[#111]">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-3 gap-4">
          {[
            { icon: <Truck size={20} />, label: 'Free Delivery', sub: 'Within 5 miles of store' },
            { icon: <Shield size={20} />, label: '100% Authentic', sub: 'Quality guaranteed' },
            { icon: <Zap size={20} />, label: 'Fresh Stock', sub: 'Restocked daily' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <div className="text-[#f5c518]">{f.icon}</div>
              <div>
                <p className="text-white text-sm font-semibold">{f.label}</p>
                <p className="text-gray-500 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Shop by Category</h2>
          <Link to="/products" className="text-[#f5c518] text-sm hover:underline flex items-center gap-1">
            All products <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {cats?.map((cat) => (
            <Link key={cat.slug} to={`/products?category=${cat.slug}`}
              className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#f5c518]/50 hover:bg-[#1a1a1a] transition-all group">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {CATEGORY_EMOJI[cat.slug] || '🛒'}
              </span>
              <span className="text-xs text-gray-400 text-center leading-tight group-hover:text-white transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Featured Products</h2>
          <Link to="/products" className="text-[#f5c518] text-sm hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featured?.products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
