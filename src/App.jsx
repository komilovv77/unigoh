import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient'
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import Landing from './components/Landing';
import AuthModal, { NewPasswordModal } from './components/AuthModal';
import UniversityList from './components/UniversityList';
import MyApplications from './components/MyApplications';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = () => setIsAuthOpen(true);

  return (
    <div className="min-h-screen bg-cream text-slate-900">
      <Navbar session={session} onLoginClick={openAuth} />

      {session ? (
        <StudentHome session={session} />
      ) : (
        <Landing onStart={openAuth} />
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {recovering && <NewPasswordModal onDone={() => setRecovering(false)} />}
    </div>
  );
}

const TABS = [
  { id: 'profile', label: 'Profilim' },
  { id: 'universities', label: 'Universitetlar' },
  { id: 'applications', label: 'Arizalarim' },
];

function StudentHome({ session }) {
  const [tab, setTab] = useState('profile');

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <nav className="flex gap-1 p-1.5 bg-white border border-brand-100 rounded-2xl" aria-label="Kabinet bo'limlari">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex-1 px-3 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition ${
              tab === t.id ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'profile' && <Profile session={session} />}
        {tab === 'universities' && <UniversityList session={session} />}
        {tab === 'applications' && <MyApplications session={session} onBrowse={() => setTab('universities')} />}
      </div>
    </main>
  );
}
