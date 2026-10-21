import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UNIVERSITIES, APPLICATION_STATUSES } from '../data/universities';
import { 
  Building2, 
  Download, 
  Users, 
  CheckCircle, 
  Clock, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Filter,
  Check,
  ChevronDown
} from 'lucide-react';

export default function UniversityCRM() {
  const { applications, updateApplicationStatus, exportCRMToCSV } = useApp();
  const [selectedUniId, setSelectedUniId] = useState('isft-andijan');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchLead, setSearchLead] = useState('');

  // Selected University object
  const currentUni = UNIVERSITIES.find(u => u.id === selectedUniId) || UNIVERSITIES[0];

  // Filter applications for this university
  const uniApplications = applications.filter(app => {
    if (app.universityId !== currentUni.id) return false;
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    if (searchLead.trim()) {
      const q = searchLead.toLowerCase();
      return (
        app.applicantName.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.applicantPinfl.includes(q) ||
        app.programName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalLeads = applications.filter(a => a.universityId === currentUni.id).length;
  const approvedCount = applications.filter(a => a.universityId === currentUni.id && (a.status === 'APPROVED' || a.status === 'CONTRACT_ISSUED')).length;
  const pendingCount = applications.filter(a => a.universityId === currentUni.id && (a.status === 'PENDING' || a.status === 'IN_REVIEW')).length;
  const conversionRate = totalLeads > 0 ? ((approvedCount / totalLeads) * 100).toFixed(0) : 0;

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
              B2B CRM Paneli
            </span>
            <span className="text-xs text-slate-400">| Qabul Komissiyasi Kabineti</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {currentUni.name} — Abituriyentlar Boshqaruvi
          </h2>
          <p className="text-sm text-slate-500">
            UniGoh platformasidan yo'naltirilgan arizalarni tekshiring, statuslarni o'zgartiring va Excel formatida eksport qiling.
          </p>
        </div>

        {/* University Switcher & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-xs">
            <Building2 className="w-4 h-4 text-purple-600" />
            <select
              value={selectedUniId}
              onChange={(e) => setSelectedUniId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {UNIVERSITIES.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportCRMToCSV(currentUni.id)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel / CSV Eksport</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Jami Kelib Tushgan</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalLeads} ta</p>
          <span className="text-[11px] text-slate-500 mt-1 block">UniGoh orqali yuborilgan</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kutilayotganlar</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount} ta</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Tekshiruv talab etiladi</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Qabul / Shartnoma</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount} ta</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Tavsiya etilganlar</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Konversiya Foizi</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{conversionRate}%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Qabul qilinganlik ulushi</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Abituriyent ismi, PINFL yoki ID bo'yicha qidirish..."
            value={searchLead}
            onChange={(e) => setSearchLead(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Barcha statuslar</option>
            <option value="PENDING">Kutilmoqda</option>
            <option value="IN_REVIEW">Ko'rib chiqilmoqda</option>
            <option value="APPROVED">Qabul qilindi</option>
            <option value="CONTRACT_ISSUED">Shartnoma to'langan</option>
            <option value="REJECTED">Rad etildi</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Attribution ID</th>
                <th className="py-3.5 px-4 font-semibold">Abituriyent</th>
                <th className="py-3.5 px-4 font-semibold">JSHSHIR (PINFL)</th>
                <th className="py-3.5 px-4 font-semibold">Fakultet</th>
                <th className="py-3.5 px-4 font-semibold">Hujjatlar</th>
                <th className="py-3.5 px-4 font-semibold">Holat (Status Switcher)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uniApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Ushbu OTM uchun arizalar topilmadi.
                  </td>
                </tr>
              ) : (
                uniApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {app.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{app.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{app.applicantPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {app.applicantPinfl}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{app.programName}</div>
                      <div className="text-[10px] text-slate-400">{app.degree}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>AI Tasdiqlangan</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                        className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border focus:outline-none cursor-pointer transition-colors ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          app.status === 'CONTRACT_ISSUED' ? 'bg-green-50 text-green-800 border-green-300' :
                          app.status === 'IN_REVIEW' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="PENDING">Kutilmoqda</option>
                        <option value="IN_REVIEW">Ko'rib chiqilmoqda</option>
                        <option value="EXAM_SCHEDULED">Imtihon belgilandi</option>
                        <option value="APPROVED">Qabul qilindi</option>
                        <option value="CONTRACT_ISSUED">Shartnoma to'langan</option>
                        <option value="REJECTED">Rad etildi</option>
                      </select>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
