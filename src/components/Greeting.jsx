import React, { useEffect, useState } from 'react';
import { Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { useLang } from '../i18n';

// Hour in Uzbekistan time, regardless of the user's location
function tashkentHour() {
  const h = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  return parseInt(h, 10);
}

export function getGreeting(hour = tashkentHour()) {
  if (hour >= 5 && hour < 11) return { key: 'greet.morning', Icon: Sunrise };
  if (hour >= 11 && hour < 17) return { key: 'greet.day', Icon: Sun };
  if (hour >= 17 && hour < 22) return { key: 'greet.evening', Icon: Sunset };
  return { key: 'greet.night', Icon: Moon };
}

export function firstName(fullName, email) {
  const name = (fullName || '').trim().split(/\s+/)[0];
  if (name) return name.charAt(0).toUpperCase() + name.slice(1);
  return email ? email.split('@')[0] : '';
}

export default function Greeting({ name, progress }) {
  const { t } = useLang();
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { key, Icon } = greeting;
  const text = t(key);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-800 text-white p-6 sm:p-8">
      <svg viewBox="0 0 140 140" className="absolute -right-6 -bottom-10 w-56 h-56 opacity-90 pointer-events-none" aria-hidden="true">
        <path d="M38 140 V72 A32 32 0 0 1 102 72 V140" fill="none" stroke="#FEF3C7" strokeOpacity="0.18" strokeWidth="14" strokeLinecap="round" />
        <circle cx="70" cy="92" r="12" fill="#F59E0B" fillOpacity="0.9" />
        <path d="M47 140 L60 112 L70 124 L80 112 L93 140 Z" fill="#FEF3C7" fillOpacity="0.18" />
      </svg>

      <div className="relative max-w-xl">
        <p className="inline-flex items-center gap-2 text-apricot-300 text-base font-semibold">
          <Icon className="w-5 h-5" aria-hidden="true" />
          {text}
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">{name ? `${text}, ${name}!` : `${text}!`}</h1>
        <p className="mt-3 text-lg text-brand-100">{progress >= 100 ? t('greet.full') : t('greet.notFull')}</p>

        {typeof progress === 'number' && (
          <div className="mt-6 max-w-sm">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-brand-100">{t('greet.progress')}</span>
              <span className="text-apricot-300">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-brand-950/50 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-apricot-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
