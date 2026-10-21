export const UNIVERSITIES = [
  {
    id: "isft-andijan",
    code: "ISFT",
    name: "ISFT Institute (Andijon Filiali)",
    fullName: "International School of Finance Technology and Science (Andijon)",
    shortDescription: "Zamonaviy xalqaro moliya, IT va menejment dasturlari. 100% gacha rektor granti mavjud.",
    region: "Andijon",
    city: "Andijon shahri, Bobur shoh ko'chasi, 45-uy",
    ranking: {
      localRank: 1,
      ratingScore: 9.6,
      qsStars: 4,
      accreditationStatus: "Litsenziyalangan (№ 032918)"
    },
    founded: 2021,
    studentCount: 8500,
    tuitionFeeMin: 14000000,
    tuitionFeeMax: 22000000,
    currency: "UZS",
    languages: ["O'zbek", "Ingliz", "Rus"],
    grantOpportunity: "100% gacha rektor granti (150 ta o'rin)",
    applicationDeadline: "2026-08-25",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1562774053-701939374585?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket B (Premium)",
    programs: [
      { id: "isft-it", name: "Dasturiy injiniring va Sun'iy intellekt", degree: "Bakalavr", duration: "4 yil", tuition: 18000000 },
      { id: "isft-fin", name: "Xalqaro moliya va Buxgalteriya (ACCA)", degree: "Bakalavr", duration: "4 yil", tuition: 17000000 },
      { id: "isft-ped", name: "Boshlang'ich ta'lim va Xorijiy til", degree: "Bakalavr", duration: "4 yil", tuition: 14500000 },
      { id: "isft-mng", name: "Xalqaro biznes menejmenti", degree: "Bakalavr", duration: "4 yil", tuition: 16500000 }
    ],
    features: [
      "ACCA xalqaro akkreditatsiyasi",
      "Zamonaviy kovorking va IT laboratoriya",
      "2+2 xalqaro diplom dasturlari (Buyuk Britaniya)",
      "Yotoqxona bilan ta'minlangan"
    ]
  },
  {
    id: "aipi-andijan",
    code: "AIPI",
    name: "Andijon Iqtisodiyot va Pedagogika Instituti",
    fullName: "Andijon Iqtisodiyot va Pedagogika Instituti (Nodavlat OTM)",
    shortDescription: "Vodiy yoshlari uchun sifatli pedagogik, filologik va iqtisodiy ta'lim maskani.",
    region: "Andijon",
    city: "Andijon shahri, Nayman MFY",
    ranking: {
      localRank: 2,
      ratingScore: 9.2,
      qsStars: 3,
      accreditationStatus: "Litsenziyalangan (№ 044120)"
    },
    founded: 2022,
    studentCount: 4200,
    tuitionFeeMin: 12500000,
    tuitionFeeMax: 16000000,
    currency: "UZS",
    languages: ["O'zbek", "Rus"],
    grantOpportunity: "Davlat va rektor grantlari (80 ta o'rin)",
    applicationDeadline: "2026-08-30",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket A (Standard)",
    programs: [
      { id: "aipi-ped", name: "Boshlang'ich ta'lim metodikasi", degree: "Bakalavr", duration: "4 yil", tuition: 12500000 },
      { id: "aipi-fil", name: "Ingliz tili va adabiyoti", degree: "Bakalavr", duration: "4 yil", tuition: 13500000 },
      { id: "aipi-bank", name: "Bank ishi va audit", degree: "Bakalavr", duration: "4 yil", tuition: 14000000 },
      { id: "aipi-maktab", name: "Maktabgacha ta'lim", degree: "Bakalavr", duration: "4 yil", tuition: 12000000 }
    ],
    features: [
      "Malakali xalqaro o'qituvchilar tarkibi",
      "Kutubxona va kompyuter markazi",
      "Kechki va sirtqi ta'lim shakllari",
      "Diplom davlat namunasida tan olinadi"
    ]
  },
  {
    id: "kokand-uni",
    code: "KU",
    name: "Qo'qon Universiteti",
    fullName: "Qo'qon Universiteti (Nodavlat)",
    shortDescription: "Farg'ona vodiysidagi birinchi nodavlat oliy ta'lim muassasasi. Innovatsion ta'lim klasteri.",
    region: "Farg'ona",
    city: "Qo'qon shahri, Turon ko'chasi, 23",
    ranking: {
      localRank: 3,
      ratingScore: 9.4,
      qsStars: 4,
      accreditationStatus: "Litsenziyalangan (№ 010245)"
    },
    founded: 2019,
    studentCount: 7800,
    tuitionFeeMin: 13500000,
    tuitionFeeMax: 20000000,
    currency: "UZS",
    languages: ["O'zbek", "Ingliz", "Rus"],
    grantOpportunity: "100% to'liq grantlar va xomiylik stipendiyalari (120 o'rin)",
    applicationDeadline: "2026-08-20",
    logo: "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket B (Premium)",
    programs: [
      { id: "ku-turizm", name: "Xalqaro turizm va mehmonxona boshqaruvi", degree: "Bakalavr", duration: "4 yil", tuition: 14500000 },
      { id: "ku-it", name: "Axborot tizimlari va texnologiyalari", degree: "Bakalavr", duration: "4 yil", tuition: 17500000 },
      { id: "ku-moliya", name: "Iqtisodiyot va moliya", degree: "Bakalavr", duration: "4 yil", tuition: 15500000 },
      { id: "ku-ling", name: "Amaliy filologiya (Ingliz/Koreys tili)", degree: "Bakalavr", duration: "4 yil", tuition: 15000000 }
    ],
    features: [
      "Turkiya va Malayziya OTMlari bilan hamkorlik",
      "Zamonaviy SMART-auditoriyalar",
      "Universitet innovatsion inkubatori",
      "Stajirovka va ishga joylashtirish kafolati"
    ]
  },
  {
    id: "nordic-uni",
    code: "NIU",
    name: "Nordic International University",
    fullName: "Nordic Xalqaro Universiteti",
    shortDescription: "Finlandiya va Skandinaviya ta'lim tajribasi asosida qurilgan yetakchi xalqaro universitet.",
    region: "Toshkent",
    city: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi",
    ranking: {
      localRank: 4,
      ratingScore: 9.7,
      qsStars: 5,
      accreditationStatus: "Litsenziyalangan (№ 024512)"
    },
    founded: 2022,
    studentCount: 6500,
    tuitionFeeMin: 18000000,
    tuitionFeeMax: 29000000,
    currency: "UZS",
    languages: ["Ingliz", "O'zbek", "Rus"],
    grantOpportunity: "Finlandiya elchixonasi va rektor grantlari (100 ta o'rin)",
    applicationDeadline: "2026-08-15",
    logo: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket B (Premium)",
    programs: [
      { id: "niu-biz", name: "International Business & Logistics", degree: "Bakalavr", duration: "4 yil", tuition: 24000000 },
      { id: "niu-ai", name: "Computer Science & Data Analytics", degree: "Bakalavr", duration: "4 yil", tuition: 26000000 },
      { id: "niu-fin", name: "Finance & Fintech", degree: "Bakalavr", duration: "4 yil", tuition: 23000000 }
    ],
    features: [
      "Finlyandiyaning HAMK va Karelia universitetlari bilan 2+2 diplomi",
      "100% ingliz tilidagi fanlar xorijlik professorlar bilan",
      "Yevropa Ittifoqida pullik stajirovkalar",
      "Karyera markazi orqali top kompaniyalarga ishga joylashish"
    ]
  },
  {
    id: "emu-university",
    code: "EMU",
    name: "European Medical University (EMU)",
    fullName: "Yevropa Tibbiyot Universiteti",
    shortDescription: "Xalqaro standartdagi yuqori malakali shifokorlar va farmatsevtlarni tayyorlovchi tibbiy OTM.",
    region: "Andijon",
    city: "Andijon shahri, Milliy Tiklanish ko'chasi",
    ranking: {
      localRank: 5,
      ratingScore: 9.3,
      qsStars: 4,
      accreditationStatus: "Litsenziyalangan (№ 018974)"
    },
    founded: 2021,
    studentCount: 3800,
    tuitionFeeMin: 22000000,
    tuitionFeeMax: 36000000,
    currency: "UZS",
    languages: ["O'zbek", "Rus", "Ingliz"],
    grantOpportunity: "Iqtidorli talabalar uchun 50 ta grant",
    applicationDeadline: "2026-08-10",
    logo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket A (Standard)",
    programs: [
      { id: "emu-davolash", name: "Davolash ishi (General Medicine)", degree: "Bakalavr", duration: "6 yil", tuition: 32000000 },
      { id: "emu-stomat", name: "Stomatologiya (Dentistry)", degree: "Bakalavr", duration: "5 yil", tuition: 30000000 },
      { id: "emu-farm", name: "Farmatsiya (Pharmacy)", degree: "Bakalavr", duration: "5 yil", tuition: 24000000 }
    ],
    features: [
      "Eng so'nggi simulyatsion klinika va laboratoriyalar",
      "Yevropa va Turkiya klinikalari bilan amaliyot almashinuvi",
      "USMLE va PLAB xalqaro imtihonlariga tayyorlov"
    ]
  },
  {
    id: "team-university",
    code: "TEAM",
    name: "TEAM University",
    fullName: "TEAM Tadbirkorlik Universiteti",
    shortDescription: "Tadbirkorlik, innovatsiyalar va raqamli iqtisodiyotga ixtisoslashgan birinchi tadbirkorlik universiteti.",
    region: "Toshkent",
    city: "Toshkent shahri, Yashnobod tumani",
    ranking: {
      localRank: 6,
      ratingScore: 9.5,
      qsStars: 4,
      accreditationStatus: "Litsenziyalangan (№ 039912)"
    },
    founded: 2020,
    studentCount: 2900,
    tuitionFeeMin: 21000000,
    tuitionFeeMax: 32000000,
    currency: "UZS",
    languages: ["Ingliz", "O'zbek"],
    grantOpportunity: "Tadbirkorlik grantlari (75 ta grant)",
    applicationDeadline: "2026-08-28",
    logo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150&auto=format&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80",
    tariffTier: "Paket B (Premium)",
    programs: [
      { id: "team-ent", name: "Entrepreneurship & Innovation", degree: "Bakalavr", duration: "3 yil (UK)", tuition: 28000000 },
      { id: "team-mkt", name: "Digital Marketing & Brand Strategy", degree: "Bakalavr", duration: "3 yil (UK)", tuition: 26000000 },
      { id: "team-fin", name: "Applied Finance & Venture Capital", degree: "Bakalavr", duration: "3 yil (UK)", tuition: 27000000 }
    ],
    features: [
      "LSBU (London South Bank University) akkreditatsiyasi",
      "O'z startapingizni yaratish uchun grantlar fondi",
      "Real biznes keyslar va yetakchi tadbirkorlar darslari"
    ]
  }
];

export const REGIONS = ["Barchasi", "Andijon", "Farg'ona", "Namangan", "Toshkent"];

export const FACULTIES = [
  "Barchasi",
  "IT va Sun'iy intellekt",
  "Iqtisodiyot va Moliya",
  "Pedagogika va Filologiya",
  "Tibbiyot va Farmatsiya",
  "Biznes va Menejment"
];

export const APPLICATION_STATUSES = {
  PENDING: { label: "Kutilmoqda", badgeClass: "bg-amber-100 text-amber-800 border-amber-300" },
  IN_REVIEW: { label: "Hujjatlar ko'rilmoqda", badgeClass: "bg-blue-100 text-blue-800 border-blue-300" },
  EXAM_SCHEDULED: { label: "Imtihon / Suhbat belgilandi", badgeClass: "bg-purple-100 text-purple-800 border-purple-300" },
  APPROVED: { label: "Qabul qilindi / Tavsiya etildi", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  CONTRACT_ISSUED: { label: "Shartnoma chiqarildi (To'langan)", badgeClass: "bg-green-100 text-green-800 border-green-300" },
  REJECTED: { label: "Rad etildi", badgeClass: "bg-rose-100 text-rose-800 border-rose-300" }
};
