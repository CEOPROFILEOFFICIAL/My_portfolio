// Vercel Serverless Function — receives the contact form and stores it in Supabase.
// Required env vars (set in the Vercel dashboard): SUPABASE_URL, SUPABASE_SECRET_KEY
// The secret key stays server-side; the browser never sees it.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are all required.' });
  }
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid input.' });
  }
  if (name.length > 80 || email.length > 120 || message.length > 2000) {
    return res.status(400).json({ error: 'Input too long.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  try {
    const resp = await fetch(`${url}/rest/v1/messages`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ name, email, message }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.error('Supabase insert failed:', resp.status, text);
      return res.status(502).json({ error: 'Could not save your message. Please try again.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact function error:', err);
    return res.status(502).json({ error: 'Could not save your message. Please try again.' });
  }
}
