import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n';

// Contact address (email or phone); shown on the page when set
const CONTACT = '';
const UPDATED = '31.10.2026';

const CONTENT = {
  uz: {
    title: 'Maxfiylik siyosati va foydalanish shartlari',
    updated: 'Oxirgi yangilanish',
    contact: 'Murojaat uchun',
    sections: [
      ['1. Biz qaysi ma\'lumotlarni yig\'amiz', [
        'Ro\'yxatdan o\'tganingizda va profilingizni to\'ldirganingizda quyidagilarni saqlaymiz:',
        ['email manzilingiz va parolingiz (parol shifrlangan holda saqlanadi, uni hech kim, jumladan biz ham ko\'ra olmaymiz);',
         'ism va familiya, telefon raqami, viloyat yoki shahar;',
         'maktab, litsey yoki kollej nomi, imtihon ballari, til va fan sertifikatlari;',
         'siz yuklagan hujjatlar (pasport yoki ID karta, attestat, sertifikatlar, portfolio);',
         'UniGoh bilan shartnomaga qo\'ygan elektron imzongiz;',
         'arizalaringiz: qaysi universitet va yo\'nalishga, qachon topshirilgani va holati;',
         ],
      ]],
      ['2. Ma\'lumotlardan nima uchun foydalanamiz', [
        ['siz tanlagan universitetga arizangizni yetkazish;',
         'ariza holati, suhbat yoki imtihon sanasi va universitet xabarlarini sizga saytda va SMS orqali yetkazish;',
         'akkauntingiz xavfsizligini ta\'minlash va parolni tiklash;',
         'xizmatni yaxshilash uchun umumlashtirilgan (ismsiz) statistika.'],
        'Ma\'lumotlaringizni reklama uchun sotmaymiz va uchinchi shaxslarga bermaymiz.',
      ]],
      ['3. Ma\'lumotlaringizni kim ko\'radi', [
        ['Siz: o\'z profilingiz, hujjatlaringiz va arizalaringizni.',
         'Siz ariza bergan universitet: faqat o\'ziga topshirilgan arizalar va ular bilan bog\'liq profilingiz hamda hujjatlaringizni. Telefon raqamingiz va emailingiz universitetga faqat siz qabul taklifiga rozilik berganingizdan keyin ochiladi. Boshqa universitetlar ma\'lumotlaringizni ko\'rmaydi.',
         'UniGoh administratorlari: arizalarni kuzatish va muammolarni hal qilish uchun.'],
      ]],
      ['4. Ma\'lumotlar qayerda saqlanadi', [
        'Ma\'lumotlar Supabase xizmatining serverlarida (Janubiy Koreya, Seul) saqlanadi, sayt esa Vercel orqali tarqatiladi. Ulanishlar shifrlangan (HTTPS). Hujjatlar yopiq omborda turadi va faqat qisqa muddatli havola orqali ochiladi. Kim qaysi ma\'lumotni ko\'ra olishi bazaning o\'zida qoidalar bilan cheklangan.',
      ]],
      ['5. Qancha muddat saqlaymiz', [
        'Akkauntingiz faol ekan, ma\'lumotlaringiz saqlanadi. Akkauntni o\'chirishni so\'rasangiz, profil va hujjatlaringiz o\'chiriladi; imzolangan shartnoma va qonun talab qiladigan yozuvlar bundan mustasno.',
      ]],
      ['6. Sizning huquqlaringiz', [
        ['o\'z ma\'lumotlaringizni ko\'rish va kabinetda tuzatish;',
         'arizadan voz kechish;',
         'akkaunt va ma\'lumotlaringizni o\'chirishni so\'rash;',
         'ma\'lumotlarni qayta ishlashga bergan roziligingizni qaytarib olish.'],
      ]],
      ['7. Foydalanish shartlari', [
        ['Profilda faqat o\'zingiz haqingizda to\'g\'ri ma\'lumot kiriting. Soxta hujjat yoki ma\'lumot aniqlansa, akkaunt to\'xtatiladi.',
         'UniGoh arizangizni universitetga yetkazadi, lekin qabul qilish to\'g\'risidagi qarorni universitet qabul qiladi. Biz qabulni yoki grantni kafolatlamaymiz.',
         'Universitet narxlari, grantlari va muddatlari universitetlar tomonidan beriladi va o\'zgarishi mumkin. Shartnoma imzolashdan oldin ularni universitetning o\'zida tasdiqlang.',
         'Akkauntingiz parolini boshqalarga bermang. Akkaunt orqali qilingan harakatlar uchun o\'zingiz javobgarsiz.'],
      ]],
      ['8. O\'zgarishlar', [
        'Siyosat o\'zgarsa, shu sahifada yangilanish sanasi bilan e\'lon qilamiz. Muhim o\'zgarishlar haqida emailingizga ham xabar beramiz.',
      ]],
    ],
  },
  ru: {
    title: 'Политика конфиденциальности и условия использования',
    updated: 'Последнее обновление',
    contact: 'Для обращений',
    sections: [
      ['1. Какие данные мы собираем', [
        'При регистрации и заполнении профиля мы сохраняем:',
        ['ваш email и пароль (пароль хранится в зашифрованном виде, его не видит никто, включая нас);',
         'имя и фамилию, номер телефона, область или город;',
         'название школы, лицея или колледжа, баллы экзаменов, языковые и предметные сертификаты;',
         'загруженные вами документы (паспорт или ID-карта, аттестат, сертификаты, портфолио);',
         'вашу электронную подпись под договором с UniGoh;',
         'ваши заявки: в какой университет и на какое направление, когда поданы и их статус;',
         ],
      ]],
      ['2. Зачем мы используем данные', [
        ['чтобы направить вашу заявку в выбранный вами университет;',
         'чтобы сообщать вам о статусе заявки, датах собеседований и экзаменов и сообщениях университета на сайте и по SMS;',
         'чтобы обеспечивать безопасность аккаунта и восстанавливать пароль;',
         'для обобщённой (обезличенной) статистики, чтобы улучшать сервис.'],
        'Мы не продаём ваши данные для рекламы и не передаём их третьим лицам.',
      ]],
      ['3. Кто видит ваши данные', [
        ['Вы: свой профиль, документы и заявки.',
         'Университет, в который вы подали заявку: только заявки, поданные в этот университет, а также связанные с ними профиль и документы. Ваш телефон и email университет увидит только после того, как вы дадите согласие на предложение о зачислении. Другие университеты ваши данные не видят.',
         'Администраторы UniGoh: чтобы следить за заявками и решать проблемы.'],
      ]],
      ['4. Где хранятся данные', [
        'Данные хранятся на серверах Supabase (Южная Корея, Сеул), сайт работает через Vercel. Соединения зашифрованы (HTTPS). Документы лежат в закрытом хранилище и открываются только по временной ссылке. Кто какие данные видит, ограничено правилами в самой базе данных.',
      ]],
      ['5. Как долго мы храним данные', [
        'Данные хранятся, пока ваш аккаунт активен. Если вы попросите удалить аккаунт, профиль и документы будут удалены, за исключением подписанного договора и записей, хранение которых требует закон.',
      ]],
      ['6. Ваши права', [
        ['просматривать и исправлять свои данные в кабинете;',
         'отозвать заявку;',
         'потребовать удаления аккаунта и данных;',
         'отозвать согласие на обработку данных.'],
      ]],
      ['7. Условия использования', [
        ['Указывайте в профиле только достоверные сведения о себе. Если обнаружатся поддельные документы или данные, аккаунт будет заблокирован.',
         'UniGoh направляет вашу заявку в университет, но решение о зачислении принимает университет. Мы не гарантируем поступление или грант.',
         'Стоимость, гранты и сроки указывают университеты, и они могут меняться. Перед подписанием договора уточните их в самом университете.',
         'Не передавайте пароль от аккаунта другим людям. Вы несёте ответственность за действия, совершённые через ваш аккаунт.'],
      ]],
      ['8. Изменения', [
        'При изменении политики мы опубликуем её на этой странице с датой обновления. О существенных изменениях также сообщим по email.',
      ]],
    ],
  },
};

export default function Privacy() {
  const { lang, t } = useLang();
  const c = CONTENT[lang] || CONTENT.uz;
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
        <ArrowLeft className="w-4 h-4" /> {t('privacy.back')}
      </a>
      <article className="mt-6 bg-white rounded-3xl border border-brand-100 p-6 sm:p-10 text-slate-800 leading-relaxed">
        <h1 className="text-3xl font-extrabold text-brand-900 tracking-tight">{c.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{c.updated}: {UPDATED}</p>
        {c.sections.map(([title, parts]) => (
          <section key={title} className="mt-8 space-y-3">
            <h2 className="text-xl font-bold text-brand-900">{title}</h2>
            {parts.map((p, i) => Array.isArray(p)
              ? <ul key={i} className="list-disc pl-5 space-y-1.5">{p.map((li) => <li key={li}>{li}</li>)}</ul>
              : <p key={i}>{p}</p>)}
          </section>
        ))}
        {CONTACT && <p className="mt-8">{c.contact}: <b>{CONTACT}</b></p>}
      </article>
    </main>
  );
}
