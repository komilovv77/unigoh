import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FileSignature, X, Printer, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLang, formatDate } from '../i18n';

// Active agreement template and the student's signature for that version
export function useAgreement(userId) {
  const [template, setTemplate] = useState(null);
  const [signed, setSigned] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: tpl } = await supabase.from('contract_templates').select('*').eq('is_active', true).maybeSingle();
    let sig = null;
    if (tpl) {
      const { data } = await supabase.from('student_agreements').select('*')
        .eq('student_id', userId).eq('template_version', tpl.version).maybeSingle();
      sig = data;
    }
    setTemplate(tpl || null);
    setSigned(sig);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // No signature is required while no template is published
  const required = !!template && !signed;
  return { template, signed, required, loading, reload: load };
}

function useSignaturePad({ onChange }) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = canvas.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f1d45';
  }, []);

  const pos = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function down(e) {
    e.preventDefault();
    canvas.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = canvas.current.getContext('2d');
    const [x, y] = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvas.current.getContext('2d');
    const [x, y] = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!dirty.current) { dirty.current = true; onChange(canvas.current); }
  }
  function up() { drawing.current = false; }

  function clear() {
    const c = canvas.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    dirty.current = false;
    onChange(null);
  }

  return { canvas, down, move, up, clear };
}

export function AgreementModal({ template, onClose, onSigned, userId, defaultName }) {
  const { t, lang } = useLang();
  const [name, setName] = useState(defaultName || '');
  const [agree, setAgree] = useState(false);
  const [sigCanvas, setSigCanvas] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pad = useSignaturePad({ onChange: setSigCanvas });

  const title = lang === 'ru' ? template.title_ru : template.title_uz;
  const body = lang === 'ru' ? template.body_ru : template.body_uz;

  async function sign() {
    setError('');
    if (name.trim().length < 3) return setError(t('agr.needName'));
    if (!sigCanvas) return setError(t('agr.needSignature'));
    setBusy(true);
    const blob = await new Promise((res) => sigCanvas.toBlob(res, 'image/png'));
    const path = `${userId}/signature-v${template.version}-${Date.now()}.png`;
    const up = await supabase.storage.from('documents').upload(path, blob, { contentType: 'image/png', upsert: false });
    if (up.error) { setBusy(false); return setError(up.error.message); }
    const { error } = await supabase.from('student_agreements').insert({
      student_id: userId,
      template_version: template.version,
      lang,
      full_name: name.trim(),
      signature_path: path,
      user_agent: navigator.userAgent.slice(0, 300),
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from('documents').remove([path]);
      return setError(error.message);
    }
    onSigned();
  }

  return (
    <div className="fixed inset-0 bg-brand-950/50 z-50 flex items-stretch sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="agr-title">
      <div className="bg-cream w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-full sm:max-h-[92vh]">
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-brand-100">
          <div className="flex items-start gap-3">
            <FileSignature className="w-6 h-6 text-brand-800 shrink-0 mt-1" />
            <div>
              <h2 id="agr-title" className="text-xl sm:text-2xl font-extrabold text-brand-900">{t('agr.title')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('agr.intro')}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={t('auth.close')} className="p-2 rounded-lg text-slate-500 hover:bg-brand-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <article className="bg-white rounded-2xl border border-brand-100 p-5 max-h-72 overflow-y-auto">
            <h3 className="font-bold text-brand-900">{title}</h3>
            <p className="text-xs text-slate-500 mb-3">{t('agr.version', { n: template.version })}</p>
            <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{body}</div>
          </article>

          <div>
            <label htmlFor="agr-name" className="block text-sm font-semibold text-brand-900 mb-1.5">{t('agr.fullName')}</label>
            <input id="agr-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
              className="w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-base outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm font-semibold text-brand-900">{t('agr.draw')}</span>
              <button type="button" onClick={pad.clear} className="text-sm font-semibold text-brand-700 hover:text-brand-900">{t('agr.clear')}</button>
            </div>
            <canvas
              ref={pad.canvas}
              onPointerDown={pad.down} onPointerMove={pad.move} onPointerUp={pad.up} onPointerLeave={pad.up}
              className="w-full h-40 bg-white border-2 border-dashed border-brand-200 rounded-xl touch-none cursor-crosshair"
              aria-label={t('agr.draw')}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-5 h-5 accent-blue-800 shrink-0" />
            <span>{t('agr.agree')}</span>
          </label>

          {error && <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
        </div>

        <div className="p-5 sm:p-6 border-t border-brand-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button onClick={onClose} className="px-5 py-3 font-semibold text-slate-600 rounded-xl hover:bg-brand-50">{t('agr.cancel')}</button>
          <button onClick={sign} disabled={!agree || busy} className="px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl disabled:opacity-50">
            {busy ? t('agr.signing') : t('agr.sign')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Opens the signed agreement in a new window for printing / saving as PDF
export async function printAgreement(template, signed, lang, t) {
  const w = window.open('', '_blank');
  if (!w) return;
  const { data } = await supabase.storage.from('documents').createSignedUrl(signed.signature_path, 600);
  const docLang = signed.lang || lang;
  const title = docLang === 'ru' ? template.title_ru : template.title_uz;
  const body = docLang === 'ru' ? template.body_ru : template.body_uz;
  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  w.document.write(`<!doctype html><html lang="${docLang}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:15px/1.6 Georgia,serif;color:#111;max-width:720px;margin:40px auto;padding:0 24px}h1{font-size:20px}
.meta{color:#555;font-size:13px}.body{white-space:pre-line}.sig{margin-top:32px;border-top:1px solid #ccc;padding-top:16px}
.sig img{max-height:90px;display:block;margin-top:8px}</style></head><body>
<h1>${esc(title)}</h1><p class="meta">${esc(t('agr.version', { n: template.version }))} · SHA-256: ${esc(signed.text_hash)}</p>
<div class="body">${esc(body)}</div>
<div class="sig"><div><b>${esc(t('agr.signer'))}:</b> ${esc(signed.full_name)}</div>
<div><b>${esc(t('agr.signedAt'))}:</b> ${esc(formatDate(signed.signed_at, docLang))}</div>
${data?.signedUrl ? `<img src="${esc(data.signedUrl)}" alt="">` : ''}</div></body></html>`);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (_) { /* user can print manually */ } }, 600);
}

// Short status card shown above "My applications"
export function AgreementStatus({ agreement }) {
  const { t, lang } = useLang();
  const { template, signed } = agreement;
  if (!template) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-brand-100">
      <div className="flex items-start gap-3">
        <FileSignature className="w-5 h-5 text-brand-800 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-brand-900">{t('agr.section')}</p>
          <p className={`text-sm ${signed ? 'text-emerald-700' : 'text-slate-600'}`}>
            {signed ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {t('agr.signed', { date: formatDate(signed.signed_at, lang) })}</span> : t('agr.notSigned')}
          </p>
        </div>
      </div>
      {signed && (
        <button onClick={() => printAgreement(template, signed, lang, t)} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-brand-800 bg-cream border-2 border-brand-100 hover:border-brand-300 rounded-xl">
          <Printer className="w-4 h-4" /> {t('agr.print')}
        </button>
      )}
    </div>
  );
}
