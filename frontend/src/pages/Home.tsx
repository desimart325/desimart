import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { Category, Product } from '../lib/types';
import ProductCard from '../components/product/ProductCard';
import { ArrowRight, Zap, Shield, Truck } from 'lucide-react';

const CATEGORY_IMG: Record<string, string> = {
  'fresh-produce':       '/categories/fresh-produce.jpg',
  'spices-masalas':      '/categories/spices-masalas.jpg',
  'lentils-dal':         '/categories/lentils-dal.png',
  'rice-grains':         '/categories/rice-grains.jpg',
  'flour-atta':          '/categories/flour-atta.jpg',
  'snacks-namkeen':      '/categories/snacks-namkeen.jpg',
  'pickles-chutneys':    '/categories/pickles-chutneys.jpg',
  'oils-ghee':           '/categories/oils-ghee.jpg',
  'tea-coffee':          '/categories/tea-coffee.jpg',
  'beverages':           '/categories/beverages.jpg',
  'sweets-mithai':       '/categories/sweets-mithai.jpg',
  'frozen-foods':        '/categories/frozen-foods.jpg',
  'hot-foods':           '/categories/hot-foods.jpg',
  'dairy':               '/categories/dairy.jpg',
  'instant-mixes':       '/categories/instant-mixes.jpg',
  'ready-to-eat':        '/categories/ready-to-eat.jpg',
  'biscuits-cookies':    '/categories/biscuits-cookies.jpg',
  'noodles-vermicelli':  '/categories/noodles-vermicelli.jpg',
  'breads-rotis':        '/categories/breads-rotis.jpg',
  'nuts-seeds':          '/categories/nuts-seeds.jpg',
  'paste-concentrate':   '/categories/paste-concentrate.jpg',
  'digestive-refreshers':'/categories/digestive-refreshers.jpg',
};
const CATEGORY_EMOJI: Record<string, string> = {
  'baking': '🧁', 'chocolates': '🍫', 'salt-sugar': '🧂',
  'personal-care': '🧴', 'misc': '🛒',
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
            { icon: <Truck size={20} />, label: 'Free Delivery', sub: 'Orders $25+ within 5 miles' },
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
          {cats?.map((cat) => {
            const img = CATEGORY_IMG[cat.slug];
            const emoji = CATEGORY_EMOJI[cat.slug] || '🛒';
            return (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`}
                className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col items-center hover:border-[#f5c518]/50 transition-all group">
                <div className="w-full aspect-square overflow-hidden bg-[#1a1a1a]">
                  {img
                    ? <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{emoji}</div>
                  }
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight group-hover:text-white transition-colors px-2 py-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
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
