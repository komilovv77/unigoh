import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, Eye, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export const DOC_KINDS = [
  { id: 'passport', label: 'Pasport yoki ID karta' },
  { id: 'diploma', label: 'Shahodatnoma / attestat / diplom' },
  { id: 'certificate', label: 'Sertifikat (IELTS, CEFR va boshqalar)' },
  { id: 'other', label: 'Boshqa hujjat' },
];
const MAX = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const sizeLabel = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function Documents({ userId, documents, onChange }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef({});

  async function upload(kind, file) {
    setError('');
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('Faqat PDF, JPG, PNG yoki WEBP fayl yuklang.');
    if (file.size > MAX) return setError("Fayl 10 MB dan oshmasin. Rasmni kichikroq qilib yoki PDF qilib yuklang.");
    setBusy(kind);
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').slice(-60);
    const path = `${userId}/${kind}-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setBusy(''); return setError('Yuklab bo\'lmadi: ' + upErr.message); }
    const next = [...documents, { kind, name: file.name, path, size: file.size, type: file.type, uploaded_at: new Date().toISOString() }];
    const ok = await onChange(next);
    if (!ok) await supabase.storage.from('documents').remove([path]);
    setBusy('');
    if (inputs.current[kind]) inputs.current[kind].value = '';
  }

  async function view(doc) {
    setError('');
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.path, 300);
    if (error) return setError('Faylni ochib bo\'lmadi: ' + error.message);
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  async function remove(doc) {
    if (!window.confirm(`"${doc.name}" o'chirilsinmi?`)) return;
    setError('');
    setBusy(doc.path);
    const next = documents.filter((d) => d.path !== doc.path);
    const ok = await onChange(next);
    if (ok) await supabase.storage.from('documents').remove([doc.path]);
    setBusy('');
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-sm text-slate-600">
        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-brand-700" />
        Fayllar yopiq omborda saqlanadi. Ularni faqat siz, ariza bergan universitetingiz va UniGoh administratori ko'ra oladi.
      </p>

      {DOC_KINDS.map((k) => {
        const list = documents.filter((d) => d.kind === k.id);
        return (
          <div key={k.id} className="p-4 rounded-2xl bg-cream border-2 border-apricot-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="font-semibold text-brand-900">{k.label}</p>
              <label className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition ${busy === k.id ? 'bg-brand-100 text-brand-500' : 'bg-white border-2 border-brand-100 hover:border-brand-300 text-brand-800'}`}>
                <Upload className="w-4 h-4" />
                {busy === k.id ? 'Yuklanmoqda...' : 'Fayl tanlash'}
                <input
                  ref={(el) => { inputs.current[k.id] = el; }}
                  type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" disabled={!!busy}
                  onChange={(e) => upload(k.id, e.target.files?.[0])}
                />
              </label>
            </div>
            {list.length > 0 && (
              <ul className="mt-3 space-y-2">
                {list.map((d) => (
                  <li key={d.path} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-brand-100">
                    <FileText className="w-5 h-5 text-brand-700 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-slate-900 truncate">{d.name}</span>
                      <span className="block text-xs text-slate-500">{sizeLabel(d.size)}</span>
                    </span>
                    <button type="button" onClick={() => view(d)} aria-label="Ko'rish" className="p-2 rounded-lg text-brand-700 hover:bg-brand-50"><Eye className="w-4 h-4" /></button>
                    <button type="button" onClick={() => remove(d)} disabled={busy === d.path} aria-label="O'chirish" className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {error && <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
      <p className="text-xs text-slate-500">PDF, JPG, PNG yoki WEBP, har biri 10 MB gacha.</p>
    </div>
  );
}
