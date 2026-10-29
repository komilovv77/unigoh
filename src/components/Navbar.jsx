import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    // Hozirgi sessiyani tekshirish
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Auth holati o'zgarganda (login/logout) avtomatik yangilash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav className="p-4 flex justify-between items-center border-b bg-white shadow-sm">
        <h1 className="font-bold text-xl text-indigo-600">UniGoh</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:underline font-medium">
                Chiqish
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
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
