import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UniversityCatalog from './components/UniversityCatalog';
import DocumentVault from './components/DocumentVault';
import ApplicationTracker from './components/ApplicationTracker';
import AIChatbot from './components/AIChatbot';
import AdminPortal from './components/AdminPortal';
import { AppProvider } from './context/AppContext';

function MainApp() {
  const [currentTab, setCurrentTab] = useState('catalog');
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setShowAdminPortal(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (showAdminPortal) {
    return (
      <AdminPortal
        onBackToPublic={() => {
          setShowAdminPortal(false);
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Hero 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
        />

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 space-x-8">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            OTMlar Katalogi
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Hujjatlar & Sertifikatlar
          </button>
          <button
            onClick={() => setCurrentTab('applications')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentTab === 'applications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Mening Arizalarim
          </button>
        </div>

        {/* Tab Contents */}
        {currentTab === 'catalog' && <UniversityCatalog searchQuery={searchQuery} selectedRegion={selectedRegion} />}
        {currentTab === 'profile' && <DocumentVault />}
        {currentTab === 'applications' && <ApplicationTracker />}
      </main>

      <AIChatbot />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
