import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav className="p-4 flex justify-between items-center border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-xl text-indigo-600">UniGoh</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">uz</span>
        </div>

        <div>
          {loading ? (
            <div className="text-sm text-gray-400">Yuklanmoqda...</div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-800">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button 
                onClick={handleLogout} 
                className="text-sm text-red-600 hover:underline font-medium"
              >
                Chiqish
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              Kirish / Ro'yxatdan o'tish
            </button>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  )
}
