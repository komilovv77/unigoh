import React from 'react';
import { ArrowLeft } from 'lucide-react';

// Murojaat manzili: email yoki Telegram yozilsa, sahifada ko'rinadi
const CONTACT = '';
const UPDATED = '30.10.2026';

export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
        <ArrowLeft className="w-4 h-4" /> Bosh sahifa
      </a>
      <article className="mt-6 bg-white rounded-3xl border border-brand-100 p-6 sm:p-10 text-slate-800 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-brand-900 tracking-tight">Maxfiylik siyosati va foydalanish shartlari</h1>
        <p className="mt-2 text-sm text-slate-500">Oxirgi yangilanish: {UPDATED}</p>

        <Section t="1. Biz qaysi ma'lumotlarni yig'amiz">
          <p>Ro'yxatdan o'tganingizda va profilingizni to'ldirganingizda quyidagilarni saqlaymiz:</p>
          <ul>
            <li>email manzilingiz va parolingiz (parol shifrlangan holda saqlanadi, uni hech kim, jumladan biz ham ko'ra olmaymiz);</li>
            <li>ism va familiya, telefon raqami, viloyat yoki shahar;</li>
            <li>maktab, litsey yoki kollej nomi, imtihon ballari, til va fan sertifikatlari;</li>
            <li>siz yuklagan yoki havolasini bergan hujjatlar (shahodatnoma, sertifikat, portfolio);</li>
            <li>arizalaringiz: qaysi universitet va yo'nalishga, qachon topshirilgani va holati.</li>
          </ul>
        </Section>

        <Section t="2. Ma'lumotlardan nima uchun foydalanamiz">
          <ul>
            <li>siz tanlagan universitetga arizangizni yetkazish;</li>
            <li>ariza holati, imtihon sanasi va universitet izohlarini sizga ko'rsatish;</li>
            <li>akkauntingiz xavfsizligini ta'minlash va parolni tiklash;</li>
            <li>xizmatni yaxshilash uchun umumlashtirilgan (ismsiz) statistika.</li>
          </ul>
          <p>Ma'lumotlaringizni reklama uchun sotmaymiz va uchinchi shaxslarga bermaymiz.</p>
        </Section>

        <Section t="3. Ma'lumotlaringizni kim ko'radi">
          <ul>
            <li><b>Siz</b>: o'z profilingiz va arizalaringizni.</li>
            <li><b>Siz ariza bergan universitet</b>: faqat o'ziga topshirilgan arizalar va shu arizalar bilan bog'liq profilingiz hamda hujjatlaringizni. Boshqa universitetlar ularni ko'rmaydi.</li>
            <li><b>UniGoh administratorlari</b>: arizalarni kuzatish va muammolarni hal qilish uchun.</li>
          </ul>
        </Section>

        <Section t="4. Ma'lumotlar qayerda saqlanadi">
          <p>
            Ma'lumotlar Supabase xizmatining serverlarida (Janubiy Koreya, Seul) saqlanadi, sayt esa Vercel orqali
            tarqatiladi. Ulanishlar shifrlangan (HTTPS). Kim qaysi ma'lumotni ko'ra olishi bazaning o'zida
            qoidalar bilan cheklangan.
          </p>
        </Section>

        <Section t="5. Qancha muddat saqlaymiz">
          <p>Akkauntingiz faol ekan, ma'lumotlaringiz saqlanadi. Akkauntni o'chirishni so'rasangiz, profil va hujjatlaringiz o'chiriladi; universitet bilan tuzilgan shartnoma bo'yicha qonun talab qiladigan yozuvlar bundan mustasno.</p>
        </Section>

        <Section t="6. Sizning huquqlaringiz">
          <ul>
            <li>o'z ma'lumotlaringizni ko'rish va kabinetda tuzatish;</li>
            <li>arizadan voz kechish;</li>
            <li>akkaunt va ma'lumotlaringizni o'chirishni so'rash;</li>
            <li>ma'lumotlarni qayta ishlashga bergan roziligingizni qaytarib olish.</li>
          </ul>
          {CONTACT && <p>Murojaat uchun: <b>{CONTACT}</b></p>}
        </Section>

        <Section t="7. Foydalanish shartlari">
          <ul>
            <li>Profilda faqat o'zingiz haqingizda to'g'ri ma'lumot kiriting. Soxta hujjat yoki ma'lumot aniqlansa, akkaunt to'xtatiladi.</li>
            <li>UniGoh arizangizni universitetga yetkazadi, lekin qabul qilish to'g'risidagi qarorni universitet qabul qiladi. Biz qabulni yoki grantni kafolatlamaymiz.</li>
            <li>Universitet narxlari, grantlari va muddatlari universitetlar tomonidan beriladi va o'zgarishi mumkin. Shartnoma imzolashdan oldin ularni universitetning o'zida tasdiqlang.</li>
            <li>Akkauntingiz parolini boshqalarga bermang. Akkaunt orqali qilingan harakatlar uchun o'zingiz javobgarsiz.</li>
          </ul>
        </Section>

        <Section t="8. O'zgarishlar">
          <p>Siyosat o'zgarsa, shu sahifada yangilanish sanasi bilan e'lon qilamiz. Muhim o'zgarishlar haqida emailingizga ham xabar beramiz.</p>
        </Section>
      </article>
    </main>
  );
}

function Section({ t, children }) {
  return (
    <section className="mt-8 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
      <h2 className="text-xl font-bold text-brand-900">{t}</h2>
      {children}
    </section>
  );
}
