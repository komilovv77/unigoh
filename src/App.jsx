import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Profile from './components/Profile';

export default function App() {
  const [session, setSession] = useState(null);

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar session={session} />
      
      <main className="container mx-auto px-4 py-6">
        {session ? (
          <Profile session={session} />
        ) : (
          <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              UniGoh Platformasiga Xush Kelibsiz!
            </h1>
            <p className="text-gray-500 mb-6 text-sm">
              Universitetlarga ariza topshirish va shaxsiy kabinetingizni to'ldirish uchun tizimga kiring.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

