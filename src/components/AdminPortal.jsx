import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MasterAdmin from './MasterAdmin';
import UniversityCRM from './UniversityCRM';
import { 
  ShieldAlert, 
  Database, 
  KeyRound, 
  Lock, 
  ArrowLeft, 
  LogOut, 
  Building2, 
  FileText, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  Server,
  Code2
} from 'lucide-react';

export default function AdminPortal({ onBackToPublic }) {
  const { applications, studentProfile, notify } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('unigoh_admin_authenticated') === 'true';
  });

  const [activeAdminSubTab, setActiveAdminSubTab] = useState('database'); // 'database' | 'founder' | 'crm'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    if ((username === 'komilovv77' || username === 'admin') && (password === 'unigoh2026!' || password === '7777')) {
      setIsAuthenticated(true);
      localStorage.setItem('unigoh_admin_authenticated', 'true');
      setErrorMsg('');
      notify("Xush kelibsiz, Abdulloh Komilov! Admin va Database paneli ochildi.");
    } else {
      setErrorMsg("Login yoki parol noto'g'ri! Iltimos, qayta urinib ko'ring.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('unigoh_admin_authenticated');
    notify("Admin panelidan chiqildi", "info");
  };

  // Export full JSON Database
  const handleDownloadDatabase = () => {
    const fullDb = {
      exportedAt: new Date().toISOString(),
      platform: "UniGoh (unigoh.uz)",
      founder: "Abdulloh Komilov (@komilovv77)",
      totalApplications: applications.length,
      profile: studentProfile,
      applications: applications
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDb, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `unigoh_database_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notify("Ma'lumotlar bazasi nusxasi (JSON) yuklab olindi!");
  };

  // If NOT Authenticated: Show Secure Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg text-white">
              <Database className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold tracking-widest uppercase border border-amber-500/20">
              Admin & Database Console
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">UniGoh Boshqaruv Markazi</h2>
            <p className="text-xs text-slate-400">
              Ushbu sahifa maxfiy bo'lib, faqat platforma asoschisi (@komilovv77) va OTM qabul komissiyasi uchun mo'ljallangan.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Admin Login / Foydalanuvchi nomi</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="komilovv77"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Maxfiy Parol / Kirish Kodi</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Tizimga Kirish (Authorize)</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              onClick={onBackToPublic}
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center space-x-1.5 mx-auto transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Asosiy veb-saytga qaytish</span>
            </button>
          </div>

        </div>

      </div>
    );
  }

  // Once Authenticated: Full Management Dashboard
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm text-white tracking-wide">UniGoh Admin & Database Console</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PROD v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Asoschi: <strong className="text-indigo-400">Abdulloh Komilov (@komilovv77)</strong> | Xavfsiz sessiya faol
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveAdminSubTab('database')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeAdminSubTab === 'database'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Ma'lumotlar Bazasi</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('founder')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeAdminSubTab === 'founder'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Admin</span>
          </button>

          <button
            onClick={() => setActiveAdminSubTab('crm')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center space-x-1.5 ${
              activeAdminSubTab === 'crm'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>OTM CRM</span>
          </button>
        </div>

        {/* Right Actions: Back & Logout */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackToPublic}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Veb-saytga qaytish</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
            title="Sessiyani yakunlash"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* SUB-TAB 1: DATABASE MANAGER */}
        {activeAdminSubTab === 'database' && (
          <div className="space-y-6">
            
            {/* Database Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Baza Holati (Database Status)</span>
                <p className="text-xl font-black text-emerald-400 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Faol (Live Connected)</span>
                </p>
                <span className="text-[11px] text-slate-500 block">PostgreSQL / JSON Engine</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">Jami Arizalar Soni</span>
                <p className="text-xl font-black text-white">{applications.length} ta yozuv</p>
                <span className="text-[11px] text-indigo-400 block">Unikal Attribution ID bilan</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-medium">REST API Server</span>
                <p className="text-xl font-black text-indigo-400 font-mono">http://localhost:5000</p>
                <span className="text-[11px] text-slate-500 block">/api/applications, /api/profile</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 font-medium">Zaxira Nusxasi (Backup)</span>
                  <p className="text-xs text-slate-300">To'liq bazani yuklab olish</p>
                </div>
                <button
                  onClick={handleDownloadDatabase}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Bazani Yuklab Olish</span>
                </button>
              </div>
            </div>

            {/* Live Applications Table in Database */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span>Jonli Bazadagi Arizalar Ro'yxati (`public.applications`)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Barcha topshirilgan arizalar, talaba JSHSHIR (PINFL) va rasmiy QR kod identifikatorlari.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Ariza ID</th>
                      <th className="p-3">Talaba F.I.SH</th>
                      <th className="p-3">JSHSHIR (PINFL)</th>
                      <th className="p-3">Telefon</th>
                      <th className="p-3">OTM & Yo'nalish</th>
                      <th className="p-3">Holat</th>
                      <th className="p-3">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {applications.map(app => (
                      <tr key={app.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-indigo-400">{app.id}</td>
                        <td className="p-3 font-bold text-white">{app.applicantName}</td>
                        <td className="p-3 font-mono text-slate-400">{app.applicantPinfl}</td>
                        <td className="p-3 text-slate-300">{app.applicantPhone}</td>
                        <td className="p-3">
                          <div className="text-white font-medium">{app.universityName}</div>
                          <div className="text-[11px] text-slate-400">{app.programName}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">{app.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SQL & Supabase Schema Reference */}
            <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Bulutli PostgreSQL / Supabase Arxitekturasi</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ushbu loyiha uchun to'liq SQL jadval va Row Level Security (RLS) siyosati tayyorlangan: <code className="text-indigo-400 font-mono bg-slate-900 px-2 py-0.5 rounded">database_schema.sql</code>.
              </p>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 overflow-x-auto">
                <p className="text-slate-500">-- Supabase / PostgreSQL Connection string:</p>
                <p className="text-emerald-400">postgresql://postgres:[YOUR-PASSWORD]@db.unigoh.supabase.co:5432/postgres</p>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 2: MASTER ADMIN */}
        {activeAdminSubTab === 'founder' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 text-slate-900">
            <MasterAdmin />
          </div>
        )}

        {/* SUB-TAB 3: OTM CRM */}
        {activeAdminSubTab === 'crm' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 p-6 text-slate-900">
            <UniversityCRM />
          </div>
        )}

      </main>

    </div>
  );
}
