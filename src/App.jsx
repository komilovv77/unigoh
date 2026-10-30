import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import Landing from './components/Landing';
import AuthModal from './components/AuthModal';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = () => setIsAuthOpen(true);

  return (
    <div className="min-h-screen bg-cream text-slate-900">
      <Navbar session={session} onLoginClick={openAuth} />

      {session ? (
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Profile session={session} />
        </main>
      ) : (
        <Landing onStart={openAuth} />
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
