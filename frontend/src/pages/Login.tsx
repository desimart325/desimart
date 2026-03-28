import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
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
      </div>
    </div>
  );
}
