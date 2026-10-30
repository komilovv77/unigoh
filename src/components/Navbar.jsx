import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import AuthModal from './AuthModal';

export default function Navbar({ session }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">UniGoh</span>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-xs md:text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {session.user.email}
                </span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs md:text-sm font-semibold rounded-lg transition"
                >
                  Chiqish
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
              >
                Kirish / Ro'yxatdan o'tish
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </nav>
  );
}
