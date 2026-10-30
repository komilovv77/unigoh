import React, { useEffect, useState } from 'react';
import { MapPin, Award, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const fmt = new Intl.NumberFormat('ru-RU');
const money = (n) => (n ? `${fmt.format(n)} so'm` : '—');

export default function UniversityList({ session, onApplied }) {
  const [unis, setUnis] = useState([]);
  const [applied, setApplied] = useState({}); // "uniId:programId" -> true
  const [profileOk, setProfileOk] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: u, error }, { data: a }, { data: p }] = await Promise.all([
        supabase.from('universities').select('id, code, name, region, programs, details').eq('is_active', true).order('name'),
        supabase.from('applications').select('university_id, program_id').eq('student_id', session.user.id),
        supabase.from('profiles').select('full_name, phone, region, school_name').eq('id', session.user.id).maybeSingle(),
      ]);
      if (error) setMessage('Xatolik: ' + error.message);
      setUnis(u || []);
      setApplied(Object.fromEntries((a || []).map((x) => [`${x.university_id}:${x.program_id}`, true])));
      setProfileOk(Boolean(p && p.full_name && p.phone && p.region && p.school_name));
      setLoading(false);
    })();
  }, [session.user.id]);

  async function apply(uni, program) {
    setMessage('');
    if (!profileOk) {
      setMessage("Xatolik: avval \"Profilim\" bo'limida majburiy maydonlarni to'ldirib saqlang.");
      return;
    }
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
      setMessage(error.code === '23505' ? 'Xatolik: bu yo\'nalishga allaqachon ariza topshirgansiz.' : 'Xatolik: ' + error.message);
      return;
    }
    setApplied({ ...applied, [key]: true });
    setMessage(`Ariza yuborildi: ${uni.name} — ${program.name}`);
    onApplied?.();
  }

  if (loading) return <p className="text-center text-slate-500 py-10">Yuklanmoqda...</p>;

  return (
    <div className="space-y-5">
      {!profileOk && (
        <div className="p-4 rounded-2xl bg-apricot-100 border border-apricot-300 text-apricot-900 text-base">
          Ariza topshirishdan oldin <b>Profilim</b> bo'limida ism, telefon, viloyat va maktabingizni kiritib saqlang.
        </div>
      )}
      {message && (
        <div role="status" className={`p-4 rounded-2xl text-base font-medium ${message.startsWith('Xatolik') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {message}
        </div>
      )}

      {unis.length === 0 && <p className="text-center text-slate-500 py-10">Hozircha universitetlar qo'shilmagan.</p>}

      {unis.map((u) => (
        <article key={u.id} className="bg-white rounded-3xl border border-brand-100 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-brand-900">{u.name}</h2>
              <p className="mt-1 inline-flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-4 h-4" /> {u.region}
              </p>
            </div>
            {u.details?.grantOpportunity && (
              <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl bg-apricot-100 text-apricot-800 text-sm font-semibold">
                <Award className="w-4 h-4" /> {u.details.grantOpportunity}
              </span>
            )}
          </div>
          {u.details?.shortDescription && <p className="mt-3 text-base text-slate-700">{u.details.shortDescription}</p>}

          <ul className="mt-5 divide-y divide-brand-50 border-t border-brand-50">
            {(u.programs || []).map((p) => {
              const key = `${u.id}:${p.id}`;
              const done = applied[key];
              return (
                <li key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-500">
                      {p.degree} · {p.duration} · {money(p.tuition)} / yil
                    </p>
                  </div>
                  {done ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">
                      <Check className="w-4 h-4" /> Ariza yuborilgan
                    </span>
                  ) : (
                    <button
                      onClick={() => apply(u, p)}
                      disabled={busy === key}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" /> {busy === key ? 'Yuborilmoqda...' : 'Ariza topshirish'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}
