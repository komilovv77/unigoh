import React from 'react';
import { User, Building2, Send, ArrowRight, Award } from 'lucide-react';
import { LogoMark } from './Logo';

const steps = [
  {
    icon: User,
    title: "Profil to'ldiring",
    text: "Ma'lumot va hujjatlaringizni bir marta kiritasiz.",
  },
  {
    icon: Building2,
    title: 'Universitet tanlang',
    text: "Narx, grant va reytinglarni yonma-yon solishtiring.",
  },
  {
    icon: Send,
    title: 'Ariza topshiring',
    text: "Bir tugma bilan yuborasiz va natijani shu yerda kuzatasiz.",
  },
];

export default function Landing({ onStart }) {
  return (
    <div>
      {/* Hook */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
          <div>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-brand-900 tracking-tight leading-[1.1]">
              Bitta ariza —<br />
              <span className="text-apricot-500">barcha universitetlar.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-700 leading-relaxed max-w-xl">
              Har bir universitetga alohida borish shart emas. Profilingizni bir marta to'ldiring
              va uydan turib istalgan nodavlat universitetga hujjat topshiring.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-brand-800 hover:bg-brand-900 text-white text-lg font-semibold rounded-2xl transition"
              >
                Boshlash
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#qanday"
                className="inline-flex items-center justify-center px-7 py-4 text-lg font-semibold text-brand-800 bg-white border-2 border-brand-100 hover:border-brand-300 rounded-2xl transition"
              >
                Qanday ishlaydi?
              </a>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-base text-slate-700">
              <Award className="w-5 h-5 text-apricot-600 shrink-0" />
              Grantlar ham shu yerda — 100% gacha.
            </p>
          </div>

          {/* Darvoza belgisi */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2.5rem] bg-apricot-200" aria-hidden="true" />
              <LogoMark className="relative w-72 h-72" />
            </div>
          </div>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section id="qanday" className="bg-white border-y border-brand-100 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-900 tracking-tight">
            3 qadamda talaba bo'ling
          </h2>

          <ol className="mt-10 grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="p-6 rounded-2xl bg-cream border border-apricot-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-800 text-white">
                    <s.icon className="w-6 h-6" />
                  </span>
                  <span className="text-sm font-bold text-apricot-700">{i + 1}-qadam</span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-brand-900">{s.title}</h3>
                <p className="mt-2 text-lg text-slate-700 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 px-7 py-4 bg-apricot-500 hover:bg-apricot-600 text-brand-950 text-lg font-semibold rounded-2xl transition"
            >
              Profil ochish
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Hikoya */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-600">
        <p className="text-base">
          <span className="font-semibold text-brand-800">Vodiydan boshlandi</span> — butun O'rta Osiyo yoshlari uchun.
        </p>
        <p className="text-sm">© {new Date().getFullYear()} UniGoh</p>
      </footer>
    </div>
  );
}
