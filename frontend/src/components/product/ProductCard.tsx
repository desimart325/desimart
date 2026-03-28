import { ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Product } from '../../lib/types';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

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

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);
  const [brandLogoFailed, setBrandLogoFailed] = useState(false);

  const emoji = CATEGORY_EMOJI[product.category_slug] || '🛒';
  const brandLogo = getBrandLogo(product.name);
  const showImg = product.image_url && !imgFailed;
  const showBrandLogo = brandLogo && !brandLogoFailed;

  // Variants (sizes)
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 1;
  const inStock = product.stock > 0 || variants.some(v => v.stock > 0);

  const priceMin = product.price_min ?? product.price;
  const priceDisplay = `$${priceMin.toFixed(2)}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    await addItem(product.id);
  };

  const displayName = product.display_name || product.name;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#f5c518]/50 transition-all duration-200 hover:shadow-lg hover:shadow-[#f5c518]/5 flex flex-col"
    >
      {/* Image — fixed square */}
      <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center text-5xl group-hover:bg-[#1e1e1e] transition-colors relative overflow-hidden">
        {showImg ? (
          <>
            <img
              src={product.image_url!}
              alt={displayName}
              className="w-full h-full object-contain p-1.5"
              onError={() => setImgFailed(true)}
            />
            {showBrandLogo && (
              <img src={brandLogo!} alt="" className="absolute bottom-1 right-1 h-6 w-6 object-contain opacity-75"
                onError={() => setBrandLogoFailed(true)} />
            )}
          </>
        ) : showBrandLogo ? (
          <img src={brandLogo!} alt={displayName} className="w-3/4 h-3/4 object-contain"
            onError={() => setBrandLogoFailed(true)} />
        ) : (
          <span>{emoji}</span>
        )}

        {/* Badges */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs text-gray-400 border border-gray-600 rounded px-2 py-0.5">Out of Stock</span>
          </div>
        )}
        {product.is_featured === 1 && inStock && (
          <span className="absolute top-1.5 left-1.5 bg-[#f5c518] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            Featured
          </span>
        )}
        {hasVariants && (
          <span className="absolute top-1.5 right-1.5 bg-[#222] text-gray-400 text-[10px] px-1.5 py-0.5 rounded-full leading-none border border-[#333]">
            {variants.length} sizes
          </span>
        )}
      </div>

      {/* Info — fixed height so all cards are uniform */}
      <div className="p-2.5 flex flex-col justify-between" style={{ height: '82px' }}>
        <p className="text-[12px] font-semibold text-white leading-tight line-clamp-2">{displayName}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[#f5c518] font-bold text-sm leading-none">{priceDisplay}</span>
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="bg-[#f5c518] text-black p-1.5 rounded-lg hover:bg-[#ffd740] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
}
