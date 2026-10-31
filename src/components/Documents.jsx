import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang } from '../i18n';

const MAX = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

const sizeLabel = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// Faylni yopiq omborga yuklaydi va {name, path, size, type} qaytaradi (yoki xato matni)
export async function uploadFile(userId, kind, file, t) {
  if (!TYPES.includes(file.type)) return { error: t('docs.typeError') };
  if (file.size > MAX) return { error: t('docs.sizeError') };
  const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('documents').upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: t('docs.uploadError', { msg: error.message }) };
  return { doc: { name: file.name, path, size: file.size, type: file.type, uploaded_at: new Date().toISOString() } };
}

export async function openFile(path, t) {
  // Oynani darhol ochamiz (brauzer bloklamasligi uchun), keyin havolani beramiz
  const win = window.open('', '_blank');
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 300);
  if (error) { win?.close(); return t('docs.openError', { msg: error.message }); }
  if (win) win.location.href = data.signedUrl;
  else window.location.href = data.signedUrl;
  return '';
}

export function FileRow({ doc, onRemove, busy }) {
  const { t } = useLang();
  const [err, setErr] = useState('');
  return (
    <li className="px-3 py-2.5 bg-white rounded-xl border border-brand-100">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-brand-700 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-slate-900 truncate">
            {doc.title ? `${doc.title}${doc.score ? ` — ${doc.score}` : ''}` : doc.name}
          </span>
          <span className="block text-xs text-slate-500 truncate">{doc.title ? `${doc.name} · ` : ''}{sizeLabel(doc.size)}</span>
        </span>
        <button type="button" onClick={async () => setErr(await openFile(doc.path, t))} aria-label={t('docs.view')} title={t('docs.view')} className="p-2 rounded-lg text-brand-700 hover:bg-brand-50"><Eye className="w-4 h-4" /></button>
        {onRemove && (
          <button type="button" onClick={onRemove} disabled={busy} aria-label={t('docs.remove')} title={t('docs.remove')} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </li>
  );
}

// Bitta turdagi hujjatlar bloki: sarlavha, fayl tanlash, yuklangan fayllar ro'yxati
export function DocKind({ userId, kind, label, documents, onChange, extra, validateExtra, onUploaded }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);
  const list = documents.filter((d) => d.kind === kind);

  async function pick(file) {
    setError('');
    if (!file) return;
    if (validateExtra) {
      const msg = validateExtra();
      if (msg) { setError(msg); if (input.current) input.current.value = ''; return; }
    }
    setBusy(true);
    const r = await uploadFile(userId, kind, file, t);
    if (r.error) { setBusy(false); setError(r.error); return; }
    const entry = { kind, ...r.doc, ...(extra || {}) };
    const ok = await onChange([...documents, entry]);
    if (!ok) await supabase.storage.from('documents').remove([entry.path]);
    else onUploaded?.();
    setBusy(false);
    if (input.current) input.current.value = '';
  }

  async function remove(doc) {
    if (!window.confirm(t('docs.confirmRemove', { name: doc.title || doc.name }))) return;
    setBusy(true);
    const ok = await onChange(documents.filter((d) => d.path !== doc.path));
    if (ok) await supabase.storage.from('documents').remove([doc.path]);
    setBusy(false);
  }

  return (
    <div className="p-4 rounded-2xl bg-cream border-2 border-apricot-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="font-semibold text-brand-900">{label}</p>
        <label className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition focus-within:ring-4 focus-within:ring-brand-100 ${busy ? 'bg-brand-100 text-brand-500' : 'bg-white border-2 border-brand-100 hover:border-brand-300 text-brand-800'}`}>
          <Upload className="w-4 h-4" />
          {busy ? t('docs.uploading') : t('docs.choose')}
          <input ref={input} type="file" accept={ACCEPT} className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      </div>
      {list.length > 0 && (
        <ul className="mt-3 space-y-2">
          {list.map((d) => <FileRow key={d.path} doc={d} busy={busy} onRemove={() => remove(d)} />)}
        </ul>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
