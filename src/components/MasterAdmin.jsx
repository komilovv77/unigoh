import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UNIVERSITIES } from '../data/universities';
import { 
  ShieldAlert, 
  TrendingUp, 
  CreditCard, 
  PhoneCall, 
  AlertTriangle, 
  Building, 
  CheckCircle2, 
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function MasterAdmin() {
  const { applications, notify } = useApp();
  const [selectedAuditFilter, setSelectedAuditFilter] = useState('ALL');

  // Audit list: Applicants marked as REJECTED or PENDING by university to cross-check
  const auditCandidates = applications.filter(a => a.status === 'REJECTED' || a.status === 'PENDING');

  // Revenue calculation
  const totalSubRevenue = UNIVERSITIES.reduce((acc, u) => {
    return acc + (u.tariffTier.includes('Paket B') ? 8000000 : 3000000);
  }, 0);

  const totalContractsPaid = applications.filter(a => a.status === 'CONTRACT_ISSUED').length;
  const estimatedCommission = totalContractsPaid * 1500000; // 1.5 mln per enrolled student

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              Operator & Asoschi Nazorati
            </span>
            <span className="text-xs text-slate-400">| unigoh.uz Founder Panel</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Master Admin & Audit Paneli
          </h2>
          <p className="text-sm text-slate-500">
            Hamkor universitetlar tariflari, tushumlar va OTMlar tomonidan yashirilgan arizalarni audit qilish moduli.
          </p>
        </div>
      </div>

      {/* Founder Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-indigo-950/20">
          <span className="text-xs font-semibold uppercase text-indigo-300">Oylik Obuna Tushumi (MRR)</span>
          <p className="text-3xl font-black mt-2">{(totalSubRevenue / 1000000).toFixed(0)} mln UZS</p>
          <span className="text-xs text-indigo-200 mt-1 block">
            {UNIVERSITIES.length} ta hamkor OTM obunasi
          </span>
        </div>

        <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white p-6 rounded-3xl shadow-lg shadow-emerald-950/20">
          <span className="text-xs font-semibold uppercase text-emerald-300">Muvaffaqiyatli Talabalar Komissiyasi</span>
          <p className="text-3xl font-black mt-2">{(estimatedCommission / 1000000).toFixed(1)} mln UZS</p>
          <span className="text-xs text-emerald-200 mt-1 block">
            Har bir to'langan shartnoma uchun 1.5 mln so'm
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-slate-400">Jami Yuborilgan Arizalar</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{applications.length} ta</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            Vodiy va Toshkent bo'yicha
          </span>
        </div>
      </div>

      {/* University Tariff Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Building className="w-5 h-5 text-indigo-600" />
          <span>Hamkor OTMlar va Tarif Rejalari</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {UNIVERSITIES.map(u => (
            <div key={u.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    u.tariffTier.includes('Paket B') ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {u.tariffTier}
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {u.tariffTier.includes('Paket B') ? '8,000,000 UZS' : '3,000,000 UZS'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{u.region} viloyati</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>Yo'nalishlar: {u.programs.length} ta</span>
                <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Tarifni o'zgartirish</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Call Module (Anti-Bypass System) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-amber-500" />
              <span>Audit Call Moduli (Anti-Bypass Tekshiruv)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Universitetlar tomonidan "To'lamadi" yoki "Rad etildi" deb belgilangan talabalar haqiqatda shartnoma qilganligini aniqlash.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start">
            {auditCandidates.length} ta nomzod audit uchun
          </span>
        </div>

        {auditCandidates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Hozircha audit talab qiladigan arizalar yo'q.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {auditCandidates.map(c => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{c.id}</span>
                    <span className="text-xs font-bold text-slate-800">{c.applicantName}</span>
                    <span className="text-xs text-slate-500">({c.applicantPhone})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Universitet: <strong>{c.universityName}</strong> | Fakultet: {c.programName}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => notify(`Audit qo'ng'irog'i boshlandi: ${c.applicantPhone}`)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Qo'ng'iroq qilish</span>
                  </button>
                  <button
                    onClick={() => notify("Ariza tasdiqlandi va komissiya hisoblandi!")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors"
                  >
                    <span>To'lagan deb tasdiqlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
