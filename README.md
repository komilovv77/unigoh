# 🎓 UniGoh — Barcha Universitetlar Bir Joyda

> **The "Common App" & EdTech Aggregator for Private Universities in Uzbekistan** (starting with Fergana Valley / Andijan region).

[![React](https://img.shields.io/badge/React-18-blue.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-AES--256%20%7C%20O'RQ--547-emerald.svg)](https://lex.uz)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-komilovv77-indigo.svg)](https://github.com/komilovv77)

---

## 📌 Loyiha Haqida (Overview)

**UniGoh** (`unigoh.uz`) — O'zbekistondagi nodavlat (xususiy) oliy ta'lim muassasalariga kirish jarayonini soddalashtiruvchi markazlashgan ekotizim. AQSHdagi mashhur **"Common App"** tizimi modelida qurilgan ushbu platforma abituriyentlarga bir martalik profil yaratib, bir vaqtning o'zida bir nechta universitetga 1 klik bilan ariza topshirish, grantlarni taqqoslash va rasmiy raqamli vaucherga ega bo'lish imkonini beradi.

---

## 🚀 Asosiy Modullar (Core Modules)

### 1. 🎓 Abituriyent Portali (Student Side)
* **Yagona Profil (Common App)**: F.I.SH, JSHSHIR (14 xonali PINFL), telefon raqami va hudud ma'lumotlarini bir marta kiritish kifoya.
* **Hujjatlar Sandig'i & AI/OCR**: Pasport/ID karta va Maktab attestatini yuklash hamda AI yordamida avtomatik tekshiruv (aniqlik darajasi 99.4%).
* **Reyting va Taqqoslash**: QS Stars va milliy reyting, kontrakt narxlari (12.5 mln - 32 mln so'm), ta'lim tillari (UZ/RU/EN) va mavjud grantlar bo'yicha saralash.
* **1-Klikda Ariza topshirish**: Istalgan OTM va yo'nalishni tanlab bir vaqtning o'zida ariza yuborish.
* **Raqamli Vaucher (QR-kod)**: Har bir arizaga noyob **Attribution ID** (masalan, `UNIGOH-2026-ISFT-0894`) va rasmiy QR-kod beriladi.

### 2. 🏢 Universitet B2B CRM Paneli (University Admin)
* **Lidlar Boshqaruvi**: UniGoh platformasi orqali kelib tushgan arizalar ro'yxati va holati.
* **Status Switcher**: Talaba holatini o'zgartirish (*Kutilmoqda ➔ Hujjatlar ko'rilmoqda ➔ Qabul qilindi / Imtihon belgilandi ➔ Shartnoma to'landi*).
* **Excel / CSV Eksport**: Qabul komissiyasi hisoboti uchun arizalarni bir zumda yuklab olish.
* **Konversiya Ko'rsatkichlari**: Qabul qilinganlik ulushi va statistikalar.

### 3. ⚡ Master Admin & Audit Moduli (Founder / Operator Side)
* **OTMlar Boshqaruvi & Tariflar**:
  * **Paket A (Standard)**: 3,000,000 UZS / oyiga
  * **Paket B (Premium)**: 8,000,000 UZS / oyiga + VIP joylashtirish va komissiya
* **Revenue Dashboard**: Oylik obuna tushumi (MRR) va muvaffaqiyatli talabalar uchun komissiya tushumlari tahlili.
* **Audit Call Moduli (Anti-Bypass Protection)**: Universitetlar tomonidan "To'lamadi / Rad etildi" deb belgilangan talabalarni tekshirib, OTM platformani chetlab o'tishining oldini oluvchi nazorat moduli.

### 4. 🤖 24/7 AI Maslahatchi (Uzbek Language)
* O'zbek tilidagi sun'iy intellekt yordamchisi.
* Vodiydagi OTMlar (ISFT Andijon, AIPI, Qo'qon Universiteti, EMU) va Toshkent universitetlari, grantlar hamda kontraktlar bo'yicha abituriyentlarga 24/7 yordam beradi.

---

## 🔒 Xavfsizlik va Qonuniylik (Security & Compliance)

* **AES-256 Shifrlash**: Talabalarning barcha hujjatlari va identifikatsiya ma'lumotlari xavfsiz shifrlanadi.
* **O'RQ-547 Qonuni**: O'zbekiston Respublikasining *"Shaxsiy ma'lumotlar to'g'risida"*gi Qonuniga to'liq muvofiq ishlab chiqilgan.
* **JSHSHIR (PINFL)**: 14 xonali noyob raqam faqat ruxsat etilgan OTM qabul komissiyasiga xavfsiz kanallar orqali taqdim etiladi.

---

## 🛠 Texnologiyalar (Tech Stack)

* **Frontend**: React 18, Vite 6, Tailwind CSS 3.4
* **Ikonkalar**: Lucide React
* **QR Generator**: `qrcode.react` (SVG High Error Correction)
* **Backend arxitekturasi**: Supabase (PostgreSQL, Row Level Security) / Node.js
* **AI & OCR**: OpenAI GPT-4o-mini / Vision OCR Engine integratsiyasiga moslashtirilgan

---

## 💻 Loyihani Ishga Tushirish (Getting Started)

### 1. Repozitoriyni klonlash:
```bash
git clone https://github.com/komilovv77/unigoh.git
cd unigoh
```

### 2. Bog'liqliklarni o'rnatish:
```bash
npm install
```

### 3. Dasturni ishga tushirish (Local Dev Server):
```bash
npm run dev
```
Dastur brauzerda ochiladi: `http://localhost:3000`

### 4. Ishlab chiqarish (Production Build):
```bash
npm run build
```

---

## 👨‍💻 Muallif (Author)

* **Loyiha Asoschisi**: [Abdulloh Komilov (@komilovv77)](https://github.com/komilovv77)
* **Aloqa**: komilovabdulloh2023@gmail.com
* **GitHub**: [github.com/komilovv77](https://github.com/komilovv77)

---

## 📄 Litsenziya

Ushbu loyiha [MIT Litsenziyasi](LICENSE) asosida tarqatiladi.
