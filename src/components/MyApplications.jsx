import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, MessageSquare, PartyPopper } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, loc, formatDate } from '../i18n';
import { AgreementStatus } from './Agreement';

const STEPS = ['NEW', 'SENT', 'DOCS_REVIEW', 'EXAM', 'ADMITTED', 'CONTRACT', 'ENROLLED'];
const ENDED = ['REJECTED', 'WITHDRAWN'];

export default function MyApplications({ session, agreement, onBrowse }) {
  const { t, lang } = useLang();
  const [apps, setApps] = useState([]);
  const [unis, setUnis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a, error }, { data: u }] = await Promise.all([
      supabase.from('applications').select('*').eq('student_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('universities').select('id, name, programs'),
    ]);
    if (error) setError(error.message);
    setApps(a || []);
    setUnis(Object.fromEntries((u || []).map((x) => [x.id, x])));
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { load(); }, [load]);

  async function update(id, patch, confirmKey) {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setError('');
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    if (error) setError(error.message);
    load();
  }

  if (loading) return <p className="text-center text-slate-500 py-10">{t('unis.loading')}</p>;

  return (
    <div className="space-y-5">
      <AgreementStatus agreement={agreement} />
      {error && <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {apps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-100 p-10 text-center">
          <p className="text-lg text-slate-700">{t('apps.empty')}</p>
          <button onClick={onBrowse} className="mt-5 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white text-base font-semibold rounded-2xl">{t('apps.choose')}</button>
        </div>
      ) : apps.map((a) => {
        const uni = unis[a.university_id];
        const program = (uni?.programs || []).find((p) => p.id === a.program_id);
        const idx = STEPS.indexOf(a.status);
        const ended = ENDED.includes(a.status);
        const canClaim = ['ADMITTED', 'CONTRACT', 'ENROLLED'].includes(a.status) && !a.student_enrolled_claim;
        const canWithdraw = ['NEW', 'SENT', 'DOCS_REVIEW', 'EXAM'].includes(a.status);

        return (
          <article key={a.id} className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">{a.code}</p>
                <h2 className="text-xl font-bold text-brand-900">{uni?.name || a.university_id}</h2>
                <p className="text-slate-600">{program ? loc(program, 'name', lang) : a.program_name}</p>
              </div>
              <p className="text-sm text-slate-500">{formatDate(a.created_at, lang)}</p>
            </div>

            {ended ? (
              <p className="mt-5 inline-flex px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">{t(`status.${a.status}`)}</p>
            ) : (
              <div className="mt-6">
                <div className="flex gap-1" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span key={s} className={`h-2 flex-1 rounded-full ${i <= idx ? (s === 'ENROLLED' ? 'bg-apricot-500' : 'bg-brand-700') : 'bg-brand-100'}`} />
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {t('apps.current')} ({idx + 1}/{STEPS.length}):{' '}
                  <span className="text-base font-bold text-brand-900">{t(`status.${a.status}`)}</span>
                </p>
              </div>
            )}

            {a.exam_date && (
              <p className="mt-5 flex items-center gap-2 p-3.5 rounded-2xl bg-brand-50 text-brand-900 font-semibold">
                <CalendarDays className="w-5 h-5 shrink-0" /> {t('apps.exam', { date: formatDate(a.exam_date, lang) })}
              </p>
            )}
            {a.note && (
              <p className="mt-3 flex items-start gap-2 p-3.5 rounded-2xl bg-cream border border-apricot-100 text-slate-800">
                <MessageSquare className="w-5 h-5 shrink-0 text-apricot-600" /> {a.note}
              </p>
            )}
            {a.student_enrolled_claim && (
              <p className="mt-4 flex items-center gap-2 text-emerald-700 font-semibold">
                <PartyPopper className="w-5 h-5" /> {t('apps.congrats')}
              </p>
            )}

            {(canClaim || canWithdraw) && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                {canClaim && (
                  <button onClick={() => update(a.id, { student_enrolled_claim: true }, 'apps.claimConfirm')}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-apricot-500 hover:bg-apricot-600 text-brand-950 font-semibold rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" /> {t('apps.claim')}
                  </button>
                )}
                {canWithdraw && (
                  <button onClick={() => update(a.id, { status: 'WITHDRAWN' }, 'apps.withdrawConfirm')}
                    className="px-5 py-3 text-slate-600 hover:text-red-600 font-semibold rounded-2xl">
                    {t('apps.withdraw')}
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
