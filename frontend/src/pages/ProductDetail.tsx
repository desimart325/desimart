import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import api from '../lib/api';
import type { Product, ProductVariant } from '../lib/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';

const BRAND_LOGOS: Record<string, string> = {
  'deep':  '/brands/deep.png',
  'laxmi': '/brands/laxmi.png',
};
function getBrandLogo(name: string) {
  const lower = name.toLowerCase();
  for (const [b, logo] of Object.entries(BRAND_LOGOS)) {
    if (lower.startsWith(b + ' ') || lower.startsWith(b + '-')) return logo;
  }
  return null;
}

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

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data),
  });

  // When product loads, set selected variant to the current slug's variant
  useEffect(() => {
    if (!product) return;
    const current = product.variants?.find(v => v.slug === slug) ?? null;
    setSelectedVariant(current);
    setQty(1);
    setImgFailed(false);
  }, [product, slug]);

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-12 text-gray-500">Loading...</div>;
  if (!product) return <div className="max-w-4xl mx-auto px-4 py-12 text-gray-500">Product not found</div>;

  const variants = product.variants ?? [];
  const hasVariants = variants.length > 1;

  // Active display values come from the selected variant (or the product itself if none)
  const activePrice  = selectedVariant?.price  ?? product.price;
  const activeStock  = selectedVariant?.stock  ?? product.stock;
  const activeSlug   = selectedVariant?.slug   ?? product.slug;
  const activeImage  = selectedVariant?.image_url ?? product.image_url;

  const brandLogo = getBrandLogo(product.name);
  const emoji = CATEGORY_EMOJI[product.category_slug] || '🛒';
  const showImg = activeImage && !imgFailed;
  const displayName = product.display_name || product.name;

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    setQty(1);
    setImgFailed(false);
    // Update URL without full navigation (keeps query cache warm)
    navigate(`/products/${v.slug}`, { replace: true });
  };

  const handleAdd = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    const targetId = selectedVariant?.id ?? product.id;
    await addItem(targetId, qty);
    setAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/products" className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl flex items-center justify-center overflow-hidden relative">
          {showImg ? (
            <img
              src={activeImage!}
              alt={displayName}
              className="w-full h-full object-contain p-4"
              onError={() => setImgFailed(true)}
            />
          ) : brandLogo ? (
            <img src={brandLogo} alt={displayName} className="w-2/3 h-2/3 object-contain" />
          ) : (
            <span className="text-8xl">{emoji}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Link to={`/products?category=${product.category_slug}`}
            className="text-[#f5c518] text-sm font-medium mb-2 hover:underline w-fit">
            {product.category_name}
          </Link>

          <h1 className="text-2xl font-black text-white mb-4 leading-tight">{displayName}</h1>

          {/* Size / Variant selector */}
          {hasVariants && (
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isActive = (selectedVariant?.id ?? product.id) === v.id;
                  const outOfStock = v.stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      disabled={outOfStock}
                      className={`
                        relative px-4 py-2 rounded-lg text-sm font-semibold border transition-all
                        ${isActive
                          ? 'bg-[#f5c518] text-black border-[#f5c518]'
                          : outOfStock
                            ? 'bg-[#111] text-gray-600 border-[#2a2a2a] cursor-not-allowed'
                            : 'bg-[#1a1a1a] text-white border-[#2a2a2a] hover:border-[#f5c518]/60'
                        }
                      `}
                    >
                      <span>{v.size_label ?? v.name ?? 'Standard'}</span>
                      <span className={`ml-1.5 text-xs font-bold ${isActive ? 'text-black/70' : 'text-[#f5c518]'}`}>
                        ${v.price.toFixed(2)}
                      </span>
                      {outOfStock && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#333] text-gray-500 text-[9px] px-1 rounded leading-none py-0.5">
                          sold out
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price */}
          <div className="text-4xl font-black text-[#f5c518] mb-3">${activePrice.toFixed(2)}</div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            <Package size={14} className={activeStock > 0 ? 'text-green-400' : 'text-red-400'} />
            <span className={`text-sm ${activeStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {activeStock > 0 ? `${activeStock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Qty + Add to cart */}
          {activeStock > 0 && (
            <div className="flex gap-3">
              <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-400 hover:text-white font-bold text-lg leading-none">−</button>
                <span className="text-white font-bold w-6 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(activeStock, qty + 1))} className="text-gray-400 hover:text-white font-bold text-lg leading-none">+</button>
              </div>
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 bg-[#f5c518] text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#ffd740] transition-colors disabled:opacity-50">
                <ShoppingCart size={18} />
                {adding ? 'Adding…' : 'Add to Cart'}
              </button>
            </div>
          )}

          {!hasVariants && product.unit && product.unit !== 'unit' && (
            <p className="text-xs text-gray-600 mt-4">{product.unit}</p>
          )}
        </div>
      </div>
    </div>
  );
}
