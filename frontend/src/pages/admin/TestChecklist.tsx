import { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const SECTIONS = [
  {
    title: 'Account & Auth',
    items: [
      'Register a new customer account with a valid email and 8+ char password',
      'Log in with the new account — JWT token is stored, user name appears in nav',
      'Log out — cart badge clears, redirected away from protected pages',
      'Try registering with the same email — should get "already registered" error',
      'Try logging in with wrong password — should get generic error (no info leak)',
      'Log in as ADMIN — admin dashboard icon appears in navbar',
    ],
  },
  {
    title: 'Product Browsing',
    items: [
      'Home page loads — hero, featured products, category tiles all visible',
      '"Browse Spices" and "Shop Now" buttons navigate correctly',
      'Category tiles on home page navigate to filtered product list',
      'Products page shows grouped cards (variants show "X sizes" badge)',
      'Search bar gives live suggestions as you type (no Enter required)',
      'Search filters the product list automatically',
      'Clicking a suggestion navigates to the product detail page',
      'Product detail page shows size selector — clicking a size updates price and image',
      'Out-of-stock variants are grayed out with "sold out" badge',
      'Pagination: Prev/Next and ellipsis work correctly across pages',
    ],
  },
  {
    title: 'Cart',
    items: [
      'Add a product to cart — badge increments on cart icon',
      'Add same product again — quantity increments (no duplicate row)',
      'Add a product with a specific size/variant — correct SKU added',
      'Open cart drawer — shows item names, quantities, and subtotal',
      'Remove an item from cart — updates total',
      'Cart persists after page refresh (Zustand persistence)',
    ],
  },
  {
    title: 'Checkout — Address & Delivery',
    items: [
      'Checkout redirects to /login if not authenticated',
      'Empty cart redirects away from checkout',
      'Address form requires all fields before payment appears',
      'Fill address within 5 miles of store — delivery shows "Free"',
      'Fill address outside 5 miles — delivery shows $4.99',
      'Address in another state — delivery shows $4.99 (fallback)',
      'Order total in summary matches subtotal + delivery fee',
    ],
  },
  {
    title: 'Checkout — Stripe (Credit Card)',
    items: [
      'Credit Card tab is active (Stripe keys configured)',
      'Test card helper shows (collapsed by default, expandable)',
      'Enter card 4242 4242 4242 4242 — payment succeeds, order confirmed',
      'Enter card 4000 0000 0000 9995 — payment declined, error shown',
      'Enter card 4000 0025 0000 3155 — 3D Secure prompt appears',
      'After success: order number shown, cart cleared',
      'Admin orders page shows the new order with payment_status = paid',
    ],
  },
  {
    title: 'Checkout — Zelle',
    items: [
      'Zelle tab shows desimart325@gmail.com as send-to address',
      'Amount shown matches grand total (subtotal + delivery)',
      'Place order — order created with payment_method=zelle, status=pending',
      'Admin orders page shows order as payment pending',
      'Admin clicks "Mark as Paid" in order drawer — status updates to paid',
    ],
  },
  {
    title: 'Checkout — Cash on Pickup',
    items: [
      'Cash tab shows pickup instructions',
      'Place order — order created with payment_method=cash, status=pending',
      'Admin can update order status to CONFIRMED, DELIVERED, etc.',
    ],
  },
  {
    title: 'Admin Panel',
    items: [
      'Dashboard stats show correct totals (orders, revenue, products, users)',
      'Orders list shows all orders with payment method and status badges',
      'Filter orders by status (e.g. PENDING only)',
      'Filter orders by payment status (e.g. pending only)',
      'Click any order row — drawer opens with customer, address, items, total',
      'Change order status via buttons in drawer — updates immediately',
      'Mark Zelle/cash order as paid — payment_status badge updates',
      'Products list loads all 1,300+ products',
      'Inventory list shows stock levels sorted by lowest first',
      'Update inventory quantity — persists after page refresh',
    ],
  },
  {
    title: 'Security',
    items: [
      'Accessing /admin without ADMIN role shows 403 or redirects',
      'Accessing /account/orders without login redirects to /login',
      'API rate limit: hitting /api/auth/login 21 times returns 429',
      'CORS: direct browser fetch to backend from different origin is blocked',
      'Stripe test card data is NOT visible in production build',
    ],
  },
];

export default function TestChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked(c => ({ ...c, [key]: !c[key] }));

  const total = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const done  = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Test Checklist</h1>
        <div className="text-sm text-gray-400">
          <span className="text-[#f5c518] font-bold text-lg">{done}</span>
          <span className="text-gray-600">/{total} completed</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1a1a1a] rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-[#f5c518] rounded-full transition-all duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {SECTIONS.map(section => {
          const sectionDone = section.items.filter((_, i) => checked[`${section.title}-${i}`]).length;
          return (
            <div key={section.title} className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
                <h2 className="font-bold text-white">{section.title}</h2>
                <span className="text-xs text-gray-500">{sectionDone}/{section.items.length}</span>
              </div>
              <div className="divide-y divide-[#1a1a1a]">
                {section.items.map((item, i) => {
                  const key = `${section.title}-${i}`;
                  const isChecked = !!checked[key];
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(key)}
                      className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-[#1a1a1a] transition-colors"
                    >
                      {isChecked
                        ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                        : <Circle size={16} className="text-gray-600 shrink-0 mt-0.5" />
                      }
                      <span className={`text-sm ${isChecked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {done === total && (
        <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-2xl px-6 py-4 text-center">
          <p className="text-green-400 font-bold text-lg">All tests passed!</p>
          <p className="text-gray-500 text-sm mt-1">The site is ready for production deployment.</p>
        </div>
      )}
    </div>
  );
}
