import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      await fetchCart();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
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
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-8 space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Register</h2>
          {error && <p className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">First Name</label>
              <input value={form.firstName} onChange={set('firstName')} required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Last Name</label>
              <input value={form.lastName} onChange={set('lastName')} required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f5c518]" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#f5c518] text-black font-bold py-3 rounded-xl hover:bg-[#ffd740] transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[#f5c518] hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
