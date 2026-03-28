import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, open, closeCart, updateItem, removeItem, total } = useCartStore();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#111] border-l border-[#2a2a2a] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white">Your Cart ({items.length})</h2>
          <button onClick={closeCart} className="text-gray-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>Your cart is empty</p>
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="flex gap-3 bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
              <div className="w-14 h-14 bg-[#222] rounded-lg flex items-center justify-center shrink-0 text-2xl">
                🛒
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.unit}</p>
                <p className="text-[#f5c518] font-bold mt-1">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
                <div className="flex items-center gap-2 bg-[#222] rounded-lg px-2 py-1">
                  <button onClick={() => updateItem(item.id, item.quantity - 1)} className="text-gray-400 hover:text-white">
                    <Minus size={12} />
                  </button>
                  <span className="text-white text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="text-gray-400 hover:text-white disabled:opacity-30">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#2a2a2a] space-y-3">
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Total</span>
              <span className="text-[#f5c518]">${total().toFixed(2)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full bg-[#f5c518] text-black font-bold text-center py-3 rounded-xl hover:bg-[#ffd740] transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
