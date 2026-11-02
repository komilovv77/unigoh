import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Greeting, { firstName } from './Greeting';
import { User, GraduationCap, ClipboardCheck, Award, Briefcase, Check, FolderLock, Trash2, ExternalLink } from 'lucide-react';
import { DocKind } from './Documents';
import { useLang } from '../i18n';

const EMPTY = { full_name: '', phone: '', region: '', bio: '', school_name: '', test_score: '' };

export default function Profile({ session }) {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const [formData, setFormData] = useState(EMPTY);
  const [legacyCerts, setLegacyCerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [savedName, setSavedName] = useState('');
  const [profileExists, setProfileExists] = useState(false);
  const [cert, setCert] = useState({ title: '', score: '' });

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, region, bio, school_name, test_score, certificates, documents')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) console.error('Profilni yuklashda xato:', error.message);
    if (data) {
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        region: data.region || '',
        bio: data.bio || '',
        school_name: data.school_name || '',
        test_score: data.test_score ?? '',
      });
      setLegacyCerts(Array.isArray(data.certificates) ? data.certificates.filter((c) => c && (c.title || c.file_url)) : []);
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setSavedName(data.full_name || '');
      setProfileExists(true);
    } else {
      setFormData({ ...EMPTY, full_name: session.user.user_metadata?.full_name || '' });
    }
    setLoading(false);
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  async function updateProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', error: false });
    const updates = {
      id: session.user.id,
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      region: formData.region.trim(),
      bio: formData.bio,
      school_name: formData.school_name.trim(),
      test_score: formData.test_score !== '' ? parseFloat(formData.test_score) : null,
      certificates: legacyCerts,
      lang,
      updated_at: new Date(),
    };
    const { error } = await supabase.from('profiles').upsert(updates);
    setSaving(false);
    if (error) return setMessage({ text: t('profile.error', { msg: error.message }), error: true });
    setSavedName(updates.full_name);
    setProfileExists(true);
    setMessage({ text: t('profile.saved'), error: false });
  }

  async function saveDocuments(next) {
    // Documents can be uploaded before the first profile save: the row is created automatically
    const { error } = profileExists
      ? await supabase.from('profiles').update({ documents: next }).eq('id', session.user.id)
      : await supabase.from('profiles').upsert({ id: session.user.id, full_name: formData.full_name.trim(), phone: formData.phone.trim(), region: formData.region.trim(), school_name: formData.school_name.trim(), bio: formData.bio, certificates: legacyCerts, lang, documents: next, updated_at: new Date() });
    if (error) { setMessage({ text: t('profile.error', { msg: error.message }), error: true }); return false; }
    setDocuments(next);
    setProfileExists(true);
    return true;
  }

  async function removeLegacy(i) {
    const next = legacyCerts.filter((_, j) => j !== i);
    const { error } = await supabase.from('profiles').update({ certificates: next }).eq('id', session.user.id);
    if (!error) setLegacyCerts(next);
  }

  const has = (k) => documents.some((d) => d.kind === k);
  const checks = [formData.full_name, formData.phone, formData.region, formData.school_name, formData.bio, formData.test_score !== '', has('passport'), has('diploma')];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const displayName = firstName(savedName || session?.user?.user_metadata?.full_name, session?.user?.email);

  const inputCls = 'w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';
  const labelCls = 'block text-sm font-semibold text-brand-900 mb-1.5';

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-label={t('profile.loading')}>
        <div className="h-48 rounded-3xl bg-brand-100" />
        <div className="h-64 rounded-3xl bg-white border border-brand-100" />
      </div>
    );
  }

  const uid = session.user.id;

  return (
    <div className="space-y-6">
      <Greeting name={displayName} progress={progress} />

      {message.text && (
        <div role="status" className={`flex items-center gap-2 p-4 text-base rounded-2xl font-medium ${message.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {!message.error && <Check className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-6">
        <Section n={1} icon={User} title={t('profile.s1')} required>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="p-email">{t('profile.email')}</label>
              <input id="p-email" type="text" value={session?.user?.email || ''} disabled className="w-full px-4 py-3 bg-cream border-2 border-apricot-100 rounded-xl text-base text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-name">{t('profile.fullName')}</label>
              <input id="p-name" type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder={t('profile.fullNamePh')} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-phone">{t('profile.phone')}</label>
              <input id="p-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+998 90 123 45 67" required className={inputCls} />
              <p className="mt-1.5 text-sm text-slate-500">{t('profile.phoneHint')}</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="p-region">{t('profile.region')}</label>
              <input id="p-region" type="text" name="region" value={formData.region} onChange={handleChange} placeholder={t('profile.regionPh')} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="p-bio">{t('profile.bio')}</label>
            <textarea id="p-bio" name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder={t('profile.bioPh')} className={inputCls} />
          </div>
        </Section>

        <Section n={2} icon={GraduationCap} title={t('profile.s2')} required>
          <div>
            <label className={labelCls} htmlFor="p-school">{t('profile.school')}</label>
            <input id="p-school" type="text" name="school_name" value={formData.school_name} onChange={handleChange} placeholder={t('profile.schoolPh')} required className={inputCls} />
          </div>
        </Section>

        <Section n={3} icon={ClipboardCheck} title={t('profile.s4')}>
          <div className="max-w-xs">
            <label className={labelCls} htmlFor="p-score">{t('profile.score')}</label>
            <input id="p-score" type="number" step="0.1" min="0" name="test_score" value={formData.test_score} onChange={handleChange} placeholder={t('profile.scorePh')} className={inputCls} />
          </div>
          <DocKind userId={session.user.id} kind="dtm" label={t('docs.dtm')} documents={documents} onChange={saveDocuments} />
          <p className="text-xs text-slate-500">{t('docs.formats')}</p>
        </Section>

        <div className="sticky bottom-4 z-10">
          <button type="submit" disabled={saving} className="w-full py-4 bg-brand-800 hover:bg-brand-900 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-brand-900/20 transition disabled:opacity-60">
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </form>

      <Section n={4} icon={FolderLock} title={t('profile.s3')} required>
        {(
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{t('docs.private')}</p>
            <DocKind userId={uid} kind="passport" label={t('docs.passport')} documents={documents} onChange={saveDocuments} />
            <DocKind userId={uid} kind="diploma" label={t('docs.diploma')} documents={documents} onChange={saveDocuments} />
            <DocKind userId={uid} kind="other" label={t('docs.other')} documents={documents} onChange={saveDocuments} />
            <p className="text-xs text-slate-500">{t('docs.formats')}</p>
          </div>
        )}
      </Section>

      <Section n={5} icon={Award} title={t('profile.s5')}>
        {(
          <div className="space-y-3">
            <p className="text-base text-slate-600">{t('profile.certHint')}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input aria-label={t('profile.certTitle')} placeholder={t('profile.certTitle')} value={cert.title} onChange={(e) => setCert({ ...cert, title: e.target.value })} className={inputCls} />
              <input aria-label={t('profile.certScore')} placeholder={t('profile.certScore')} value={cert.score} onChange={(e) => setCert({ ...cert, score: e.target.value })} className={inputCls} />
            </div>
            <DocKind
              userId={uid} kind="certificate" label={t('docs.certificate')} documents={documents} onChange={saveDocuments}
              extra={{ title: cert.title.trim(), score: cert.score.trim() }}
              validateExtra={() => (cert.title.trim() ? '' : t('profile.certNeedTitle'))}
              onUploaded={() => setCert({ title: '', score: '' })}
            />
            {legacyCerts.length > 0 && (
              <ul className="space-y-2">
                {legacyCerts.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-brand-100 text-sm">
                    <span className="flex-1 min-w-0 truncate font-medium">{c.title} {c.score}</span>
                    {c.file_url && <a href={c.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700">{t('profile.legacyLink')} <ExternalLink className="w-3.5 h-3.5" /></a>}
                    <button type="button" onClick={() => removeLegacy(i)} aria-label={t('docs.remove')} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>

      <Section n={6} icon={Briefcase} title={t('profile.s6')}>
        {(
          <div className="space-y-3">
            <p className="text-base text-slate-600">{t('profile.portfolioHint')}</p>
            <DocKind userId={uid} kind="portfolio" label={t('docs.portfolio')} documents={documents} onChange={saveDocuments} />
          </div>
        )}
      </Section>

    </div>
  );
}

function Section({ n, icon: Icon, title, required, children }) {
  const { t } = useLang();
  return (
    <section className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7 space-y-5">
      <div className="flex items-center gap-3">
        <span className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-brand-800 text-white shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-apricot-500 text-brand-950 text-xs font-bold">{n}</span>
        </span>
        <div>
          <h3 className="text-xl font-bold text-brand-900">{title}</h3>
          {required && <p className="text-sm text-apricot-700 font-medium">{t('profile.required')}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
