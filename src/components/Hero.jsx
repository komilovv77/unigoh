import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, Sparkles, ShieldCheck, Zap, Award, ArrowRight } from 'lucide-react';

export default function Hero({ searchQuery, setSearchQuery, selectedRegion, setSelectedRegion }) {
  const { setCurrentTab } = useApp();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-white py-12 sm:py-16 border-b border-slate-100">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-blue-200/30 blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold mb-5 shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Farg'ona vodiysi va O'zbekiston nodavlat OTMlari uchun yagona portal</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
            Universitetlarni taqqoslang, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              1 ta profil bilan
            </span> arizangizni topshiring
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Ortiq har bir OTMga alohida qatnash, navbatda turish yoki hujjatlarni qayta-qayta topshirish shart emas. 
            Yagona <strong>UniGoh</strong> profili orqali reytinglarni ko'ring, grant yutib oling va raqamli vaucherga ega bo'ling.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Yo'nalish (masalan: Sun'iy intellekt, Moliya, Tibbiyot)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
              />
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all"
            >
              <span>OTMlarni qidirish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Fast Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">AI / OCR Verifikatsiya</p>
                <p className="text-[11px] text-slate-500">Pasport & Attestat tekshiruvi</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">1-Klik Ariza topshirish</p>
                <p className="text-[11px] text-slate-500">Bir vaqtning o'zida ko'p OTMga</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">QR-kodli Raqamli Vaucher</p>
                <p className="text-[11px] text-slate-500">Rasmiy Attribution ID</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
