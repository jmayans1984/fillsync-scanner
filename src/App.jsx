import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Scanner  from './pages/Scanner.jsx';
import Product  from './pages/Product.jsx';
import Settings from './pages/Settings.jsx';
import Login    from './pages/Login.jsx';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A2540]">
        <div className="w-8 h-8 border-4 border-[#0071CE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/"               element={<Scanner />} />
            <Route path="/product/:code"  element={<Product />} />
            <Route path="/settings"       element={<Settings />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
