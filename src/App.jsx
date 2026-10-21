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
import { GraduationCap, ShieldCheck, Heart, Sparkles, Check } from 'lucide-react';

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
