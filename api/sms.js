// SMS sender (Eskiz.uz): Supabase (sms_outbox) -> this function -> Eskiz -> status reported back to Supabase.
//
// Vercel -> Settings -> Environment Variables:
//   ESKIZ_EMAIL, ESKIZ_PASSWORD  - Eskiz account login
//   ESKIZ_FROM                   - sender name (default: 4546)
//   SMS_SECRET                   - must match the secret passed to private.sms_setup(...)
const ESKIZ = 'https://notify.eskiz.uz/api'
let token = null

async function login() {
  const body = new URLSearchParams({ email: process.env.ESKIZ_EMAIL || '', password: process.env.ESKIZ_PASSWORD || '' })
  const r = await fetch(`${ESKIZ}/auth/login`, { method: 'POST', body })
  const j = await r.json().catch(() => ({}))
  if (!r.ok || !j?.data?.token) throw new Error(`Eskiz login: ${r.status} ${j?.message || ''}`.trim())
  token = j.data.token
}

async function send(phone, message) {
  if (!token) await login()
  const body = new URLSearchParams({ mobile_phone: phone, message, from: process.env.ESKIZ_FROM || '4546' })
  let r = await fetch(`${ESKIZ}/message/sms/send`, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 401) {
    await login()
    r = await fetch(`${ESKIZ}/message/sms/send`, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` } })
  }
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Eskiz: ${r.status} ${j?.message || JSON.stringify(j).slice(0, 200)}`)
  return String(j?.id ?? '')
}

async function report(id, status, providerId, error) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !id) return
  await fetch(`${url}/rest/v1/rpc/sms_report`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_secret: process.env.SMS_SECRET, p_id: id, p_status: status, p_provider_id: providerId || null, p_error: error || null }),
  }).catch(() => {})
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return }
  const secret = process.env.SMS_SECRET
  if (!secret || req.headers['x-unigoh-secret'] !== secret) { res.status(401).json({ ok: false }); return }

  let msg = req.body || {}
  if (typeof msg === 'string') { try { msg = JSON.parse(msg) } catch { msg = {} } }
  const { id, phone, message } = msg
  if (!id || !/^998\d{9}$/.test(String(phone || '')) || !message) {
    await report(id, 'failed', null, "Noto'g'ri so'rov")
    res.status(400).json({ ok: false })
    return
  }
  try {
    const providerId = await send(phone, message)
    await report(id, 'sent', providerId, null)
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('sms error', e)
    await report(id, 'failed', null, String(e.message || e))
    res.status(200).json({ ok: false })
  }
}
