import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import Landing from './components/Landing';
import AuthModal, { NewPasswordModal } from './components/AuthModal';
import UniversityList from './components/UniversityList';
import MyApplications from './components/MyApplications';
import Notifications from './components/Notifications';
import Grant from './components/Grant';
import Privacy from './components/Privacy';
import { useAgreement } from './components/Agreement';
import { LangProvider, useLang } from './i18n';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') window.dispatchEvent(new Event('unigoh:recovery'));
    });
    return () => subscription.unsubscribe();
  }, []);

  // Persist language changes to the profile (SMS is sent in this language)
  const onLang = useCallback((l) => {
    if (session) supabase.from('profiles').update({ lang: l }).eq('id', session.user.id).then(() => {});
  }, [session]);

  return (
    <LangProvider onChange={onLang}>
      <Shell session={session} />
    </LangProvider>
  );
}

function Shell({ session }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    const onRecovery = () => setRecovering(true);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('unigoh:recovery', onRecovery);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('unigoh:recovery', onRecovery);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream text-slate-900">
      <Navbar session={session} onLoginClick={() => setIsAuthOpen(true)} />

      {hash === '#maxfiylik' ? (
        <Privacy />
      ) : session ? (
        <StudentHome session={session} />
      ) : (
        <Landing onStart={() => setIsAuthOpen(true)} />
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {recovering && <NewPasswordModal onDone={() => setRecovering(false)} />}
    </div>
  );
}

const TABS = ['profile', 'universities', 'applications', 'grant', 'notifications'];

function StudentHome({ session }) {
  const { t } = useLang();
  const [tab, setTab] = useState('profile');
  const [notifs, setNotifs] = useState([]);
  const agreement = useAgreement(session.user.id);

  const loadNotifs = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*')
      .eq('student_id', session.user.id).order('created_at', { ascending: false }).limit(100);
    setNotifs(data || []);
  }, [session.user.id]);

  useEffect(() => {
    loadNotifs();
    const id = setInterval(loadNotifs, 60_000);
    return () => clearInterval(id);
  }, [loadNotifs]);

  const unread = notifs.filter((n) => !n.read_at).length;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <nav className="grid grid-cols-3 sm:flex gap-1 p-1.5 bg-white border border-brand-100 rounded-2xl" aria-label={t('tabs.label')}>
        {TABS.map((id) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id === 'notifications') loadNotifs(); }}
            aria-current={tab === id ? 'page' : undefined}
            className={`relative flex-1 px-3 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition ${
              tab === id ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-brand-50'
            }`}
          >
            {t(`tabs.${id}`)}
            {id === 'notifications' && unread > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-apricot-500 text-brand-950 text-xs font-bold align-middle">
                {unread}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'profile' && <Profile session={session} />}
        {tab === 'universities' && <UniversityList session={session} onApplied={loadNotifs} />}
        {tab === 'applications' && <MyApplications session={session} agreement={agreement} onBrowse={() => setTab('universities')} onChanged={loadNotifs} />}
        {tab === 'grant' && <Grant session={session} onGoProfile={() => setTab('profile')} onGoApplications={() => setTab('applications')} onChanged={loadNotifs} />}
        {tab === 'notifications' && <Notifications items={notifs} onChange={loadNotifs} />}
      </div>
    </main>
  );
}
