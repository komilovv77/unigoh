import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Building2, 
  FileCheck, 
  UserCircle, 
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { currentTab, setCurrentTab, applications, isChatOpen, setIsChatOpen, studentProfile } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('catalog')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900">Uni<span className="text-indigo-600">Goh</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  uz
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Barcha universitetlar bir joyda
              </p>
            </div>
          </div>

          {/* Public Student Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'catalog'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Universitetlar</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Profil, Hujjatlar & Sertifikatlar</span>
              {studentProfile.passportDocument.isOcrVerified && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('applications')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                currentTab === 'applications'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Arizalarim</span>
              {applications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {applications.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action: AI Bot & Profile Badge */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm flex items-center space-x-2 transition-all hover:shadow"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">24/7 AI Maslahatchi</span>
              <span className="sm:hidden">AI Bot</span>
            </button>

            <div className="text-right hidden lg:block border-l pl-3 border-slate-200">
              <p className="text-xs font-semibold text-slate-800">{studentProfile.fullName}</p>
              <p className="text-[11px] text-emerald-600 flex items-center justify-end font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>
                Tasdiqlangan
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar (Public Only) */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'catalog' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'}`}
          >
            OTMlar
          </button>
          <button
            onClick={() => setCurrentTab('profile')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'profile' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'}`}
          >
            Profil & Sertifikatlar
          </button>
          <button
            onClick={() => setCurrentTab('applications')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${currentTab === 'applications' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-100 text-slate-700'}`}
          >
            Arizalar ({applications.length})
          </button>
        </div>
      </div>
    </header>
  );
}
