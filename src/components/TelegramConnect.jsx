import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang } from '../i18n';

export default function TelegramConnect({ chatId, onChange }) {
  const { t } = useLang();
  const [state, setState] = useState('idle'); // idle | loading | link | soon
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  async function connect() {
    setError('');
    setState('loading');
    const { data, error } = await supabase.rpc('telegram_link_code');
    if (error) { setState('idle'); setError(error.message); return; }
    if (!data?.configured) { setState('soon'); return; }
    const url = `https://t.me/${data.bot}?start=${data.code}`;
    setLink(url);
    setState('link');
    window.open(url, '_blank', 'noopener');
  }

  async function disconnect() {
    await supabase.rpc('telegram_unlink');
    onChange?.();
  }

  if (chatId) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-base font-semibold text-emerald-700">
          <CheckCircle2 className="w-5 h-5" /> {t('tg.connected')}
        </p>
        <button onClick={disconnect} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 rounded-xl">{t('tg.disconnect')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-600">{t('tg.desc')}</p>
      {state === 'soon' ? (
        <p className="p-3.5 rounded-xl bg-cream border border-apricot-100 text-slate-700">{t('tg.soon')}</p>
      ) : state === 'link' ? (
        <div className="space-y-3">
          <p className="text-base text-slate-700">{t('tg.open')}</p>
          <div className="flex flex-wrap gap-3">
            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl">{t('tg.openBot')}</a>
            <button onClick={onChange} className="px-5 py-2.5 bg-white border-2 border-brand-100 hover:border-brand-300 text-brand-800 font-semibold rounded-xl">{t('tg.refresh')}</button>
          </div>
        </div>
      ) : (
        <button onClick={connect} disabled={state === 'loading'} className="inline-flex items-center px-5 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl disabled:opacity-60">
          {state === 'loading' ? t('tg.connecting') : t('tg.connect')}
        </button>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
