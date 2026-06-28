import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BarcodeReader from '../components/BarcodeReader.jsx';

export default function Scanner() {
  const navigate = useNavigate();
  const [scanning, setScanning]   = useState(true);
  const [lastCode, setLastCode]   = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleDetected = useCallback((code) => {
    setLastCode(code);
    setScanning(false);
    setTimeout(() => navigate(`/product/${encodeURIComponent(code)}`), 300);
  }, [navigate]);

  const handleManual = (e) => {
    e.preventDefault();
    if (manualCode.trim()) navigate(`/product/${encodeURIComponent(manualCode.trim())}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="20" width="6" height="12" rx="2" fill="#FFC220"/>
            <rect x="13" y="12" width="6" height="20" rx="2" fill="#0071CE"/>
            <rect x="22" y="6" width="6" height="26" rx="2" fill="#0A2540" stroke="#FFC220" strokeWidth="1.5"/>
          </svg>
          <span className="text-white font-black text-lg">FillSync</span>
          <span className="text-[#0071CE] text-[9px] font-bold uppercase tracking-widest mt-0.5">Scanner</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings')}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button onClick={handleLogout}
            className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Camera area */}
      <div className="relative flex-1 overflow-hidden">
        <BarcodeReader onDetected={handleDetected} active={scanning} />

        {/* Overlay with scan window */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Dark overlay — 4 corners around the scan box */}
          <div className="absolute inset-0 bg-black/55" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 12% 20%, 12% 80%, 88% 80%, 88% 20%, 12% 20%)' }} />

          {/* Scan box */}
          <div className="absolute" style={{ top: '20%', left: '12%', right: '12%', bottom: '20%' }}>
            {/* Corner brackets */}
            {[['top-0 left-0', 'border-t-4 border-l-4 rounded-tl-xl'],
              ['top-0 right-0', 'border-t-4 border-r-4 rounded-tr-xl'],
              ['bottom-0 left-0', 'border-b-4 border-l-4 rounded-bl-xl'],
              ['bottom-0 right-0', 'border-b-4 border-r-4 rounded-br-xl']
            ].map(([pos, cls]) => (
              <div key={pos} className={`absolute ${pos} w-8 h-8 border-[#0071CE] ${cls}`} />
            ))}
            {/* Animated scan line */}
            {scanning && (
              <div className="scan-line absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-[#0071CE] to-transparent shadow-lg" style={{ boxShadow: '0 0 8px #0071CE' }} />
            )}
            {/* Last detected */}
            {lastCode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-green-500/90 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <p className="text-white font-bold text-sm">✓ {lastCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="relative z-20 bg-gradient-to-t from-black/90 to-transparent px-6 pt-4 pb-8">
        <p className="text-center text-white/60 text-sm mb-4">
          Point camera at a product barcode
        </p>

        {!showManual ? (
          <button onClick={() => setShowManual(true)}
            className="w-full py-3 rounded-xl border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors">
            Enter barcode manually
          </button>
        ) : (
          <form onSubmit={handleManual} className="flex gap-2">
            <input
              type="text" value={manualCode} onChange={e => setManualCode(e.target.value)}
              placeholder="UPC, GTIN or SKU"
              autoFocus
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#0071CE] text-sm"
            />
            <button type="submit"
              className="px-5 py-3 rounded-xl bg-[#0071CE] text-white font-bold text-sm hover:bg-[#005EA8] transition-colors">
              Go
            </button>
          </form>
        )}

        {!scanning && (
          <button onClick={() => { setScanning(true); setLastCode(''); }}
            className="w-full mt-3 py-3 rounded-xl bg-[#FFC220] text-[#0A2540] font-black text-sm">
            Scan another
          </button>
        )}
      </div>
    </div>
  );
}
