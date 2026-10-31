import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, MessageSquare, PartyPopper, PhoneCall, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, loc, formatDate } from '../i18n';
import { AgreementStatus, AgreementModal } from './Agreement';

const STEPS = ['NEW', 'DOCS_REVIEW', 'EXAM', 'ADMITTED', 'SENT', 'CONTRACT', 'ENROLLED'];

export default function MyApplications({ session, agreement, onBrowse, onChanged }) {
  const { t, lang } = useLang();
  const [apps, setApps] = useState([]);
  const [unis, setUnis] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [signFor, setSignFor] = useState(null);
  const [profileName, setProfileName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: a, error }, { data: u }, { data: p }] = await Promise.all([
      supabase.from('applications').select('*').eq('student_id', session.user.id).order('updated_at', { ascending: false }),
      supabase.from('universities').select('id, name, programs'),
      supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle(),
    ]);
    if (error) setError(error.message);
    setApps(a || []);
    setUnis(Object.fromEntries((u || []).map((x) => [x.id, x])));
    setProfileName(p?.full_name || '');
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { load(); }, [load]);

  async function update(id, patch, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError('');
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    if (error) setError(error.message);
    load();
    onChanged?.();
  }

  async function forward(app) {
    setBusy(app.id);
    setError('');
    const { error } = await supabase.rpc('accept_offer', { p_application: app.id });
    setBusy('');
    if (error) {
      if (error.message?.includes('AGREEMENT_REQUIRED')) { await agreement.reload(); setSignFor(app); return; }
      setError(error.message);
    }
    load();
    onChanged?.();
  }

  function accept(app) {
    // Shartnoma e'lon qilingan va hali imzolanmagan bo'lsa — avval imzo; aks holda oddiy rozilik
    if (agreement.required) { setSignFor(app); return; }
    const uniName = unis[app.university_id]?.name || '';
    if (!window.confirm(t('apps.acceptConfirm', { uni: uniName }))) return;
    forward(app);
  }

  if (loading) return <p className="text-center text-slate-500 py-10">{t('unis.loading')}</p>;

  return (
    <div className="space-y-5">
      <AgreementStatus agreement={agreement} />
      {error && <div role="alert" className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200">{error}</div>}

      {apps.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-100 p-10 text-center">
          <p className="text-lg text-slate-700">{t('apps.empty')}</p>
          <button onClick={onBrowse} className="mt-5 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white text-base font-semibold rounded-2xl">{t('apps.choose')}</button>
        </div>
      ) : apps.map((a) => {
        const uni = unis[a.university_id];
        const program = (uni?.programs || []).find((p) => p.id === a.program_id);
        const idx = STEPS.indexOf(a.status);
        const rejected = a.status === 'REJECTED';
        const withdrawn = a.status === 'WITHDRAWN';
        const admitted = a.status === 'ADMITTED';
        const canClaim = ['SENT', 'CONTRACT', 'ENROLLED'].includes(a.status) && !a.student_enrolled_claim;
        const canWithdraw = ['NEW', 'DOCS_REVIEW', 'EXAM'].includes(a.status);

        return (
          <article key={a.id} className={`bg-white rounded-3xl border p-5 sm:p-7 ${admitted ? 'border-apricot-400 ring-4 ring-apricot-100' : 'border-brand-100'}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">{a.code}</p>
                <h2 className="text-xl font-bold text-brand-900">{uni?.name || a.university_id}</h2>
                <p className="text-slate-600">{program ? loc(program, 'name', lang) : a.program_name}</p>
              </div>
              <p className="text-sm text-slate-500">{formatDate(a.created_at, lang)}</p>
            </div>

            {rejected || withdrawn ? (
              <div className="mt-5 space-y-2">
                <p className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold ${rejected ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                  {rejected && <XCircle className="w-4 h-4" />} {t(`status.${a.status}`)}
                </p>
                {rejected && <p className="text-base text-slate-700">{t('apps.rejectedText')}</p>}
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex gap-1" aria-hidden="true">
                  {STEPS.map((s, i) => (
                    <span key={s} className={`h-2 flex-1 rounded-full ${i <= idx ? (i >= 3 ? 'bg-apricot-500' : 'bg-brand-700') : 'bg-brand-100'}`} />
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  {t('apps.current')} ({idx + 1}/{STEPS.length}):{' '}
                  <span className="text-base font-bold text-brand-900">{t(`status.${a.status}`)}</span>
                </p>
              </div>
            )}

            {admitted && (
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-apricot-50 border border-apricot-200 space-y-3">
                <p className="flex items-center gap-2 text-lg font-bold text-brand-900"><PartyPopper className="w-5 h-5 text-apricot-600" /> {t('apps.admittedTitle')}</p>
                <p className="text-base text-slate-700">{t('apps.admittedText')}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => accept(a)} disabled={busy === a.id}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-2xl disabled:opacity-60">
                    <CheckCircle2 className="w-5 h-5" /> {busy === a.id ? t('apps.accepting') : t('apps.accept')}
                  </button>
                  <button onClick={() => update(a.id, { status: 'WITHDRAWN' }, t('apps.declineConfirm'))}
                    className="px-5 py-3 text-slate-600 hover:text-red-600 font-semibold rounded-2xl">
                    {t('apps.decline')}
                  </button>
                </div>
              </div>
            )}

            {a.status === 'SENT' && (
              <p className="mt-5 flex items-start gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <PhoneCall className="w-5 h-5 shrink-0 mt-0.5" /> {t('apps.sentText')}
              </p>
            )}

            {a.exam_date && !rejected && !withdrawn && (
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
                  <button onClick={() => update(a.id, { student_enrolled_claim: true }, t('apps.claimConfirm'))}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-apricot-500 hover:bg-apricot-600 text-brand-950 font-semibold rounded-2xl">
                    <CheckCircle2 className="w-5 h-5" /> {t('apps.claim')}
                  </button>
                )}
                {canWithdraw && (
                  <button onClick={() => update(a.id, { status: 'WITHDRAWN' }, t('apps.withdrawConfirm'))}
                    className="px-5 py-3 text-slate-600 hover:text-red-600 font-semibold rounded-2xl">
                    {t('apps.withdraw')}
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}

      {signFor && agreement.template && (
        <AgreementModal
          template={agreement.template}
          userId={session.user.id}
          defaultName={profileName}
          onClose={() => setSignFor(null)}
          onSigned={async () => {
            const app = signFor;
            setSignFor(null);
            await agreement.reload();
            forward(app);
          }}
        />
      )}
    </div>
  );
}
