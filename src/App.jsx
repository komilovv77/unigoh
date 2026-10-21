import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UniversityCatalog from './components/UniversityCatalog';
import UniversityDetailModal from './components/UniversityDetailModal';
import DocumentVault from './components/DocumentVault';
import ApplicationTracker from './components/ApplicationTracker';
import UniversityCRM from './components/UniversityCRM';
import MasterAdmin from './components/MasterAdmin';
import AIChatbot from './components/AIChatbot';
import { GraduationCap, ShieldCheck, Heart, Sparkles, Check, Lock, X, KeyRound } from 'lucide-react';

function AdminAuthModal() {
  const { isAdminAuthModalOpen, setIsAdminAuthModalOpen, verifyAdminPin } = useApp();
  const [pin, setPin] = useState('');

  if (!isAdminAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verifyAdminPin(pin)) {
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={() => {
            setIsAdminAuthModalOpen(false);
            setPin('');
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            Himoyalangan Hudud
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">Ma'muriy Kirish (RBAC)</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Bu bo'lim faqat <strong>UniGoh Asoschisi (@komilovv77)</strong> va OTM Qabul komissiyasi ma'murlari uchun.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 text-left">
              Xavfsizlik PIN kodi:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                maxLength={6}
                placeholder="PIN kodni kiriting (demo: 7777)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-center text-sm font-mono tracking-widest text-slate-900"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 text-left">
            💡 <strong>Eslatma</strong>: Haqiqiy serverda bu qism Supabase Row Level Security (RLS) va maxsus xodimlar hisobi orqali avtorizatsiya qilinadi.
          </div>

          <button
            type="button"
            onClick={() => verifyAdminPin('7777')}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5"
          >
            <span>👑 Asoschi (@komilovv77) sifatida 1-klikda ochish</span>
          </button>

          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdminAuthModalOpen(false);
                setPin('');
              }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
            >
              PIN bilan kirish
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

function MainLayout() {
  const { currentTab, notification } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Barchasi');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs animate-in slide-in-from-top-4 duration-200 border border-slate-700">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3 h-3" />
          </span>
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar />

      {/* Main Body depending on Active Tab */}
      <main className="flex-1">
        {currentTab === 'catalog' && (
          <>
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
            />
            <UniversityCatalog
              searchQuery={searchQuery}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
            />
          </>
        )}

        {currentTab === 'profile' && <DocumentVault />}

        {currentTab === 'applications' && <ApplicationTracker />}

        {currentTab === 'crm' && <UniversityCRM />}

        {currentTab === 'founder' && <MasterAdmin />}
      </main>

      {/* Modals & Floating Assistants */}
      <UniversityDetailModal />
      <AdminAuthModal />
      <AIChatbot />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">Uni<span className="text-indigo-600">Goh</span></span>
                <p className="text-xs text-slate-500">UniGoh — Barcha universitetlar bir joyda</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>O'RQ-547 Qonuniga muvofiq himoyalangan</span>
              </span>
              <span>•</span>
              <span>Farg'ona vodiysi & Toshkent nodavlat OTMlari</span>
              <span>•</span>
              <span>AES-256 Shifrlash</span>
            </div>

            <div className="text-xs text-slate-400 text-center md:text-right">
              <p>© 2026 UniGoh platformasi. Barcha huquqlar himoyalangan.</p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                Created for <a href="https://github.com/komilovv77" target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline">@komilovv77</a>
              </p>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
