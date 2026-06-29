import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const DEFAULT = {
  taxPct: 0, transferFee: 0, packingCost: 0, shippingCost: 0, customCosts: [],
  minProfit: 0, minROI: 0, minMargin: 0
};

function loadSettings() {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem('fillsync_scanner_settings') || '{}') }; }
  catch { return DEFAULT; }
}

function NumField({ label, hint, value, onChange, suffix = '' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#B0B0B0] uppercase tracking-wider mb-1.5">{label}</label>
      {hint && <p className="text-[10px] text-[#B0B0B0] mb-1.5">{hint}</p>}
      <div className="relative">
        {!suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071CE] font-bold text-sm">$</span>}
        <input
          type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)}
          className={`w-full ${!suffix ? 'pl-7' : 'pl-4'} pr-8 py-2.5 border-2 border-[#E0E0E0] rounded-xl text-sm font-bold text-[#0A2540] focus:border-[#0071CE] focus:outline-none`}
          placeholder="0"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B0B0B0] font-bold text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState(loadSettings);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setS(prev => ({ ...prev, [key]: val }));

  const addCustom = () => setS(prev => ({
    ...prev,
    customCosts: [...(prev.customCosts || []), { name: '', amount: '' }],
  }));

  const updateCustom = (i, field, val) => setS(prev => {
    const arr = [...(prev.customCosts || [])];
    arr[i] = { ...arr[i], [field]: val };
    return { ...prev, customCosts: arr };
  });

  const removeCustom = (i) => setS(prev => ({
    ...prev,
    customCosts: (prev.customCosts || []).filter((_, idx) => idx !== i),
  }));

  const save = () => {
    localStorage.setItem('fillsync_scanner_settings', JSON.stringify(s));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col">

      {/* Header */}
      <div className="bg-[#0A2540] px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/')}
            className="text-white/70 p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-white font-black text-xl">Settings</h1>
          <div className="flex-1" />
          <button onClick={handleLogout}
            className="text-white/50 text-xs font-semibold hover:text-white/80">Sign out</button>
        </div>
        <p className="text-[#64B5F6] text-xs ml-9">Configure additional costs for the calculator</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Tax on COGS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Tax</h3>
          <NumField
            label="Tax on COGS"
            hint="Applied as % of your COGS (e.g. sales tax when buying inventory)"
            value={s.taxPct}
            onChange={v => update('taxPct', parseFloat(v) || 0)}
            suffix="%"
          />
        </div>

        {/* Fixed costs per unit */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Fixed Costs per Unit</h3>
          <div className="space-y-3">
            <NumField label="Transfer / Prep Fee" value={s.transferFee} onChange={v => update('transferFee', parseFloat(v) || 0)} />
            <NumField label="Packing Cost" value={s.packingCost} onChange={v => update('packingCost', parseFloat(v) || 0)} />
            <NumField label="Shipping to WFS" value={s.shippingCost} onChange={v => update('shippingCost', parseFloat(v) || 0)} />
          </div>
        </div>

        {/* Profit Thresholds */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest mb-3">Profit Thresholds ✅/❌</h3>
          <div className="space-y-3">
            <NumField
              label="Minimum Net Profit"
              hint="Shows ✅ if profit ≥ this amount"
              value={s.minProfit}
              onChange={v => update('minProfit', parseFloat(v) || 0)}
            />
            <NumField
              label="Minimum ROI %"
              hint="Shows ✅ if ROI ≥ this %"
              value={s.minROI}
              onChange={v => update('minROI', parseFloat(v) || 0)}
              suffix="%"
            />
            <NumField
              label="Minimum Margin %"
              hint="Shows ✅ if margin ≥ this %"
              value={s.minMargin}
              onChange={v => update('minMargin', parseFloat(v) || 0)}
              suffix="%"
            />
          </div>
        </div>

        {/* Custom costs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-[#0A2540] uppercase tracking-widest">Custom Costs</h3>
            <button onClick={addCustom}
              className="text-[#0071CE] text-xs font-bold hover:underline">+ Add</button>
          </div>
          {(!s.customCosts || s.customCosts.length === 0) && (
            <p className="text-[#B0B0B0] text-sm text-center py-2">No custom costs yet</p>
          )}
          <div className="space-y-3">
            {(s.customCosts || []).map((c, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text" placeholder="Cost name" value={c.name}
                    onChange={e => updateCustom(i, 'name', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#E0E0E0] rounded-xl text-sm text-[#0A2540] focus:border-[#0071CE] focus:outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0071CE] font-bold text-sm">$</span>
                    <input
                      type="number" step="0.01" min="0" placeholder="0.00" value={c.amount}
                      onChange={e => updateCustom(i, 'amount', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border-2 border-[#E0E0E0] rounded-xl text-sm font-bold text-[#0A2540] focus:border-[#0071CE] focus:outline-none"
                    />
                  </div>
                </div>
                <button onClick={() => removeCustom(i)}
                  className="mt-1 text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save}
          className={`w-full py-3.5 rounded-2xl font-black text-base transition-all ${saved ? 'bg-green-500 text-white' : 'bg-[#0071CE] text-white hover:bg-[#005EA8]'}`}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
