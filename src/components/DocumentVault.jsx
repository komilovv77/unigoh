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
  User, 
  Phone, 
  MapPin, 
  Hash,
  Award,
  Plus,
  Trash2,
  GraduationCap,
  Calendar,
  FileCheck
} from 'lucide-react';

const RECOGNIZED_CERTIFICATES = [
  "CEFR Milliy Sertifikat (B1, B2, C1)",
  "IELTS Academic / UKVI",
  "TOEFL iBT",
  "Duolingo English Test (DET)",
  "Cambridge English (B2 First / C1 Advanced)",
  "TOPIK (Koreys tili - 3, 4, 5, 6)",
  "TRKI / TORFL (Rus tili - B1, B2, C1)",
  "Goethe-Zertifikat / TestDaF (Nemis tili)",
  "TÖMER (Turk tili - B2, C1)",
  "SAT (Scholastic Assessment Test)",
  "Boshqa Xalqaro / Respublika Olimpiada Diplomi"
];

export default function DocumentVault() {
  const { studentProfile, setStudentProfile, addCertificate, removeCertificate, updateTestScores, notify } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // New certificate form state
  const [newCertType, setNewCertType] = useState(RECOGNIZED_CERTIFICATES[0]);
  const [newCertLevel, setNewCertLevel] = useState('');
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newCertDate, setNewCertDate] = useState('');

  // Exam scores state
  const [dtmScore, setDtmScore] = useState(studentProfile.testScores?.dtmExamScore || '142.8');
  const [dtmYear, setDtmYear] = useState(studentProfile.testScores?.dtmYear || '2026');
  const [internalScore, setInternalScore] = useState(studentProfile.testScores?.internalUniScore || '92 ball (Imtihondan o\'tgan)');

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

  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (!newCertLevel.trim()) {
      notify("Iltimos, sertifikat darajasi yoki ballini kiriting (masalan: B2, Band 6.5)", "error");
      return;
    }
    addCertificate({
      type: newCertType,
      level: newCertLevel.trim(),
      certificateNumber: newCertNumber.trim() || `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      issueDate: newCertDate || new Date().toISOString().slice(0, 10),
      fileName: `${newCertType.split(' ')[0].toLowerCase()}_sertifikat.pdf`
    });
    setNewCertLevel('');
    setNewCertNumber('');
    setNewCertDate('');
  };

  const handleSaveScores = () => {
    updateTestScores({
      dtmExamScore: dtmScore,
      dtmYear: dtmYear,
      internalUniScore: internalScore
    });
  };

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Abituriyent Profili, Hujjatlar & Sertifikatlar</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Himoyalangan (AES-256)</span>
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pasport, attestat, barcha turdagi CEFR/xalqaro sertifikatlar hamda DTM/OTM imtihon natijalari bitta joyda.
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
            "Shaxsiy ma'lumotlar to'g'risida"gi Qonunga (O'RQ-547) asosan fuqarolarning JSHSHIR, pasport nusxalari, sertifikatlari va imtihon ballari bank darajasidagi AES-256 shifrlangan serverlarda saqlanadi.
          </p>
        </div>
      </div>

      {/* SECTION 1: Personal Profile & Core Docs */}
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
              <input
                type="text"
                value={studentProfile.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-800"
              />
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

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => notify("Shaxsiy ma'lumotlar saqlandi!")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-100 transition-colors"
            >
              Ma'lumotlarni saqlash
            </button>
          </div>
        </div>

        {/* Right 1 Col: Core Documents (Passport & Attestat) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Asosiy Hujjatlar</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              2 ta tasdiqlangan
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

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-slate-700 font-medium">AI OCR:</span>
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
              <span>Qayta AI tekshiruv</span>
            </button>
          </div>

          {/* Diploma Vault Item */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">2. Maktab Attestati / Diplomi</p>
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
        </div>

      </div>

      {/* SECTION 2: CEFR & International Language / Academic Certificates */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Til & Xalqaro Sertifikatlar (CEFR, IELTS, TOEFL, SAT va b.)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O'zbekistonda tan olingan barcha milliy CEFR va xalqaro sertifikatlar qabul qilinadi. Ular grant va kirish ballarida to'liq hisobga olinadi.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold self-start">
            {(studentProfile.certificates || []).length} ta sertifikat biriktirilgan
          </span>
        </div>

        {/* Existing Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(studentProfile.certificates || []).map(cert => (
            <div key={cert.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    {cert.type}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{cert.level}</h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  № {cert.certificateNumber} | Sana: {cert.issueDate}
                </p>
                <p className="text-[11px] text-indigo-600 font-medium">
                  📄 {cert.fileName}
                </p>
              </div>

              <button
                onClick={() => removeCertificate(cert.id)}
                className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                title="Sertifikatni o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Certificate Form */}
        <form onSubmit={handleAddCertificate} className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-4">
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Yangi Sertifikat Qo'shish</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            
            {/* Cert Type */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Sertifikat Turi</label>
              <select
                value={newCertType}
                onChange={(e) => setNewCertType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                {RECOGNIZED_CERTIFICATES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Level / Score */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daraja / To'plangan Ball</label>
              <input
                type="text"
                placeholder="masalan: B2 (68) yoki Band 6.5"
                value={newCertLevel}
                onChange={(e) => setNewCertLevel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              />
            </div>

            {/* Cert Number */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sertifikat Raqami</label>
              <input
                type="text"
                placeholder="masalan: UZ-CEFR-12345"
                value={newCertNumber}
                onChange={(e) => setNewCertNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
              />
            </div>

          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-indigo-700">
              ✓ Barcha OTMlarga ariza berganda sertifikatingiz avtomatik biriktiriladi.
            </span>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sertifikatni saqlash</span>
            </button>
          </div>
        </form>

      </div>

      {/* SECTION 3: DTM / State Exam & University Internal Test Scores */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Davlat Testi (DTM) & OTM Ichki Imtihon Natijalari</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bilimni Baholash Agentligi (DTM) testi bali yoki universitet ichki saralash imtihoni natijasini biriktiring.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center space-x-1 self-start">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Natijalar Qabul Qilinadi</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          
          {/* DTM Score Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">1. Bilimni Baholash Agentligi (DTM) Bali</h4>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">Davlat Imtihoni</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">To'plangan ball:</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={dtmScore}
                    onChange={(e) => setDtmScore(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-indigo-700 text-sm"
                  />
                  <span className="text-slate-400 font-bold">/ 189.0</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Topshirilgan yili:</label>
                <input
                  type="text"
                  value={dtmYear}
                  onChange={(e) => setDtmYear(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center text-[11px]">
              <span className="text-slate-600 font-medium">DTM Javoblar varaqasi nusxasi:</span>
              <span className="font-mono text-indigo-600 font-bold">dtm_2026_javoblar.pdf</span>
            </div>
          </div>

          {/* Internal University Exam Score Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900 text-sm">2. OTM Ichki Imtihon / Suhbat Natijasi</h4>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Nodavlat OTM</span>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Imtihon / Test xulosasi:</label>
              <input
                type="text"
                value={internalScore}
                onChange={(e) => setInternalScore(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-sm"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              OTM ichki imtihonidan to'plagan balingiz qabul komissiyasi CRM panelida alohida ko'rinadi va kontrakt/grant ajratishda asos bo'ladi.
            </p>
          </div>

        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveScores}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Imtihon natijalarini saqlash
          </button>
        </div>

      </div>

    </div>
  );
}
