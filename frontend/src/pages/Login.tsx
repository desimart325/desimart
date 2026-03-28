import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showGuest, setShowGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      await fetchCart();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) { setGuestError('Please enter your name'); return; }
    setGuestError(''); setGuestLoading(true);
    try {
      await loginAsGuest(guestName.trim(), guestPhone.trim());
      navigate('/');
    } catch (err: any) {
      setGuestError(err.response?.data?.error || 'Could not continue as guest');
    } finally { setGuestLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/logo.png" alt="Desi Mart" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#f5c518]/40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontFamily: "'Anton', sans-serif", letterSpacing: '0.02em' }} className="text-4xl">
              <span className="text-[#f5c518]">DESI </span>
              <span className="text-white">MART</span>
            </span>
          </div>
          <p className="text-gray-500 mt-2">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Sign In</h2>

          {error && <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</p>}

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#f5c518] text-black font-bold py-3 rounded-xl hover:bg-[#ffd740] transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#f5c518] hover:underline">Register</Link>
          </p>
        </form>

        {/* Guest login */}
        <div className="mt-4">
          {!showGuest ? (
            <button
              onClick={() => setShowGuest(true)}
              className="w-full py-3 rounded-xl border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#3a3a3a] text-sm font-medium transition-colors bg-[#111]"
            >
              Continue as Guest
            </button>
          ) : (
            <form onSubmit={handleGuest} className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Guest Checkout</h3>
                <button type="button" onClick={() => setShowGuest(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
              </div>
              <p className="text-gray-500 text-xs">Shop without creating an account. Order history won't be saved.</p>

              {guestError && <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{guestError}</p>}

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Your Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. John Smith"
                  required
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518] transition-colors"
                />
              </div>

              <button type="submit" disabled={guestLoading}
                className="w-full bg-[#2a2a2a] text-white font-bold py-3 rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50 border border-[#3a3a3a]">
                {guestLoading ? 'Please wait...' : 'Continue as Guest →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
