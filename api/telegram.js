// Telegram bot webhook: Telegram → shu funksiya → Supabase (public.telegram_webhook).
// Maxfiy kalit (secret_token) tekshiruvi bazaning o'zida bo'ladi.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false })
    return
  }
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  const secret = req.headers['x-telegram-bot-api-secret-token'] || ''
  if (!url || !key || !secret) {
    res.status(200).json({ ok: false })
    return
  }
  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    await fetch(`${url}/rest/v1/rpc/telegram_webhook`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_secret: secret, p_update: update }),
    })
  } catch (e) {
    console.error('telegram webhook error', e)
  }
  // Telegram'ga har doim 200 qaytaramiz, aks holda u xabarni qayta-qayta yuboradi
  res.status(200).json({ ok: true })
}
