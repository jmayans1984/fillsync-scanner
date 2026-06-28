import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="20" width="6" height="12" rx="2" fill="#FFC220"/>
            <rect x="13" y="12" width="6" height="20" rx="2" fill="#0071CE"/>
            <rect x="22" y="6" width="6" height="26" rx="2" fill="#0A2540" stroke="#FFC220" strokeWidth="1.5"/>
          </svg>
          <div>
            <p className="text-2xl font-black text-white leading-none">FillSync</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#0071CE] font-semibold">Scanner</p>
          </div>
        </div>
        <p className="text-[#64B5F6] text-sm">Profit calculator for Walmart sellers</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#90CAF9] mb-1.5 uppercase tracking-wider">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#0071CE] text-sm"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#90CAF9] mb-1.5 uppercase tracking-wider">Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#0071CE] text-sm"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-[#0071CE] text-white font-black text-base hover:bg-[#005EA8] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
