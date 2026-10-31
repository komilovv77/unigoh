import React, { useEffect, useState } from 'react';
import { MapPin, Award, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, loc, programMeta } from '../i18n';

const fmt = new Intl.NumberFormat('ru-RU');

export default function UniversityList({ session, onApplied }) {
  const { t, lang } = useLang();
  const [unis, setUnis] = useState([]);
  const [applied, setApplied] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ text: '', error: false });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: u, error }, { data: a }, { data: p }] = await Promise.all([
        supabase.from('universities').select('id, code, name, region, programs, details').eq('is_active', true).order('name'),
        supabase.from('applications').select('university_id, program_id, status').eq('student_id', session.user.id),
        supabase.from('profiles').select('full_name, phone, region, school_name').eq('id', session.user.id).maybeSingle(),
      ]);
      if (error) setMessage({ text: t('unis.error', { msg: error.message }), error: true });
      setUnis(u || []);
      setApplied(Object.fromEntries((a || []).map((x) => [`${x.university_id}:${x.program_id}`, true])));
      setProfile(p || null);
      setLoading(false);
    })();
  }, [session.user.id]);

  const profileOk = Boolean(profile && profile.full_name && profile.phone && profile.region && profile.school_name);

  async function submit(uni, program) {
    const key = `${uni.id}:${program.id}`;
    setBusy(key);
    const { error } = await supabase.from('applications').insert({
      student_id: session.user.id,
      university_id: uni.id,
      program_id: program.id,
      program_name: program.name,
    });
    setBusy('');
    if (error) {
      setMessage({ text: error.code === '23505' ? t('unis.already') : t('unis.error', { msg: error.message }), error: true });
      return;
    }
    setApplied((s) => ({ ...s, [key]: true }));
    setMessage({ text: t('unis.sent', { uni: uni.name, program: loc(program, 'name', lang) }), error: false });
    onApplied?.();
  }

  function apply(uni, program) {
    setMessage({ text: '', error: false });
    if (!profileOk) return setMessage({ text: t('unis.fillProfile'), error: true });
    submit(uni, program);
  }

  if (loading) return <p className="text-center text-slate-500 py-10">{t('unis.loading')}</p>;

  return (
    <div className="space-y-5">
      {!profileOk && (
        <div className="p-4 rounded-2xl bg-apricot-100 border border-apricot-300 text-apricot-900 text-base">{t('unis.fillProfile')}</div>
      )}
      {message.text && (
        <div role="status" className={`p-4 rounded-2xl text-base font-medium ${message.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {unis.length === 0 && <p className="text-center text-slate-500 py-10">{t('unis.empty')}</p>}

      {unis.map((u) => {
        const desc = loc(u.details, 'shortDescription', lang);
        const grant = loc(u.details, 'grantOpportunity', lang);
        return (
          <article key={u.id} className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-brand-900">{u.name}</h2>
                <p className="mt-1 inline-flex items-center gap-1.5 text-slate-600"><MapPin className="w-4 h-4" /> {u.region}</p>
              </div>
              {grant && (
                <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl bg-apricot-100 text-apricot-800 text-sm font-semibold">
                  <Award className="w-4 h-4 shrink-0" /> {grant}
                </span>
              )}
            </div>
            {desc && <p className="mt-3 text-base text-slate-700">{desc}</p>}

            <ul className="mt-5 divide-y divide-brand-50 border-t border-brand-50">
              {(u.programs || []).map((p) => {
                const key = `${u.id}:${p.id}`;
                return (
                  <li key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{loc(p, 'name', lang)}</p>
                      <p className="text-sm text-slate-500">
                        {[...programMeta(p, lang), p.tuition ? `${fmt.format(p.tuition)} ${t('unis.sum')} / ${t('unis.perYear')}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {applied[key] ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold shrink-0">
                        <Check className="w-4 h-4" /> {t('unis.applied')}
                      </span>
                    ) : (
                      <button onClick={() => apply(u, p)} disabled={busy === key}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 shrink-0">
                        <Send className="w-4 h-4" /> {busy === key ? t('unis.applying') : t('unis.apply')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </article>
        );
      })}

    </div>
  );
}
