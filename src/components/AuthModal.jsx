import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// Supabase xabarlarini tushunarli o'zbekchaga
export function authError(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return "Email yoki parol noto'g'ri."
  if (m.includes('email not confirmed')) return "Email hali tasdiqlanmagan. Pochtangizdagi xatdagi havolani bosing."
  if (m.includes('already registered')) return "Bu email bilan akkaunt bor. \"Kirish\"ni tanlang yoki parolni tiklang."
  if (m.includes('rate limit') || m.includes('security purposes')) return "Juda ko'p urinish bo'ldi. Bir daqiqadan keyin qayta urinib ko'ring."
  if (m.includes('password should be')) return "Parol kamida 8 ta belgidan iborat bo'lsin."
  if (m.includes('same as the old')) return "Yangi parol eskisidan farq qilishi kerak."
  return msg || "Nimadir xato ketdi. Qayta urinib ko'ring."
}

const input =
  'w-full px-4 py-3 bg-white border-2 border-brand-100 rounded-xl text-base outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export default function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin') // signin | signup | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => { setError(''); setInfo('') }, [mode, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, consent_at: new Date().toISOString(), consent_version: '2026-10-30' }, emailRedirectTo: window.location.origin },
      })
      if (error) setError(authError(error.message))
      else if (!data.session) setInfo("Emailingizga tasdiqlash xati yubordik. Xatdagi havolani bosing, so'ng kiring.")
      else onClose()
    } else if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(authError(error.message))
      else onClose()
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) setError(authError(error.message))
      else setInfo("Agar bu email ro'yxatdan o'tgan bo'lsa, unga parolni tiklash havolasi yuborildi. Pochtangizni (va Spam papkasini) tekshiring.")
    }
    setLoading(false)
  }

  const titles = { signin: 'Kirish', signup: "Ro'yxatdan o'tish", reset: 'Parolni tiklash' }
  const buttons = { signin: 'Kirish', signup: "Ro'yxatdan o'tish", reset: 'Havola yuborish' }

  return (
    <div className="fixed inset-0 bg-brand-950/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="bg-cream rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl">
        <button onClick={onClose} aria-label="Yopish" className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-brand-50">
          <X className="w-5 h-5" />
        </button>
        <h2 id="auth-title" className="text-2xl font-extrabold text-brand-900">{titles[mode]}</h2>
        {mode === 'reset' && (
          <p className="mt-1 text-slate-600">Emailingizni yozing, yangi parol o'rnatish uchun havola yuboramiz.</p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-semibold text-brand-900 mb-1.5">Ism va familiya</label>
              <input id="auth-name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} placeholder="Ali Valiyev" />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-semibold text-brand-900 mb-1.5">Email</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="example@gmail.com" />
          </div>
          {mode !== 'reset' && (
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label htmlFor="auth-pass" className="block text-sm font-semibold text-brand-900">Parol</label>
                {mode === 'signin' && (
                  <button type="button" onClick={() => setMode('reset')} className="text-sm font-semibold text-brand-700 hover:text-brand-900">
                    Parolni unutdingizmi?
                  </button>
                )}
              </div>
              <input
                id="auth-pass" type="password" required minLength={8}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password} onChange={(e) => setPassword(e.target.value)} className={input} placeholder="Kamida 8 ta belgi"
              />
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-5 h-5 accent-blue-800 shrink-0" />
              <span>
                <a href="#maxfiylik" target="_blank" rel="noopener" className="font-semibold text-brand-700 underline">Maxfiylik siyosati va foydalanish shartlari</a>ga
                roziman va shaxsiy ma'lumotlarim ariza topshirish uchun qayta ishlanishiga rozilik beraman.
              </span>
            </label>
          )}

          {error && <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
          {info && <div role="status" className="p-3.5 rounded-xl text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">{info}</div>}

          <button type="submit" disabled={loading || (mode === 'signup' && !consent)}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-900 text-white text-base font-semibold rounded-xl transition disabled:opacity-60">
            {loading ? 'Kuting...' : buttons[mode]}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-600">
          {mode === 'signin' && (
            <p>Akkauntingiz yo'qmi? <button onClick={() => setMode('signup')} className="text-brand-700 font-semibold hover:underline">Ro'yxatdan o'tish</button></p>
          )}
          {mode !== 'signin' && (
            <p>Akkauntingiz bormi? <button onClick={() => setMode('signin')} className="text-brand-700 font-semibold hover:underline">Kirish</button></p>
          )}
        </div>
      </div>
    </div>
  )
}

// Emaildagi "parolni tiklash" havolasi bosilganda ochiladigan oyna
export function NewPasswordModal({ onDone }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (password !== repeat) return setError('Parollar bir xil emas.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(authError(error.message))
    setOk(true)
    setTimeout(onDone, 1500)
  }

  return (
    <div className="fixed inset-0 bg-brand-950/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="np-title">
      <form onSubmit={submit} className="bg-cream rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4">
        <h2 id="np-title" className="text-2xl font-extrabold text-brand-900">Yangi parol o'rnating</h2>
        <div>
          <label htmlFor="np-1" className="block text-sm font-semibold text-brand-900 mb-1.5">Yangi parol</label>
          <input id="np-1" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} placeholder="Kamida 8 ta belgi" />
        </div>
        <div>
          <label htmlFor="np-2" className="block text-sm font-semibold text-brand-900 mb-1.5">Yana bir marta</label>
          <input id="np-2" type="password" required minLength={8} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className={input} />
        </div>
        {error && <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {ok && <div role="status" className="p-3.5 rounded-xl text-sm bg-emerald-50 text-emerald-800 border border-emerald-200">Parol yangilandi. Siz tizimdasiz.</div>}
        <button type="submit" disabled={loading || ok} className="w-full py-3.5 bg-brand-800 hover:bg-brand-900 text-white text-base font-semibold rounded-xl transition disabled:opacity-60">
          {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  )
}
