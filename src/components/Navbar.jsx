import React from 'react';
import { supabase } from '../lib/supabaseClient';
import Logo from './Logo';

export default function Navbar({ session, onLoginClick }) {
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-brand-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a href="/" aria-label="UniGoh bosh sahifa">
            <Logo />
          </a>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="hidden sm:inline text-sm font-medium text-slate-700 bg-brand-50 px-3 py-1.5 rounded-lg">
                  {session.user.email}
                </span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 rounded-lg transition"
                >
                  Chiqish
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm sm:text-base font-semibold rounded-xl transition"
              >
                Kirish
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
