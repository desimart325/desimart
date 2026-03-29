import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { CheckCircle, CreditCard, Banknote, Loader2, MapPin } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PayConfig {
  stripe: boolean;
  paypal: boolean;
  cash: boolean;
  zelle: boolean;
  stripePublishableKey: string;
  paypalClientId: string;
  zelleContact: string;
}
interface AddressForm {
  street: string; city: string; state: string; zipCode: string; phone: string;
}
interface DeliveryInfo {
  withinRadius: boolean;
  distance: number | null;
  deliveryFee: number;
  geocoded: boolean;
}
type PayMethod = 'card' | 'paypal' | 'cash' | 'zelle';

// ── Dev-only test card helper ─────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV;
const TEST_CARDS = [
  { label: 'Success',         number: '4242 4242 4242 4242', note: 'Any future date · any CVC' },
  { label: 'Auth required',   number: '4000 0025 0000 3155', note: 'Will prompt 3D Secure' },
  { label: 'Decline',         number: '4000 0000 0000 9995', note: 'Insufficient funds' },
];

function TestCardHelper() {
  const [open, setOpen] = useState(false);
  if (!IS_DEV) return null;
  return (
    <div className="mb-4 border border-yellow-500/30 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-yellow-500/10 text-yellow-400 text-xs font-semibold">
        <span>Test Mode — Stripe Test Cards</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 bg-[#111]">
          {TEST_CARDS.map(c => (
            <div key={c.number} className="flex items-start justify-between gap-4 text-xs">
              <div>
                <span className="text-white font-mono tracking-widest">{c.number}</span>
                <span className="text-gray-500 ml-2">{c.note}</span>
              </div>
              <span className={`shrink-0 font-semibold ${c.label === 'Success' ? 'text-green-400' : c.label === 'Decline' ? 'text-red-400' : 'text-blue-400'}`}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stripe card element styles ────────────────────────────────────────────────
const CARD_STYLE = {
  style: {
    base: {
      color: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px',
      '::placeholder': { color: '#6b7280' }, iconColor: '#f5c518',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

// ── Stripe inner form (must be inside <Elements>) ─────────────────────────────
function StripeForm({ address, total, onSuccess }: {
  address: AddressForm; total: number; onSuccess: (n: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(''); setLoading(true);
    try {
      const { data: intentData } = await api.post('/payments/stripe/intent');
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        { payment_method: { card: elements.getElement(CardElement)! } }
      );
      if (stripeError) { setError(stripeError.message || 'Card declined'); return; }
      const { data: order } = await api.post('/orders', {
        shippingAddress: address,
        payment_method: 'stripe',
        payment_id: paymentIntent!.id,
      });
      onSuccess(order.order_number);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
        <CardElement options={CARD_STYLE} />
      </div>
      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full bg-[#f5c518] text-black font-bold py-3.5 rounded-xl hover:bg-[#ffd740] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>
          <CreditCard size={18} /> Pay ${total.toFixed(2)}
        </>}
      </button>
    </form>
  );
}

// ── PayPal section ────────────────────────────────────────────────────────────
function PayPalSection({ address, onSuccess }: {
  address: AddressForm; onSuccess: (n: string) => void;
}) {
  const [error, setError] = useState('');
  return (
    <div className="space-y-3">
      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        createOrder={async () => {
          const { data } = await api.post('/payments/paypal/create-order');
          return data.id;
        }}
        onApprove={async (data) => {
          try {
            await api.post(`/payments/paypal/capture/${data.orderID}`);
            const { data: order } = await api.post('/orders', {
              shippingAddress: address,
              payment_method: 'paypal',
              payment_id: data.orderID,
            });
            onSuccess(order.order_number);
          } catch (err: any) {
            setError(err.response?.data?.error || 'PayPal order failed');
          }
        }}
        onError={() => setError('PayPal encountered an error. Please try another payment method.')}
      />
    </div>
  );
}

// ── Zelle section ─────────────────────────────────────────────────────────────
function ZelleSection({ address, total, zelleContact, onSuccess }: {
  address: AddressForm; total: number; zelleContact: string; onSuccess: (n: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddress: address,
        payment_method: 'zelle',
        payment_id: null,
      });
      onSuccess(data.order_number);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handlePlace} className="space-y-3">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💲</span>
          <span className="text-white font-semibold text-sm">Pay via Zelle</span>
        </div>
        <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>Open your bank app and send <span className="text-[#f5c518] font-bold">${total.toFixed(2)}</span> via Zelle</li>
          <li>
            Send to:{' '}
            {zelleContact
              ? <span className="text-white font-semibold">{zelleContact}</span>
              : <span className="text-gray-600 italic">Zelle contact not configured yet</span>
            }
          </li>
          <li>In the memo, write your order number (shown after placing)</li>
          <li>We'll confirm your payment and prepare your order</li>
        </ol>
        <p className="text-xs text-yellow-500/80 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
          Your order will be held for 2 hours. If payment is not received, the order will be cancelled.
        </p>
      </div>
      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-[#f5c518] text-black font-bold py-3.5 rounded-xl hover:bg-[#ffd740] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 size={18} className="animate-spin" />Placing order…</> : <>Place Order · ${total.toFixed(2)}</>}
      </button>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [address, setAddress] = useState<AddressForm>(
    { street: '', city: '', state: '', zipCode: '', phone: '' }
  );
  const [payMethod, setPayMethod] = useState<PayMethod>('card');
  const [payConfig, setPayConfig] = useState<PayConfig | null>(null);
  const [stripePromise] = useState(() =>
    api.get('/payments/config').then(r => {
      setPayConfig(r.data);
      return r.data.stripePublishableKey ? loadStripe(r.data.stripePublishableKey) : null;
    }).catch(() => null)
  );
  const [cashLoading, setCashLoading] = useState(false);
  const [cashError, setCashError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  // Delivery fee state
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const deliveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.get('/payments/config').then(r => {
      setPayConfig(r.data);
      if (!r.data.stripe && r.data.paypal) setPayMethod('paypal');
      if (!r.data.stripe && !r.data.paypal) setPayMethod('zelle');
    }).catch(() => setPayConfig({ stripe: false, paypal: false, cash: true, zelle: true, stripePublishableKey: '', paypalClientId: '', zelleContact: '' }));
  }, []);

  // Check delivery radius whenever address is fully filled
  const addressValid = address.street && address.city && address.state && address.zipCode && address.phone;

  useEffect(() => {
    if (!addressValid) { setDelivery(null); return; }
    if (deliveryTimer.current) clearTimeout(deliveryTimer.current);
    deliveryTimer.current = setTimeout(async () => {
      setDeliveryLoading(true);
      try {
        const { data } = await api.post('/delivery/check', {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        });
        setDelivery(data);
      } catch {
        setDelivery({ withinRadius: false, distance: null, deliveryFee: 4.99, geocoded: false });
      } finally {
        setDeliveryLoading(false);
      }
    }, 600);
    return () => { if (deliveryTimer.current) clearTimeout(deliveryTimer.current); };
  }, [address.street, address.city, address.state, address.zipCode, addressValid]);

  const cartTotal = total();
  const qualifiesForFree = delivery?.withinRadius && cartTotal >= 25;
  const deliveryFee = delivery ? (qualifiesForFree ? 0 : 4.99) : 4.99;
  const grandTotal = cartTotal + deliveryFee;

  const onSuccess = (orderNumber: string) => { setSuccess(orderNumber); clearCart(); };

  const handleCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setCashError(''); setCashLoading(true);
    try {
      const { data } = await api.post('/orders', { shippingAddress: address, payment_method: 'cash' });
      onSuccess(data.order_number);
    } catch (err: any) {
      setCashError(err.response?.data?.error || 'Failed to place order');
    } finally { setCashLoading(false); }
  };

  if (!user) { navigate('/login'); return null; }

  if (items.length === 0 && !success) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
      <Link to="/products" className="text-[#f5c518] hover:underline">Continue Shopping</Link>
    </div>
  );

  if (success) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <CheckCircle className="mx-auto text-[#f5c518] mb-4" size={64} />
      <h2 className="text-2xl font-black text-white mb-2">Order Placed!</h2>
      <p className="text-gray-400 mb-1">Your order number is:</p>
      <p className="text-[#f5c518] font-bold text-xl mb-6">{success}</p>
      <div className="flex gap-3 justify-center">
        <Link to="/account/orders" className="bg-[#f5c518] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#ffd740]">View Orders</Link>
        <Link to="/products" className="border border-[#2a2a2a] text-white font-bold px-6 py-3 rounded-xl hover:border-[#f5c518]">Keep Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-8">Checkout</h1>
      <div className="grid md:grid-cols-[1fr_360px] gap-8">

        {/* ── Left: address + payment ── */}
        <div className="space-y-6">

          {/* Address */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Delivery Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { k: 'street',  label: 'Street Address', cols: 2 },
                { k: 'city',    label: 'City',           cols: 1 },
                { k: 'state',   label: 'State',          cols: 1 },
                { k: 'zipCode', label: 'ZIP Code',        cols: 1 },
                { k: 'phone',   label: 'Phone',          cols: 1 },
              ] as { k: keyof AddressForm; label: string; cols: number }[]).map(({ k, label, cols }) => (
                <div key={k} className={cols === 2 ? 'col-span-2' : ''}>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    value={address[k]}
                    onChange={(e) => setAddress(a => ({ ...a, [k]: e.target.value }))}
                    required
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Delivery radius indicator */}
            {addressValid && (
              <div className="mt-4 flex items-center gap-2 text-xs">
                <MapPin size={13} className="shrink-0" />
                {deliveryLoading ? (
                  <span className="text-gray-500 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Checking delivery range…</span>
                ) : delivery?.geocoded ? (
                  delivery.withinRadius ? (
                    <span className={qualifiesForFree ? 'text-green-400' : 'text-yellow-400'}>
                      Within {delivery.distance} mi of store —{' '}
                      {qualifiesForFree
                        ? <strong>free delivery!</strong>
                        : <span>add ${(25 - cartTotal).toFixed(2)} more for free delivery</span>
                      }
                    </span>
                  ) : (
                    <span className="text-gray-400">{delivery.distance} mi from store — $4.99 delivery fee</span>
                  )
                ) : delivery ? (
                  <span className="text-gray-500">Could not verify distance — standard $4.99 fee applied</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Payment method selector */}
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4">Payment Method</h2>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {([
                { id: 'card',   label: 'Credit Card',    icon: '💳', enabled: payConfig?.stripe },
                { id: 'paypal', label: 'PayPal',         icon: '🅿️', enabled: payConfig?.paypal },
                { id: 'zelle',  label: 'Zelle',          icon: '💲', enabled: true },
                { id: 'cash',   label: 'Cash on Pickup', icon: '💵', enabled: true },
              ] as { id: PayMethod; label: string; icon: string; enabled?: boolean }[]).map(({ id, label, icon, enabled }) => (
                <button
                  key={id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => setPayMethod(id)}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all
                    ${payMethod === id && enabled
                      ? 'bg-[#f5c518]/10 border-[#f5c518] text-[#f5c518]'
                      : enabled
                        ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#444]'
                        : 'bg-[#111] border-[#1e1e1e] text-gray-700 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                  {!enabled && <span className="text-[9px] text-gray-600">Coming soon</span>}
                </button>
              ))}
            </div>

            {/* Payment forms */}
            {!addressValid && (
              <p className="text-xs text-gray-500 text-center py-2">Fill in your delivery details above to proceed.</p>
            )}

            {addressValid && payMethod === 'card' && (
              payConfig?.stripe ? (
                <Elements stripe={stripePromise}>
                  <TestCardHelper />
                  <StripeForm address={address} total={grandTotal} onSuccess={onSuccess} />
                </Elements>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">Stripe keys not configured yet.</p>
              )
            )}

            {addressValid && payMethod === 'paypal' && (
              payConfig?.paypal ? (
                <PayPalScriptProvider options={{ clientId: payConfig.paypalClientId, currency: 'USD' }}>
                  <PayPalSection address={address} onSuccess={onSuccess} />
                </PayPalScriptProvider>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">PayPal keys not configured yet.</p>
              )
            )}

            {addressValid && payMethod === 'zelle' && (
              <ZelleSection
                address={address}
                total={grandTotal}
                zelleContact={payConfig?.zelleContact || ''}
                onSuccess={onSuccess}
              />
            )}

            {addressValid && payMethod === 'cash' && (
              <form onSubmit={handleCash} className="space-y-3">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-sm text-gray-400">
                  <Banknote size={16} className="inline mr-2 text-[#f5c518]" />
                  Pay in cash when you pick up your order at the store.
                </div>
                {cashError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{cashError}</p>}
                <button type="submit" disabled={cashLoading}
                  className="w-full bg-[#f5c518] text-black font-bold py-3.5 rounded-xl hover:bg-[#ffd740] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {cashLoading ? <><Loader2 size={18} className="animate-spin" />Placing order…</> : <>Place Order · ${grandTotal.toFixed(2)}</>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Right: order summary ── */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 sticky top-24">
            <h2 className="text-base font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-300 leading-tight">
                    {item.name}
                    <span className="text-gray-600 ml-1">×{item.quantity}</span>
                  </span>
                  <span className="text-white font-medium shrink-0 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#2a2a2a] mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 items-center">
                <span>Delivery</span>
                {deliveryLoading ? (
                  <Loader2 size={12} className="animate-spin text-gray-600" />
                ) : (
                  <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                    {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
                  </span>
                )}
              </div>
              {delivery?.geocoded && delivery.withinRadius && !qualifiesForFree && (
                <p className="text-xs text-yellow-400/70 text-right">Add ${(25 - cartTotal).toFixed(2)} more for free delivery</p>
              )}
              {delivery?.geocoded && !delivery.withinRadius && (
                <p className="text-xs text-gray-600 text-right">{delivery.distance} mi from store</p>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-[#2a2a2a]">
                <span className="text-white">Total</span>
                <span className="text-[#f5c518]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
