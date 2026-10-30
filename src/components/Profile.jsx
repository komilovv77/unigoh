import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Greeting, { firstName } from './Greeting';
import { User, GraduationCap, ClipboardCheck, Award, Briefcase, Plus, Trash2, Check, FolderLock } from 'lucide-react';
import Documents from './Documents';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    region: '',
    bio: '',
    school_name: '',
    diploma_url: '',
    test_score: '',
    portfolio_url: '',
  });

  const [certificates, setCertificates] = useState([]);
  const [savedName, setSavedName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, phone, region, bio, school_name, diploma_url, test_score, certificates, portfolio_url, documents`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          region: data.region || '',
          bio: data.bio || '',
          school_name: data.school_name || '',
          diploma_url: data.diploma_url || '',
          test_score: data.test_score || '',
          portfolio_url: data.portfolio_url || '',
        });
        setCertificates(data.certificates || []);
        setSavedName(data.full_name || '');
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
        setProfileExists(true);
      }
    } catch (error) {
      console.error('Profilni yuklashda xato:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const addCertificate = () => {
    setCertificates([...certificates, { title: '', score: '', file_url: '' }]);
  };

  const removeCertificate = (index) => {
    const updated = certificates.filter((_, i) => i !== index);
    setCertificates(updated);
  };

  const handleCertChange = (index, field, value) => {
    const updated = [...certificates];
    updated[index][field] = value;
    setCertificates(updated);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function updateProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const { user } = session;

      const updates = {
        id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        region: formData.region,
        bio: formData.bio,
        school_name: formData.school_name,
        diploma_url: formData.diploma_url,
        test_score: formData.test_score ? parseFloat(formData.test_score) : null,
        certificates: certificates,
        portfolio_url: formData.portfolio_url,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setSavedName(formData.full_name);
      setProfileExists(true);
      setMessage("Ma'lumotlar va hujjatlar muvaffaqiyatli saqlandi!");
    } catch (error) {
      setMessage('Xatolik yuz berdi: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveDocuments(next) {
    const { error } = await supabase.from('profiles').update({ documents: next }).eq('id', session.user.id);
    if (error) { setMessage('Xatolik yuz berdi: ' + error.message); return false; }
    setDocuments(next);
    return true;
  }

  const progressChecks = [
    formData.full_name,
    formData.phone,
    formData.region,
    formData.bio,
    formData.school_name,
    formData.diploma_url || documents.some((d) => d.kind === 'diploma'),
    documents.some((d) => d.kind === 'passport'),
    formData.test_score,
    certificates.length > 0,
  ];
  const progress = Math.round((progressChecks.filter(Boolean).length / progressChecks.length) * 100);

  const displayName = firstName(
    savedName || session?.user?.user_metadata?.full_name,
    session?.user?.email
  );

  const inputCls =
    'w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-base text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';
  const labelCls = 'block text-sm font-semibold text-brand-900 mb-1.5';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-8 space-y-6 animate-pulse" aria-label="Profil yuklanmoqda">
        <div className="h-48 rounded-3xl bg-brand-100" />
        <div className="h-64 rounded-3xl bg-white border border-brand-100" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Greeting name={displayName} progress={progress} />

      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 p-4 text-base rounded-2xl font-medium ${
            message.includes('Xatolik')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {!message.includes('Xatolik') && <Check className="w-5 h-5 shrink-0" />}
          {message}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-6">
        {/* 1. SHAXSIY MA'LUMOTLAR */}
        <Section n={1} icon={User} title="Shaxsiy ma'lumotlar" required>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="text"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-cream border-2 border-apricot-100 rounded-xl text-base text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className={labelCls}>Ism va familiya *</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="masalan: Ali Valiyev" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefon raqam *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+998 90 123 45 67" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Viloyat / shahar *</label>
              <input type="text" name="region" value={formData.region} onChange={handleChange} placeholder="masalan: Andijon" required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>O'zingiz haqingizda qisqacha</label>
            <textarea name="bio" rows="3" value={formData.bio} onChange={handleChange} placeholder="Qiziqishlaringiz va maqsadlaringiz haqida bir-ikki gap..." className={inputCls} />
          </div>
        </Section>

        {/* 2. TA'LIM */}
        <Section n={2} icon={GraduationCap} title="Ta'lim va shahodatnoma" required>
          <div>
            <label className={labelCls}>Maktab / litsey / kollej nomi *</label>
            <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} placeholder="masalan: Andijon shahar 21-maktab" required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Shahodatnoma havolasi (ixtiyoriy, fayl yuklasangiz shart emas)</label>
            <input type="url" name="diploma_url" value={formData.diploma_url} onChange={handleChange} placeholder="https://drive.google.com/..." className={inputCls} />
          </div>
        </Section>

        {/* HUJJATLAR */}
        <Section n={3} icon={FolderLock} title="Hujjatlar" required>
          {profileExists ? (
            <Documents userId={session.user.id} documents={documents} onChange={saveDocuments} />
          ) : (
            <p className="text-base text-slate-600">Hujjat yuklash uchun avval yuqoridagi ma'lumotlarni to'ldirib, pastdagi "Saqlash" tugmasini bosing.</p>
          )}
        </Section>

        {/* 3. IMTIHON */}
        <Section n={4} icon={ClipboardCheck} title="Imtihon ballari">
          <div className="max-w-xs">
            <label className={labelCls}>DTM / kirish imtihoni bali</label>
            <input type="number" step="0.1" name="test_score" value={formData.test_score} onChange={handleChange} placeholder="masalan: 145.8" className={inputCls} />
          </div>
        </Section>

        {/* 4. SERTIFIKATLAR */}
        <Section
          n={5}
          icon={Award}
          title="Sertifikatlar"
          action={
            <button
              type="button"
              onClick={addCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-apricot-100 hover:bg-apricot-200 text-apricot-800 text-sm font-semibold rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> Qo'shish
            </button>
          }
        >
          {certificates.length === 0 ? (
            <p className="text-base text-slate-500">
              IELTS, CEFR yoki milliy sertifikatlaringiz bo'lsa, qo'shing — grant olish imkoniyatini oshiradi.
            </p>
          ) : (
            certificates.map((cert, index) => (
              <div key={index} className="p-4 bg-cream border-2 border-apricot-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-apricot-800">Sertifikat {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCertificate(index)}
                    className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> O'chirish
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" placeholder="Nomi (IELTS, CEFR...)" value={cert.title} onChange={(e) => handleCertChange(index, 'title', e.target.value)} className={inputCls} />
                  <input type="text" placeholder="Ball (7.0 yoki B2)" value={cert.score} onChange={(e) => handleCertChange(index, 'score', e.target.value)} className={inputCls} />
                  <input type="url" placeholder="Fayl havolasi" value={cert.file_url} onChange={(e) => handleCertChange(index, 'file_url', e.target.value)} className={inputCls} />
                </div>
              </div>
            ))
          )}
        </Section>

        {/* 5. PORTFOLIO */}
        <Section n={6} icon={Briefcase} title="Portfolio va yutuqlar">
          <div>
            <label className={labelCls}>Portfolio, GitHub yoki loyihalaringiz havolasi</label>
            <input type="url" name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} placeholder="https://..." className={inputCls} />
          </div>
        </Section>

        <div className="sticky bottom-4 z-10">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-brand-800 hover:bg-brand-900 text-white text-lg font-semibold rounded-2xl shadow-lg shadow-brand-900/20 transition disabled:opacity-60"
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ n, icon: Icon, title, required, action, children }) {
  return (
    <section className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-brand-800 text-white shrink-0">
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-apricot-500 text-brand-950 text-xs font-bold">
              {n}
            </span>
          </span>
          <div>
            <h3 className="text-xl font-bold text-brand-900">{title}</h3>
            {required && <p className="text-sm text-apricot-700 font-medium">Majburiy</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
