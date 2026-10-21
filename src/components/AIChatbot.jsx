import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  User, 
  GraduationCap,
  ShieldAlert
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    sender: 'bot',
    text: "Assalomu alaykum! Men UniGoh sun'iy intellekt maslahatchisiman. Men faqat O'zbekistondagi nodavlat universitetlar, grantlar, kontrakt narxlari, CEFR/IELTS talablari va ariza topshirish bo'yicha barcha savollaringizga yordam beraman.",
    time: "Hozir"
  }
];

const QUICK_PROMPTS = [
  "Andijonda qaysi nodavlat OTMlar bor?",
  "Qaysi OTMda 100% grant yutish mumkin?",
  "CEFR yoki IELTS qanday imtiyoz beradi?",
  "DTM bali bilan qabul qiladimi?",
  "Kontrakt narxlari qancha?"
];

// Strict domain keywords for university education only
const DOMAIN_KEYWORDS = [
  "univer", "otm", "institut", "kollej", "maktab", "bakalavr", "magistr", "sirtqi", "kunduzgi", "kechki",
  "grant", "kontrakt", "to'lov", "tolov", "narx", "fakultet", "yo'nalish", "yonalish", "mutaxassislik",
  "andijon", "farg'ona", "fargona", "namangan", "toshkent", "qo'qon", "qoqon", "samarqand", "vodiy",
  "isft", "aipi", "emu", "nordic", "team", "webster", "inha", "akfa",
  "cefr", "ielts", "toefl", "duolingo", "topik", "sat", "sertifikat", "til", "ingliz",
  "dtm", "imtihon", "test", "bali", "ball", "suhbat",
  "jshshir", "pinfl", "pasport", "attestat", "hujjat", "diplom",
  "ariza", "topshirish", "vaucher", "qr", "unigoh", "qabul", "komissiya",
  "stipendiya", "talaba", "abituriyent", "yotoqxona", "litsenziya", "akkreditatsiya",
  "salom", "assalomu", "qalesiz", "yordam", "rahmat", "ishlash"
];

export default function AIChatbot() {
  const { isChatOpen, setIsChatOpen } = useApp();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isChatOpen) return null;

  const handleSend = (textToSend = null) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // AI Response generation with strict guardrail
    setTimeout(() => {
      const q = query.toLowerCase();

      // Check if question is within UniGoh & University domain
      const isDomainRelated = DOMAIN_KEYWORDS.some(kw => q.includes(kw));

      let reply = "";

      if (!isDomainRelated) {
        // Strict guardrail fallback
        reply = "Kechirasiz, men faqat **UniGoh** platformasi, O'zbekistondagi nodavlat universitetlar, grantlar, kontraktlar, yo'nalishlar, sertifikatlar (CEFR/IELTS) va ariza topshirish bo'yicha ma'lumot bera olaman. Universitetlar bo'yicha qanday savolingiz bor?";
      } else if (q.includes("andijon") || q.includes("vodiy")) {
        reply = "Andijon viloyatida hozirda ISFT Institute (Andijon filiali), Andijon Iqtisodiyot va Pedagogika Instituti (AIPI) hamda European Medical University (EMU) faoliyat yuritmoqda. Farg'onada esa Qo'qon Universiteti mavjud. Barcha ushbu OTMlar Oliy ta'lim vazirligi litsenziyasiga ega va diplomlari davlat namunasida tan olinadi.";
      } else if (q.includes("cefr") || q.includes("ielts") || q.includes("sertifikat") || q.includes("til")) {
        reply = "Ha! UniGoh tizimida barcha milliy CEFR (B1, B2, C1) hamda xalqaro sertifikatlar (IELTS 5.5+, TOEFL, Duolingo, TOPIK, SAT) to'liq qabul qilinadi. CEFR B2 yoki IELTS 5.5+ sertifikati bor talabalarga chet tili imtihonidan maksimal ball beriladi yoki 50-100% grant ajratiladi.";
      } else if (q.includes("dtm") || q.includes("davlat test") || q.includes("ball")) {
        reply = "Albatta! Bilimni Baholash Agentligi (DTM) testida to'plagan balingizni profilingizga kiritishingiz mumkin. Ko'plab nodavlat universitetlar (masalan, ISFT, Qo'qon Universiteti, AIPI) DTM balingiz asosida sizni to'g'ridan-to'g'ri qo'shimcha imtihonsiz qabul qiladi va grant taqdim etadi.";
      } else if (q.includes("grant") || q.includes("bepul")) {
        reply = "UniGoh hamkor OTMlarida 100% gacha rektor va ta'sischi grantlari mavjud! Masalan, ISFT Andijon filialida 150 ta, Qo'qon universitetida 120 ta grant o'rinlari ajratilgan. UniGoh orqali birinchi navbatda grant imtihoniga ro'yxatdan o'tasiz.";
      } else if (q.includes("narx") || q.includes("kontrakt") || q.includes("to'lov") || q.includes("tolov")) {
        reply = "Nodavlat OTMlarda o'rtacha yillik kontrakt to'lovlari yo'nalishga qarab 12.5 mln so'mdan (Pedagogika/Boshlang'ich ta'lim) 32.0 mln so'mgacha (Davolash ishi va Xalqaro biznes) bo'ladi. To'lovni semestr yoki 4 qismga bo'lib to'lash imkoniyati bor.";
      } else if (q.includes("jshshir") || q.includes("pinfl") || q.includes("pasport")) {
        reply = "JSHSHIR (PINFL) — pasportingiz yoki ID kartangiz pastki qismidagi 14 xonali noyob raqam. UniGoh platformasi O'zbekiston Qonunchiligiga (O'RQ-547) muvofiq arizangizni OTM qabul komissiyasiga xavfsiz va aniq yetkazish uchun ushbu raqamdan foydalanadi (AES-256 shifrlangan).";
      } else {
        reply = "UniGoh orqali siz bitta profil bilan bir vaqtning o'zida bir nechta universitetga 1 klikda ariza topshirishingiz mumkin. Arizangiz topshirilgach, rasmiy QR-kodli elektron Vaucher taqdim etiladi.";
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">UniGoh AI Maslahatchi</h3>
            <p className="text-[10px] text-indigo-200 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Faqat Universitetlar bo'yicha maslahat
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(false)}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {m.time}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center space-x-1 p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 w-16">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="p-2 border-t border-slate-100 bg-white overflow-x-auto flex space-x-1.5 text-[11px] whitespace-nowrap">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Universitet, grant, CEFR yoki kontrakt haqida so'rang..."
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
        />
        <button
          onClick={() => handleSend()}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
