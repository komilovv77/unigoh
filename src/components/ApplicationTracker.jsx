import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { APPLICATION_STATUSES } from '../data/universities';
import { QRCodeSVG } from 'qrcode.react';
import { 
  FileCheck, 
  Calendar, 
  Clock, 
  Award, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function ApplicationTracker() {
  const { applications, setCurrentTab, setSelectedUniversity } = useApp();
  const [selectedVoucherApp, setSelectedVoucherApp] = useState(null);

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Mening Arizalarim va Natijalar</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              {applications.length} ta ariza
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Har bir topshirilgan ariza holatini real vaqt rejimida kuzatib boring va raqamli vaucherlarni oling.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('catalog')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" />
          <span>Yana OTMga topshirish</span>
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Hozircha hech qanday ariza topshirilmagan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Katalogdan o'zingizga ma'qul OTM va yo'nalishni tanlang hamda 1 klik orqali arizangizni yuboring.
          </p>
          <button
            onClick={() => setCurrentTab('catalog')}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md"
          >
            OTMlarni ko'rish
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const statusConfig = APPLICATION_STATUSES[app.status] || APPLICATION_STATUSES.PENDING;

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-5"
              >
                
                {/* Top: University + Attribution ID + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {app.id}
                      </span>
                      <span className="text-xs text-slate-400">• TopsHirildi: {app.submittedAt}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{app.universityName}</h3>
                    <p className="text-xs font-semibold text-indigo-700">{app.programName} ({app.degree})</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-medium">
                    <div className={`p-2 rounded-xl ${app.status !== 'PENDING' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      1. Ariza qabul qilindi
                    </div>
                    <div className={`p-2 rounded-xl ${app.status === 'IN_REVIEW' || app.status === 'APPROVED' || app.status === 'CONTRACT_ISSUED' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      2. Hujjatlar tekshiruvda
                    </div>
                    <div className={`p-2 rounded-xl ${app.status === 'APPROVED' || app.status === 'CONTRACT_ISSUED' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      3. Imtihon / Natija
                    </div>
                    <div className={`p-2 rounded-xl ${app.status === 'CONTRACT_ISSUED' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      4. Shartnoma (To'langan)
                    </div>
                  </div>
                </div>

                {/* Bottom Details & Voucher Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-600 flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span><strong>Imtihon / Suhbat sanasi:</strong> {app.examDate}</span>
                    </p>
                    {app.notes && (
                      <p className="text-emerald-700 font-medium">
                        ✦ {app.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedVoucherApp(app)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-indigo-300" />
                    <span>Raqamli Vaucherni ko'rish (QR-kod)</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Digital Voucher Modal */}
      {selectedVoucherApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            
            {/* Close */}
            <button
              onClick={() => setSelectedVoucherApp(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Voucher Header with Watermark */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-6 relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-200">
                  Rasmiy Raqamli Vaucher
                </span>
              </div>
              <h3 className="text-xl font-black">{selectedVoucherApp.universityName}</h3>
              <p className="text-xs text-indigo-200 mt-1">{selectedVoucherApp.programName}</p>
            </div>

            {/* Voucher Body */}
            <div className="p-6 space-y-6 text-center">
              
              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 inline-block">
                <QRCodeSVG
                  value={`https://unigoh.uz/verify?appId=${selectedVoucherApp.id}&pinfl=${selectedVoucherApp.applicantPinfl}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
                <p className="mt-2 font-mono text-xs font-bold text-slate-800 tracking-wider">
                  {selectedVoucherApp.id}
                </p>
              </div>

              {/* Verified Applicant Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Abituriyent:</span>
                  <span className="font-bold text-slate-900">{selectedVoucherApp.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">JSHSHIR (PINFL):</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVoucherApp.applicantPinfl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefon:</span>
                  <span className="font-semibold text-slate-900">{selectedVoucherApp.applicantPhone}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 border-slate-200">
                  <span className="text-slate-500">Ariza holati:</span>
                  <span className="font-bold text-emerald-600">Tasdiqlangan / Ko'rib chiqilmoqda</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ushbu vaucher OTM qabul komissiyasi yoki kirish imtihonida talaba shaxsini va ariza huquqini tasdiqlovchi rasmiy elektron hujjat hisoblanadi.
              </p>

              {/* Print / Save button */}
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Vaucherni chop etish / PDF saqlash</span>
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
