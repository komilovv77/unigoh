import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Award, 
  Star, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  Building, 
  Clock, 
  GraduationCap, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function UniversityDetailModal() {
  const { 
    selectedUniversity, 
    setSelectedUniversity, 
    selectedProgram, 
    setSelectedProgram, 
    isApplyModalOpen, 
    setIsApplyModalOpen, 
    submitApplication, 
    studentProfile, 
    setCurrentTab 
  } = useApp();

  const [activeTab, setActiveTab] = useState('programs'); // 'programs' | 'about' | 'grants'
  const [chosenProgramId, setChosenProgramId] = useState(
    selectedProgram ? selectedProgram.id : (selectedUniversity?.programs[0]?.id || '')
  );

  if (!selectedUniversity) return null;

  const currentChosenProgram = selectedUniversity.programs.find(p => p.id === chosenProgramId) || selectedUniversity.programs[0];

  const handleConfirmApplication = () => {
    const appId = submitApplication(selectedUniversity, currentChosenProgram);
    setSelectedUniversity(null);
    setCurrentTab('applications');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedUniversity(null);
            setIsApplyModalOpen(false);
          }}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover Header */}
        <div className="relative h-56 w-full bg-slate-900">
          <img
            src={selectedUniversity.coverImage}
            alt={selectedUniversity.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center space-x-1">
                <Star className="w-3 h-3 fill-current" />
                <span>{selectedUniversity.ranking.qsStars} Stars QS</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-xs font-semibold">
                {selectedUniversity.ranking.accreditationStatus}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{selectedUniversity.fullName}</h2>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1 text-indigo-400 shrink-0" />
              <span>{selectedUniversity.city}</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('programs')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'programs'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bakalavr Yo'nalishlari ({selectedUniversity.programs.length})
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'grants'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Grantlar & Imtiyozlar
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Infratuzilma & Afzalliklar
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {activeTab === 'programs' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Topshirmoqchi bo'lgan fakultetingizni tanlang:
              </p>
              <div className="space-y-2.5">
                {selectedUniversity.programs.map(prog => (
                  <label
                    key={prog.id}
                    onClick={() => setChosenProgramId(prog.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      chosenProgramId === prog.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        chosenProgramId === prog.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {chosenProgramId === prog.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{prog.name}</h4>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                          <span>{prog.degree}</span>
                          <span>•</span>
                          <span>{prog.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-indigo-700">
                        {(prog.tuition / 1000000).toFixed(1)} mln so'm
                      </span>
                      <span className="block text-[10px] text-slate-400">yiliga</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'grants' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <h4 className="font-bold text-sm flex items-center space-x-1.5 mb-1">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Rektor va Ta'sischi Grantlari</span>
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {selectedUniversity.grantOpportunity}. UniGoh platformasi orqali topshirgan abituriyentlar to'g'ridan-to'g'ri grant imtihonlariga birinchi navbatda ro'yxatga olinadi.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Talablar:</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                  <li>Attestat/Diplom o'rtacha bahosi 4.5 dan yuqori bo'lishi.</li>
                  <li>Xorijiy til sertifikatlari (IELTS 5.5+, CEFR B2) uchun qo'shimcha imtiyoz ballari.</li>
                  <li>Maxsus ichki suhbat va test sinovlaridan muvaffaqiyatli o'tish.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedUniversity.shortDescription}
              </p>
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Universitet afzalliklari:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedUniversity.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Student Profile Quick Check (Common App preview) */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Bir martalik Abituriyent Profili (Common App)</span>
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                Topshiruvchi: <strong>{studentProfile.fullName}</strong> | JSHSHIR: <strong>{studentProfile.jshshir}</strong>
              </p>
              <p className="text-[11px] text-emerald-600 font-medium">
                ✓ Pasport va Attestat AI orqali tekshirilgan va ilova qilinadi
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('profile')}
              className="text-xs font-semibold text-indigo-700 underline hover:text-indigo-900 whitespace-nowrap"
            >
              Hujjatlarni tekshirish
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Tanlangan yo'nalish:</span>
            <span className="text-sm font-bold text-slate-800 line-clamp-1">
              {currentChosenProgram.name}
            </span>
          </div>

          <button
            onClick={handleConfirmApplication}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-200 flex items-center space-x-2 transition-all"
          >
            <span>Arizani 1-Klikda Tasdiqlash</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
