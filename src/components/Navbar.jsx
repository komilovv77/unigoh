import React from 'react';
import { supabase } from '../lib/supabaseClient';
import Logo from './Logo';
import { useLang } from '../i18n';

export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t('nav.lang')} className="inline-flex p-0.5 rounded-lg bg-brand-50 border border-brand-100">
      {['uz', 'ru'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold transition ${
            lang === l ? 'bg-brand-800 text-white' : 'text-brand-800 hover:bg-white'
          }`}
        >
          {l === 'uz' ? "O'z" : 'Ру'}
        </button>
      ))}
    </div>
  );
}

export default function Navbar({ session, onLoginClick }) {
  const { t } = useLang();
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-brand-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-3">
          <a href="/" aria-label={t('nav.home')} className="shrink-0">
            <Logo />
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitch />
            {session ? (
              <>
                <span className="hidden md:inline text-sm font-medium text-slate-700 bg-brand-50 px-3 py-1.5 rounded-lg max-w-[220px] truncate">
                  {session.user.email}
                </span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-2 sm:px-3 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 rounded-lg transition"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 sm:px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm sm:text-base font-semibold rounded-xl transition"
              >
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
