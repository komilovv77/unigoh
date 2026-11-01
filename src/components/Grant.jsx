import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, CheckCircle2, Clock, CreditCard, FileText, GraduationCap, Mail, MailOpen, Pencil, Printer, ScrollText, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, loc, formatDate } from '../i18n';
import { LogoMark } from './Logo';
import { G, fill } from './grantText';
import { DocKind } from './Documents';

const fmt = new Intl.NumberFormat('ru-RU');

export default function Grant({ session, onGoProfile, onGoApplications, onChanged }) {
  const { lang } = useLang();
  const g = G[lang] || G.uz;
  const [settings, setSettings] = useState(null);
  const [app, setApp] = useState(null);
  const [profile, setProfile] = useState(null);
  const [unis, setUnis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: mine }, { data: p }, { data: u }] = await Promise.all([
      supabase.from('grant_settings').select('*').maybeSingle(),
      supabase.rpc('my_grant'),
      supabase.from('profiles').select('full_name, phone, test_score, documents').eq('id', session.user.id).maybeSingle(),
      supabase.from('universities').select('id, name, programs').eq('is_active', true).order('name'),
    ]);
    setSettings(s || null);
    const current = (mine || []).find((m) => !s || m.season === s.season) || null;
    setApp(current);
    setProfile(p || {});
    setUnis(u || []);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="h-64 rounded-3xl bg-white border border-brand-100 animate-pulse" />;
  if (!settings) return null;

  const vars = { min: settings.min_dtm, fee: fmt.format(settings.fee) };
  const open = settings.accepting && !settings.results_published_at && (!settings.deadline || new Date(settings.deadline) >= new Date(new Date().toDateString()));

  // Natija e'lon qilingan
  if (app && app.published_at) {
    if (!app.decision) return <Box><p className="text-lg text-slate-700">{g.notConsidered}</p></Box>;
    return <Result app={app} g={g} lang={lang} onReload={() => { load(); onChanged?.(); }} onGoApplications={onGoApplications} />;
  }

  return (
    <div className="space-y-6">
      <Hero g={g} vars={vars} settings={settings} lang={lang} />

      {app && !editing ? (
        <Status app={app} g={g} vars={vars} onEdit={() => setEditing(true)} canEdit={open && app.fee_status === 'unpaid'} />
      ) : open ? (
        <ApplyForm
          g={g} lang={lang} settings={settings} profile={profile} unis={unis} existing={app} userId={session.user.id}
          onGoProfile={onGoProfile}
          onDone={() => { setEditing(false); load(); onChanged?.(); }}
          onCancel={app ? () => setEditing(false) : null}
        />
      ) : (
        <Box><p className="text-lg text-slate-700">{g.closed}</p></Box>
      )}

      <Rules g={g} />
    </div>
  );
}

function Box({ children, className = '' }) {
  return <section className={`bg-white rounded-3xl border border-brand-100 p-5 sm:p-7 ${className}`}>{children}</section>;
}

function Hero({ g, vars, settings, lang }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-800 text-white p-6 sm:p-8">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-apricot-500/20" aria-hidden="true" />
      <div className="absolute right-10 bottom-[-60px] w-40 h-40 rounded-full bg-apricot-400/10" aria-hidden="true" />
      <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apricot-500 text-brand-950 text-sm font-bold">
        <Award className="w-4 h-4" /> {settings.season}
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">{g.title}</h1>
      <p className="mt-2 text-lg text-brand-100 max-w-xl">{g.lead}</p>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wider text-apricot-300">{g.req}</h2>
      <ul className="mt-2 space-y-1.5 text-brand-50">
        {[g.req1, g.req2, g.req3, g.req4, g.req5].map((r) => (
          <li key={r} className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 text-apricot-400 mt-0.5" /> {fill(r, vars)}</li>
        ))}
      </ul>
      {settings.deadline && <p className="mt-4 font-semibold text-apricot-200">{fill(g.deadline, { date: formatDate(settings.deadline, lang, false) })}</p>}
    </section>
  );
}

