import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiHeaders, API } from '../supabaseClient';

const fmt  = n => n == null ? '—' : `$${Math.abs(n).toFixed(2)}`;
const pct  = n => n == null ? '—' : `${n.toFixed(1)}%`;
const clr  = n => n == null ? 'text-white/50' : n >= 0 ? 'text-green-400' : 'text-red-400';

function useSettings() {
  const raw = localStorage.getItem('fillsync_scanner_settings');
  return raw ? JSON.parse(raw) : {
    taxPct: 0, transferFee: 0, packingCost: 0, shippingCost: 0, customCosts: [],
  };
}

export default function Product() {
  const { code }    = useParams();
  const navigate    = useNavigate();
  const settings    = useSettings();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Editable inputs
  const [buyBox, setBuyBox]   = useState('');
  const [cogs, setCogs]       = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers = await getApiHeaders();
        const res = await fetch(`${API}/api/lookup/barcode/${encodeURIComponent(code)}`, { headers });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || !data.found) { setError(data.error || 'Product not found'); setLoading(false); return; }
        setProduct(data);
        setBuyBox(data.avg_price > 0 ? String(data.avg_price) : '');
        setCogs(data.cogs != null ? String(data.cogs) : '');
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [code]);

  // Live P&L calculation
  const calc = useCallback(() => {
    if (!product) return null;
    const price   = parseFloat(buyBox) || 0;
    const cogVal  = parseFloat(cogs) || 0;
    const refFee  = price * (product.referral_fee_pct / 100);
    const wfsFee  = product.wfs_fee || 0;
    const tax     = cogVal * (settings.taxPct / 100);
    const transfer = parseFloat(settings.transferFee) || 0;
    const packing  = parseFloat(settings.packingCost) || 0;
    const shipping = parseFloat(settings.shippingCost) || 0;
    const custom   = (settings.customCosts || []).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    const totalCost = refFee + wfsFee + cogVal + tax + transfer + packing + shipping + custom;
    const profit    = price - totalCost;
    const margin    = price > 0 ? (profit / price) * 100 : null;
    const totalInvested = cogVal + tax + transfer + packing + shipping + custom;
    const roi       = totalInvested > 0 ? (profit / totalInvested) * 100 : null;
    return { price, refFee, wfsFee, cogVal, tax, transfer, packing, shipping, custom, totalCost, profit, margin, roi };
  }, [product, buyBox, cogs, settings]);

  const r = calc();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0A2540]">
      <div className="w-8 h-8 border-4 border-[#0071CE] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0A2540] px-6 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-white font-black text-xl mb-2">Not Found</h2>
      <p className="text-white/60 text-sm mb-2">{error}</p>
      <p className="text-white/40 text-xs mb-6 font-mono">{code}</p>
      <p className="text-white/40 text-xs mb-6">Make sure the product catalog is synced in FillSync settings.</p>
      <button onClick={() => navigate('/')}
        className="px-6 py-3 rounded-xl bg-[#0071CE] text-white font-bold text-sm">
        ← Scan another
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col">

      {/* Header */}
      <div className="bg-[#0A2540] px-4 pt-10 pb-5 safe-area-top">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')}
            className="text-white/70 p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-base leading-snug line-clamp-2">{product.product_name || product.sku}</p>
            <p className="text-[#64B5F6] text-xs font-mono mt-0.5">SKU: {product.sku}</p>
          </div>
          <button onClick={() => navigate('/settings')}
            className="text-white/50 p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756 2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        {/* Identifiers */}
        <div className="flex flex-wrap gap-2">
          {product.upc  && <span className="bg-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-white/70">UPC {product.upc}</span>}
          {product.gtin && <span className="bg-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-white/70">GTIN {product.gtin}</span>}
          {product.wpid && <span className="bg-white/10 rounded-full px-2.5 py-1 text-[10px] font-mono text-[#FFC220]">WPID {product.wpid}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Inputs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Price inputs</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">Buy Box Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071CE] font-bold text-sm">$</span>
                <input type="number" step="0.01" min="0" value={buyBox}
                  onChange={e => setBuyBox(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border-2 border-[#E0E0E0] rounded-xl text-sm font-bold text-[#0A2540] focus:border-[#0071CE] focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">COGS</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071CE] font-bold text-sm">$</span>
                <input type="number" step="0.01" min="0" value={cogs}
                  onChange={e => setCogs(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border-2 border-[#E0E0E0] rounded-xl text-sm font-bold text-[#0A2540] focus:border-[#0071CE] focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Result summary */}
        {r && r.price > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${r.profit >= 0 ? 'bg-[#0A2540]' : 'bg-red-900'}`}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Net Profit</p>
                <p className={`text-xl font-black ${r.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(r.profit)}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Margin</p>
                <p className={`text-xl font-black ${r.margin >= 0 ? 'text-[#FFC220]' : 'text-red-400'}`}>{pct(r.margin)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">ROI</p>
                <p className={`text-xl font-black ${(r.roi ?? 0) >= 0 ? 'text-[#64B5F6]' : 'text-red-400'}`}>{pct(r.roi)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        {r && r.price > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
            <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Cost Breakdown</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Referral Fee',  val: r.refFee,   sub: `${product.referral_fee_pct}%`, color: '#FB923C' },
                { label: 'WFS Fee',       val: r.wfsFee,   sub: product.wfs_fee_source,          color: '#8B5CF6' },
                { label: 'COGS',          val: r.cogVal,   sub: null,                            color: '#0071CE' },
                r.tax      > 0 ? { label: `Tax on COGS (${settings.taxPct}%)`, val: r.tax,      color: '#14B8A6' } : null,
                r.transfer > 0 ? { label: 'Transfer Fee',   val: r.transfer,  color: '#64748b' } : null,
                r.packing  > 0 ? { label: 'Packing',        val: r.packing,   color: '#64748b' } : null,
                r.shipping > 0 ? { label: 'Shipping',       val: r.shipping,  color: '#64748b' } : null,
                ...(settings.customCosts || []).filter(c => parseFloat(c.amount) > 0).map(c => ({ label: c.name, val: parseFloat(c.amount), color: '#64748b' })),
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-sm text-[#46474A]">{item.label}</span>
                    {item.sub && <span className="text-[10px] text-[#B0B0B0] font-mono">{item.sub}</span>}
                  </div>
                  <span className="text-sm font-bold font-mono text-[#1A1A1A]">{fmt(item.val)}</span>
                </div>
              ))}
              <div className="border-t border-[#E0E0E0] pt-2.5 flex items-center justify-between">
                <span className="text-sm font-black text-[#0A2540]">Total Cost</span>
                <span className="text-sm font-black font-mono text-red-500">{fmt(r.totalCost)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Walmart fees info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Walmart Fees (auto)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FFF7ED] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[#FB923C] uppercase tracking-wider">Referral Fee</p>
              <p className="text-lg font-black text-[#0A2540] mt-0.5">{fmt(product.referral_fee)}</p>
              <p className="text-[10px] text-[#B0B0B0] font-mono">{product.referral_fee_pct}%</p>
            </div>
            <div className="bg-[#F3F0FF] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">WFS Fee</p>
              <p className="text-lg font-black text-[#0A2540] mt-0.5">{fmt(product.wfs_fee)}</p>
              <p className="text-[10px] text-[#B0B0B0] font-mono">{product.wfs_fee_source}</p>
            </div>
          </div>
          <p className="text-[10px] text-[#B0B0B0] mt-2 text-center">Avg sale price: {fmt(product.avg_price)}</p>
        </div>

        <button onClick={() => navigate('/')}
          className="w-full py-3.5 rounded-2xl bg-[#0071CE] text-white font-black text-base shadow-lg mb-2">
          ← Scan Another
        </button>
      </div>
    </div>
  );
}
