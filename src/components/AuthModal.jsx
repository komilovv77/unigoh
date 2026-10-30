import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })
      if (error) setMessage(`Xatolik: ${error.message}`)
      else {
        setMessage('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!')
        setTimeout(() => onClose(), 1500)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(`Xatolik: ${error.message}`)
      else {
        setMessage('Xush kelibsiz!')
        setTimeout(() => onClose(), 1000)
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isSignUp ? "Ro'yxatdan o'tish" : 'Tizimga kirish'}
        </h2>
        {message && <div className="mb-4 p-3 rounded-lg text-sm bg-indigo-50 text-indigo-700">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Ism Familiya</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Abdulloh Komilov"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parol</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Kutilmoqda...' : isSignUp ? "Ro'yxatdan o'tish" : 'Kirish'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          {isSignUp ? (
            <p>Akkountingiz bormi? <button onClick={() => setIsSignUp(false)} className="text-indigo-600 font-semibold hover:underline">Kirish</button></p>
          ) : (
            <p>Akkountingiz yo'qmi? <button onClick={() => setIsSignUp(true)} className="text-indigo-600 font-semibold hover:underline">Ro'yxatdan o'tish</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