function Rules({ g }) {
  return (
    <details className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7 group">
      <summary className="flex items-center gap-2 cursor-pointer text-lg font-bold text-brand-900 list-none">
        <ScrollText className="w-5 h-5 text-brand-700" /> {g.rules}
      </summary>
      <ol className="mt-4 list-decimal pl-5 space-y-2 text-slate-700">
        {g.rulesList.map((r) => <li key={r}>{r}</li>)}
      </ol>
    </details>
  );
}

function ApplyForm({ g, lang, settings, profile, unis, existing, userId, onGoProfile, onDone, onCancel }) {
  const [documents, setDocuments] = useState(Array.isArray(profile?.documents) ? profile.documents : []);
  const [cert, setCert] = useState({ title: '', score: '' });
  async function saveDocuments(next) {
    const { error } = await supabase.from('profiles').update({ documents: next }).eq('id', userId);
    if (error) { setError(error.message); return false; }
    setDocuments(next);
    return true;
  }
  const init = (existing?.choices || []).map((c) => ({ university_id: c.university_id, program_id: c.program_id }));
  const [choices, setChoices] = useState([0, 1, 2].map((i) => init[i] || { university_id: '', program_id: '' }));
  const [motivation, setMotivation] = useState(existing?.motivation || '');
  const [agree, setAgree] = useState(!!existing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const uniById = useMemo(() => Object.fromEntries(unis.map((u) => [u.id, u])), [unis]);

  const score = profile?.test_score;
  const incomplete = !profile?.full_name || !profile?.phone || score == null || score === '';
  const low = !incomplete && Number(score) < Number(settings.min_dtm);
  const picked = choices.filter((c) => c.university_id && c.program_id);
  const len = motivation.trim().length;
  const valid = !incomplete && !low && picked.length >= 1 && len >= 300 && len <= 5000 && agree;

  const set = (i, patch) => setChoices(choices.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    const { error } = await supabase.rpc('grant_submit', { p_motivation: motivation, p_choices: picked });
    setBusy(false);
    if (error) {
      const code = Object.keys(g.errors).find((k) => error.message?.includes(k));
      setError(code ? g.errors[code] : error.message);
      return;
    }
    onDone();
  }

  const inputCls = 'w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400';

  return (
    <form onSubmit={submit} className="space-y-6">
      <Box>
        <div className="flex items-start gap-3">
          <GraduationCap className="w-6 h-6 text-brand-700 shrink-0 mt-0.5" />
          <div>
            {incomplete ? (
              <p className="text-base text-slate-700">{score == null || score === '' ? g.noScore : ''} {g.incomplete}</p>
            ) : (
              <p className="text-base text-slate-700">
                {fill(g.yourScore, { score })}{' '}
                {low && <span className="font-semibold text-red-700">{fill(g.lowScore, { min: settings.min_dtm })}</span>}
              </p>
            )}
            {(incomplete || low) && (
              <button type="button" onClick={onGoProfile} className="mt-2 font-semibold text-brand-700 underline hover:text-brand-900">{g.toProfile}</button>
            )}
          </div>
        </div>
      </Box>

      <Box className="space-y-4">
        <h2 className="text-xl font-bold text-brand-900">{g.choices}</h2>
        <p className="text-base text-slate-600">{g.choicesHint}</p>
        {choices.map((c, i) => {
          const usedElsewhere = choices.filter((_, j) => j !== i).map((x) => x.university_id);
          const programs = uniById[c.university_id]?.programs || [];
          return (
            <div key={i} className="p-4 rounded-2xl bg-cream border-2 border-apricot-100">
              <p className="text-sm font-bold text-brand-900 mb-2">
                {fill(g.choice, { n: i + 1 })} <span className="font-normal text-slate-500">({i === 0 ? g.first : g.optional})</span>
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <select className={inputCls} value={c.university_id} required={i === 0}
                  onChange={(e) => set(i, { university_id: e.target.value, program_id: '' })}>
                  <option value="">{g.pickUni}</option>
                  {unis.map((u) => <option key={u.id} value={u.id} disabled={usedElsewhere.includes(u.id)}>{u.name}</option>)}
                </select>
                <select className={inputCls} value={c.program_id} required={!!c.university_id} disabled={!c.university_id}
                  onChange={(e) => set(i, { program_id: e.target.value })}>
                  <option value="">{g.pickProg}</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{loc(p, 'name', lang)}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </Box>

      <Box className="space-y-3">
        <h2 className="text-xl font-bold text-brand-900">{g.certs} <span className="text-base font-normal text-slate-500">({g.optional})</span></h2>
        <p className="text-base text-slate-600">{g.certsHint}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input aria-label={g.certTitle} placeholder={g.certTitle} value={cert.title} onChange={(e) => setCert({ ...cert, title: e.target.value })} className={inputCls} />
          <input aria-label={g.certScore} placeholder={g.certScore} value={cert.score} onChange={(e) => setCert({ ...cert, score: e.target.value })} className={inputCls} />
        </div>
        <DocKind
          userId={userId} kind="certificate" label={g.certFile} documents={documents} onChange={saveDocuments}
          extra={{ title: cert.title.trim(), score: cert.score.trim() }}
          validateExtra={() => (cert.title.trim() ? '' : g.certNeedTitle)}
          onUploaded={() => setCert({ title: '', score: '' })}
        />
      </Box>

      <Box className="space-y-3">
        <label htmlFor="g-mot" className="text-xl font-bold text-brand-900 block">{g.motivation}</label>
        <textarea id="g-mot" rows={12} maxLength={5000} value={motivation} onChange={(e) => setMotivation(e.target.value)}
          placeholder={g.motivationPh} className={`${inputCls} leading-relaxed`} />
        <p className={`text-sm ${len > 0 && len < 300 ? 'text-apricot-700 font-semibold' : 'text-slate-500'}`}>{fill(g.chars, { n: len })}</p>
      </Box>

      <Box className="space-y-4">
        <label className="flex items-start gap-3 text-base text-slate-700 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-5 h-5 accent-blue-800 shrink-0" />
          {g.agree}
        </label>
        {error && <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button disabled={!valid || busy} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-800 hover:bg-brand-900 text-white text-lg font-semibold rounded-2xl disabled:opacity-50">
            <Send className="w-5 h-5" /> {busy ? g.sending : existing ? g.update : g.submit}
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="px-5 py-3 text-slate-600 font-semibold rounded-2xl">✕</button>}
        </div>
      </Box>
    </form>
  );
}

function Status({ app, g, vars, onEdit, canEdit }) {
  const step = app.fee_status === 'unpaid' ? 1 : 2;
  return (
    <Box className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{g.yourApp}</p>
          <h2 className="text-2xl font-bold text-brand-900">{app.full_name}</h2>
        </div>
        <p className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-900 font-mono font-bold self-start">{g.id}: {app.code}</p>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {g.steps.map((s, i) => (
          <li key={s} className="text-center">
            <span className={`block h-2 rounded-full ${i < step ? 'bg-brand-700' : i === step ? 'bg-apricot-500' : 'bg-brand-100'}`} />
            <span className={`mt-1.5 block text-xs sm:text-sm ${i <= step ? 'font-semibold text-brand-900' : 'text-slate-400'}`}>{s}</span>
          </li>
        ))}
      </ol>

      <ul className="space-y-1.5 text-slate-700">
        {(app.choices || []).map((c, i) => (
          <li key={i} className="flex items-start gap-2"><FileText className="w-4 h-4 mt-1 text-brand-600 shrink-0" /> <span><b>{c.university}</b> — {c.program}</span></li>
        ))}
      </ul>

      {app.fee_status === 'unpaid' ? (
        <div className="p-4 rounded-2xl bg-apricot-50 border border-apricot-200 space-y-2">
          <p className="flex items-center gap-2 text-lg font-bold text-brand-900"><CreditCard className="w-5 h-5 text-apricot-600" /> {fill(g.payTitle, vars)}</p>
          <p className="text-slate-700">{g.payText}</p>
          {canEdit && (
            <>
              <p className="text-sm text-slate-500">{g.editHint}</p>
              <button onClick={onEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-brand-100 hover:border-brand-300 text-brand-800 font-semibold">
                <Pencil className="w-4 h-4" /> {g.edit}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 space-y-1.5">
          <p className="flex items-center gap-2 text-lg font-bold text-brand-900"><Clock className="w-5 h-5 text-brand-700" /> {g.reviewTitle}</p>
          <p className="text-slate-700">{g.reviewText}</p>
          <p className="text-sm font-semibold text-emerald-700">{app.fee_status === 'waived' ? g.waived : g.paid}</p>
        </div>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Natija: avval konvert, ochilganda — qabul xati
// ---------------------------------------------------------------------------
function Result({ app, g, lang, onReload, onGoApplications }) {
  const [opened, setOpened] = useState(false);
  const letterRef = useRef(null);

  if (!opened) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-brand-800 text-white p-8 sm:p-12 text-center">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-apricot-500" />
        <Mail className="w-16 h-16 mx-auto text-apricot-400" />
        <p className="mt-4 text-sm font-semibold text-brand-200">{g.id}: {app.code}</p>
        <h1 className="mt-1 text-3xl font-extrabold">{app.full_name}</h1>
        <p className="mt-3 text-xl text-brand-100">{g.resultReady}</p>
        <p className="text-brand-200">{g.resultReadyText}</p>
        <button onClick={() => setOpened(true)} className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-apricot-500 hover:bg-apricot-400 text-brand-950 text-lg font-bold shadow-lg shadow-black/20">
          <MailOpen className="w-5 h-5" /> {g.open}
        </button>
      </section>
    );
  }

  const L = g.letter;
  const d = L[app.decision] || L.REJECTED;
  const vars = { name: app.full_name, season: app.season, percent: app.award_percent, university: app.award_university, program: app.award_program,
    offer_university: app.offer_university, offer_program: app.offer_program };
  const paragraphs = app.offer_application_id ? d.p : (d.pNoOffer || d.p);
  const accepted = app.decision === 'ACCEPTED';

  return (
    <div className="space-y-4">
      {accepted && <Confetti />}
      <article ref={letterRef} className="letter relative bg-white rounded-2xl shadow-xl shadow-brand-900/10 border border-brand-100 px-6 py-10 sm:px-14 sm:py-14 text-slate-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <div className="absolute inset-x-0 top-0 h-2 rounded-t-2xl bg-brand-800" />
        <header className="text-center">
          <LogoMark className="w-14 h-14 mx-auto" />
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-brand-800" style={{ fontFamily: 'inherit' }}>
            uni<span className="text-apricot-500">goh</span>
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{L.committee}</p>
        </header>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-[15px]">
          <div>
            <p>{formatDate(app.published_at, lang, false)}</p>
            <p className="mt-4">{fill(L.dear, vars)}</p>
          </div>
          <p className="text-sm text-slate-500">{g.id}: <span className="font-mono font-semibold text-slate-700">{app.code}</span></p>
        </div>

        {accepted && (
          <div className="float-right ml-4 mb-2 mt-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-apricot-500 bg-apricot-50 flex flex-col items-center justify-center text-center rotate-[-8deg]">
            <span className="text-3xl sm:text-4xl font-extrabold text-apricot-700">{app.award_percent}%</span>
            <span className="text-[10px] uppercase tracking-widest text-apricot-800 font-bold px-2">{d.badge}</span>
          </div>
        )}

        <h1 className={`mt-6 text-2xl sm:text-3xl font-bold ${accepted ? 'text-brand-800' : 'text-brand-900'}`}>{d.head}</h1>
        <div className="mt-4 space-y-4 text-[16px] sm:text-[17px] leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{i === 0 && accepted ? <b>{fill(p, vars)}</b> : fill(p, vars)}</p>
          ))}
        </div>

        {accepted && d.next && (
          <div className="clear-both mt-6">
            <p className="font-bold text-brand-900">{d.nextTitle}:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1.5 text-[16px] leading-relaxed">
              {d.next.map((n, i) => <li key={i}>{fill(n, vars)}</li>)}
            </ul>
          </div>
        )}

        <footer className="clear-both mt-10 whitespace-pre-line">
          <p className="italic text-brand-800 text-lg">{L.sign}</p>
        </footer>
      </article>

      <Offer app={app} g={g} onReload={onReload} onGoApplications={onGoApplications} />

      <div className="flex justify-center">
        <button onClick={() => printLetter(letterRef.current, app.code)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-brand-100 hover:border-brand-300 text-brand-800 font-semibold">
          <Printer className="w-4 h-4" /> {g.print}
        </button>
      </div>
    </div>
  );
}

function printLetter(el, code) {
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>UniGoh — ${code}</title>${styles}
    <style>body{background:#fff;margin:0;padding:24px}.letter{box-shadow:none!important;max-width:800px;margin:0 auto}@media print{body{padding:0}}</style>
    </head><body>${el.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (_) { /* foydalanuvchi o'zi chop etadi */ } }, 600);
}

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2,
    color: ['#F59E0B', '#1E3A8A', '#FCD34D', '#3B6CF6', '#FEF3C7'][i % 5],
    size: 6 + Math.random() * 6,
  })), []);
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <style>{`@keyframes ug-fall{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(540deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span key={i} style={{ position: 'absolute', top: 0, left: `${p.left}%`, width: p.size, height: p.size * 0.6, background: p.color,
          animation: `ug-fall ${p.dur}s ${p.delay}s ease-in forwards`, borderRadius: 2 }} />
      ))}
    </div>
  );
}

// Qabul taklifi: grant bilan yoki kontrakt asosida; talaba davom etadi yoki keyingi tanloviga o'tadi
function Offer({ app, g, onReload, onGoApplications }) {
  const o = g.offer;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needSign, setNeedSign] = useState(false);
  const total = (app.choices || []).length;
  const hasNext = app.offer_rank && app.offer_rank < total;

  async function accept() {
    if (!window.confirm(fill(o.confirm, { university: app.offer_university }))) return;
    setBusy(true); setError('');
    const { error } = await supabase.rpc('accept_offer', { p_application: app.offer_application_id });
    setBusy(false);
    if (error) {
      if (error.message?.includes('AGREEMENT_REQUIRED')) { setNeedSign(true); return; }
      setError(error.message); return;
    }
    onReload();
  }

  async function next() {
    if (!window.confirm(fill(o.nextConfirm, { university: app.offer_university }))) return;
    setBusy(true); setError('');
    const { error } = await supabase.rpc('grant_next_choice');
    setBusy(false);
    if (error) { setError(error.message); return; }
    onReload();
  }

  if (!app.offer_application_id) {
    return <Box><p className="text-base text-slate-700">{o.none}</p></Box>;
  }

  const sent = ['SENT', 'CONTRACT', 'ENROLLED'].includes(app.offer_status);
  return (
    <Box className="space-y-4 border-2 !border-apricot-300">
      <div>
        <p className="text-sm font-semibold text-apricot-700">{fill(o.rank, { n: app.offer_rank })}</p>
        <h2 className="text-2xl font-bold text-brand-900">{app.offer_university}</h2>
        <p className="text-lg text-slate-700">{app.offer_program}</p>
        <p className="mt-2 inline-flex px-3 py-1 rounded-xl bg-brand-50 text-brand-900 font-semibold">
          {app.offer_grant_percent ? fill(o.withGrant, { percent: app.offer_grant_percent }) : o.contract}
        </p>
      </div>
      {sent ? (
        <p className="flex items-start gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> {fill(o.sent, { university: app.offer_university })}
        </p>
      ) : app.offer_status === 'ADMITTED' ? (
        <>
          <p className="text-slate-700">{o.ask}</p>
          {needSign && (
            <p className="p-3.5 rounded-2xl bg-apricot-50 border border-apricot-200 text-slate-800">
              {o.sign} <button onClick={onGoApplications} className="font-semibold text-brand-700 underline">{o.toApps}</button>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={accept} disabled={busy} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-2xl disabled:opacity-60">
              <CheckCircle2 className="w-5 h-5" /> {o.accept}
            </button>
            {hasNext && (
              <button onClick={next} disabled={busy} className="px-5 py-3 text-slate-600 hover:text-brand-800 font-semibold rounded-2xl border-2 border-transparent hover:border-brand-100">
                {o.next}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-slate-700">{o.closed}</p>
      )}
      {error && <p role="alert" className="text-red-700 font-medium">{error}</p>}
    </Box>
  );
}
