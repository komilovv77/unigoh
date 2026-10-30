# UniGoh

O'zbekistondagi nodavlat universitetlarga yagona profil orqali ariza topshirish platformasi. Vodiydan boshlandi.

- **Sayt:** https://unigoh.study
- **Boshqaruv paneli:** alohida repo — [komilovv77/unigoh-admin](https://github.com/komilovv77/unigoh-admin)

## Nima bor

- Bosh sahifa va talaba kabineti: profil, universitetlar va yo'nalishlar, ariza topshirish, ariza holatini kuzatish, "o'qishga kirdim" tasdig'i
- Kirish, ro'yxatdan o'tish, parolni tiklash (Supabase Auth)
- Barcha ma'lumotlar Supabase'da; kim nimani ko'rishi bazadagi RLS qoidalari bilan nazorat qilinadi

## Texnologiyalar

React 18, Vite, Tailwind CSS, Supabase, Vercel.

## Ma'lumotlar bazasi

Sxema `supabase/migrations/` papkasida, ishga tushirish tartibi fayl nomlari bo'yicha:

1. `20261030_admin_crm.sql` — universitetlar, xodimlar, arizalar, tarix, RLS
2. `20261030_seed_universities.sql` — boshlang'ich universitetlar ro'yxati
3. `20261030_b_private_finance.sql` — komissiya va ulush foizini faqat bosh administratorga yopish
4. `20261030_c_performance.sql` — RLS qoidalarini tezlashtirish, indekslar
5. `20261030_d_lockdown.sql` — qoidalar faqat tizimga kirganlarga, funksiyalarga kirishni cheklash
6. `20261030_e_staff_mfa.sql` — xodimlar uchun ikki bosqichli kirish majburiy
7. `20261030_f_documents.sql` — hujjatlar uchun yopiq fayl ombori

Har bir fayl qayta ishga tushirilsa ham xavfsiz.

## Sozlash

Vercel → Settings → Environment Variables (Production va Preview):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   # faqat anon/publishable kalit, service_role HECH QACHON
```

Mahalliy ishga tushirish:

```bash
npm install
npm run dev
```
