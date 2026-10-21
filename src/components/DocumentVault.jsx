import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  User, 
  Phone, 
  MapPin, 
  Hash
} from 'lucide-react';

export default function DocumentVault() {
  const { studentProfile, setStudentProfile, notify } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // Handle Form Input Change
  const handleChange = (field, value) => {
    setStudentProfile(prev => ({ ...prev, [field]: value }));
  };

  // Run AI / OCR Scanner Simulation
  const handleSimulateOcr = (docType) => {
    setIsScanning(true);
    setScanMessage("AI OCR tizimi rasm aniqligini tahlil qilmoqda...");

    setTimeout(() => {
      setScanMessage("JSHSHIR va F.I.SH belgilari o'qilmoqda...");
    }, 900);

    setTimeout(() => {
      setScanMessage("Davlat bazasi bilan muvofiqligi tekshirildi (99.4% ishonchlilik).");
      setIsScanning(false);
      setStudentProfile(prev => ({
        ...prev,
        passportDocument: {
          ...prev.passportDocument,
          isOcrVerified: true,
          ocrConfidence: "99.4%",
          extractedName: prev.fullName.toUpperCase(),
          extractedPinfl: prev.jshshir
        }
      }));
      notify("Pasport AI/OCR orqali muvaffaqiyatli tasdiqlandi!");
    }, 1800);
  };

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Abituriyent Profili & Hujjatlar Sandig'i</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Himoyalangan (AES-256)</span>
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ushbu ma'lumotlar barcha tanlangan universitetlarga yagona ariza (Common App) sifatida yuboriladi.
          </p>
        </div>
      </div>

      {/* Security Compliance Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-start space-x-4 shadow-lg shadow-indigo-950/20">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="text-xs sm:text-sm">
          <h4 className="font-bold text-indigo-200 mb-0.5">
            O'zbekiston Respublikasi Qonunchiligiga to'liq muvofiq
          </h4>
          <p className="text-slate-300 leading-relaxed text-xs">
            "Shaxsiy ma'lumotlar to'g'risida"gi Qonunga (O'RQ-547) asosan fuqarolarning JSHSHIR, pasport nusxalari va boshqa identifikatsiya ma'lumotlari bank darajasidagi AES-256 shifrlangan serverlarda saqlanadi va faqat siz arizangizni topshirgan OTM qabul komissiyasiga ko'rsatiladi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Personal Data Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <User className="w-5 h-5 text-indigo-600" />
            <span>Shaxsiy Ma'lumotlar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                F.I.SH (To'liq ism-familiya)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentProfile.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            {/* JSHSHIR (PINFL) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                <span>JSHSHIR (14 xonali PINFL)</span>
                <span className="text-[10px] text-indigo-600 font-bold lowercase">
                  {studentProfile.jshshir.length}/14
                </span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={14}
                  value={studentProfile.jshshir}
                  onChange={(e) => handleChange('jshshir', e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                Telefon Raqam (Telegram / SMS)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={studentProfile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                Doimiy Yashash Hududi
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={studentProfile.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800 bg-white"
                >
                  <option value="Andijon">Andijon viloyati</option>
                  <option value="Farg'ona">Farg'ona viloyati</option>
                  <option value="Namangan">Namangan viloyati</option>
                  <option value="Toshkent">Toshkent shahri / viloyati</option>
                  <option value="Samarqand">Samarqand viloyati</option>
                </select>
              </div>
            </div>

            {/* Target Major */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                Qiziqqan Asosiy Sohasi
              </label>
              <input
                type="text"
                value={studentProfile.targetMajor}
                onChange={(e) => handleChange('targetMajor', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => notify("Shaxsiy ma'lumotlar saqlandi!")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-100 transition-colors"
            >
              Ma'lumotlarni saqlash
            </button>
          </div>
        </div>

        {/* Right 1 Col: Document Vault & AI OCR */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Hujjatlar</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              2 ta yuklangan
            </span>
          </div>

          {/* Passport Vault Item */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">1. Pasport / ID Karta nusxasi</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {studentProfile.passportDocument.fileName} ({studentProfile.passportDocument.fileSize})
                </p>
              </div>
              <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            {/* OCR Status Badge */}
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 font-medium">AI OCR Holati:</span>
              </div>
              <span className="font-bold text-emerald-600">
                Tasdiqlangan ({studentProfile.passportDocument.ocrConfidence})
              </span>
            </div>

            <button
              onClick={() => handleSimulateOcr('passport')}
              disabled={isScanning}
              className="w-full py-2 px-3 rounded-xl border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Qayta AI tekshiruvdan o'tkazish</span>
            </button>
          </div>

          {/* Diploma Vault Item */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">2. Maktab Attestati / Kollej Diplomi</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {studentProfile.diplomaDocument.fileName} ({studentProfile.diplomaDocument.fileSize})
                </p>
              </div>
              <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">O'rtacha baho:</span>
              <span className="font-bold text-indigo-700">{studentProfile.diplomaDocument.extractedGpa}</span>
            </div>
          </div>

          {/* Active OCR Notification */}
          {isScanning && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center space-x-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
