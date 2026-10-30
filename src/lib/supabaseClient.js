import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.error(
    "[UniGoh] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY topilmadi. " +
    "Vercel → Settings → Environment Variables da shu muhit (Production/Preview) uchun qo'shing."
  )
}

// Kalitlar bo'lmasa ham sayt oq ekran bo'lib qolmasin: bosh sahifa ochiladi,
// faqat kirish/ro'yxatdan o'tish xato xabarini ko'rsatadi.
const notConfigured = async () => ({
  data: { session: null, user: null },
  error: { message: "Server sozlanmagan: Supabase kalitlari yo'q." },
})

const fallbackClient = {
  auth: {
    getSession: notConfigured,
    getUser: notConfigured,
    signUp: notConfigured,
    signInWithPassword: notConfigured,
    signOut: notConfigured,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from: () => {
    const q = {
      select: () => q, insert: () => q, update: () => q, upsert: () => q, delete: () => q,
      eq: () => q, in: () => q, not: () => q, single: () => q, maybeSingle: () => q, order: () => q,
      then: (resolve) => resolve({ data: null, error: { message: "Supabase sozlanmagan" } }),
    }
    return q
  },
  storage: {
    from: () => ({
      upload: notConfigured,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: notConfigured,
      list: notConfigured,
    }),
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : fallbackClient
