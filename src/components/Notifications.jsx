import React from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, formatDate, notificationText } from '../i18n';

export default function Notifications({ items, onChange }) {
  const { t, lang } = useLang();
  const unread = items.filter((n) => !n.read_at);

  async function markAll() {
    if (!unread.length) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread.map((n) => n.id));
    onChange();
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-3xl border border-brand-100 p-10 text-center">
        <Bell className="w-8 h-8 mx-auto text-brand-300" />
        <p className="mt-3 text-lg text-slate-700">{t('notif.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <button onClick={markAll} className="text-sm font-semibold text-brand-700 hover:text-brand-900">{t('notif.markAll')}</button>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className={`p-4 sm:p-5 rounded-2xl border ${n.read_at ? 'bg-white border-brand-100' : 'bg-brand-50 border-brand-200'}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${n.read_at ? 'bg-brand-100' : 'bg-apricot-500'}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-base text-slate-900">{notificationText(n, t)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(n.created_at, lang)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
