import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, MessageSquare, PartyPopper } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const STEPS = [
  { value: 'NEW', label: 'Yuborildi' },
  { value: 'DOCS_REVIEW', label: 'Hujjatlar tekshiruvda' },
  { value: 'EXAM', label: 'Imtihon' },
  { value: 'ADMITTED', label: 'Qabul qilindi' },
  { value: 'CONTRACT', label: 'Shartnoma' },
  { value: 'ENROLLED', label: "O'qishga kirdi" },
];
const ENDED = { REJECTED: 'Rad etildi', WITHDRAWN: 'Voz kechildi' };

const when = (d) =>
  new Date(d).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function MyApplications({ session, onBrowse }) {
  const [apps, setApps] = useState([]);
  const [unis, setUnis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a, error }, { data: u }] = await Promise.all([
      supabase.from('applications').select('*').eq('student_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('universities').select('id, name'),
    ]);
    if (error) setError(error.message);
    setApps(a || []);
    setUnis(Object.fromEntries((u || []).map((x) => [x.id, x.name])));
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { load(); }, [load]);

  async function update(id, patch, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError('');
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    if (error) setError(error.message);
    load();
  }

  if (loading) return <p className="text-center text-slate-500 py-10">Yuklanmoqda...</p>;

  if (apps.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-brand-100 p-10 text-center">
        <p className="text-lg text-slate-700">Hali ariza topshirmagansiz.</p>
        <button onClick={onBrowse} className="mt-5 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white text-base font-semibold rounded-2xl">
          Universitet tanlash
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {apps.map((a) => {
        const idx = STEPS.findIndex((s) => s.value === a.status);
        const ended = ENDED[a.status];
        const canClaim = ['ADMITTED', 'CONTRACT', 'ENROLLED'].includes(a.status) && !a.student_enrolled_claim;
        const canWithdraw = ['NEW', 'DOCS_REVIEW', 'EXAM'].includes(a.status);

        return (
          <article key={a.id} className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-500">{a.code}</p>
                <h2 className="text-xl font-bold text-brand-900">{unis[a.university_id] || a.university_id}</h2>
                <p className="text-slate-600">{a.program_name}</p>
              </div>
              <p className="text-sm text-slate-500">{when(a.created_at)}</p>
            </div>

            {ended ? (
              <p className="mt-5 inline-flex px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">{ended}</p>
            ) : (
              <ol className="mt-6 grid grid-cols-6 gap-1.5" aria-label="Ariza bosqichlari">
                {STEPS.map((s, i) => (
                  <li key={s.value} className="flex flex-col gap-2">
                    <span className={`h-2 rounded-full ${i <= idx ? (s.value === 'ENROLLED' ? 'bg-apricot-500' : 'bg-brand-700') : 'bg-brand-100'}`} />
                    <span className={`text-[11px] sm:text-xs leading-tight ${i === idx ? 'font-bold text-brand-900' : 'text-slate-500'}`}>{s.label}</span>
                  </li>
                ))}
              </ol>
            )}

            {a.exam_date && (
              <p className="mt-5 flex items-center gap-2 p-3.5 rounded-2xl bg-brand-50 text-brand-900 font-semibold">
                <CalendarDays className="w-5 h-5 shrink-0" /> Imtihon: {when(a.exam_date)}
              </p>
            )}
            {a.note && (
              <p className="mt-3 flex items-start gap-2 p-3.5 rounded-2xl bg-cream border border-apricot-100 text-slate-800">
                <MessageSquare className="w-5 h-5 shrink-0 text-apricot-600" /> {a.note}
              </p>
            )}

            {a.student_enrolled_claim && (
              <p className="mt-4 flex items-center gap-2 text-emerald-700 font-semibold">
                <PartyPopper className="w-5 h-5" /> Tabriklaymiz! O'qishga kirganingizni tasdiqladingiz.
              </p>
            )}

            {(canClaim || canWithdraw) && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                {canClaim && (
                  <button
                    onClick={() => update(a.id, { student_enrolled_claim: true }, "Shartnoma bo'yicha to'lov qilib, o'qishga kirganingizni tasdiqlaysizmi?")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-apricot-500 hover:bg-apricot-600 text-brand-950 font-semibold rounded-2xl"
                  >
                    <CheckCircle2 className="w-5 h-5" /> O'qishga kirdim
                  </button>
                )}
                {canWithdraw && (
                  <button
                    onClick={() => update(a.id, { status: 'WITHDRAWN' }, 'Arizadan voz kechmoqchimisiz? Buni ortga qaytarib bo\'lmaydi.')}
                    className="px-5 py-3 text-slate-600 hover:text-red-600 font-semibold rounded-2xl"
                  >
                    Arizadan voz kechish
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
