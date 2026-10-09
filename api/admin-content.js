// Admin content API — full CRUD for site_settings, skills, projects, messages.
// Auth: Authorization: Bearer <token> (issued by /api/admin-login).
import { createHmac, timingSafeEqual } from 'node:crypto';

function authorized(req) {
  const password = process.env.ADMIN_PASSWORD;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!password || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const exp = Number(parts[0]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac('sha256', password).update(String(exp)).digest('hex');
  const a = Buffer.from(parts[0] + '.' + parts[1], 'utf8');
  const b = Buffer.from(exp + '.' + expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function sb(url, key, path, method = 'GET', body) {
  return fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const TABLES = ['skills', 'projects', 'messages'];

export default async function handler(req, res) {
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Not authorized. Please log in again.' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }
  const resource = req.query.resource;
  const id = req.query.id;

  try {
    // ---- site_settings ----
    if (resource === 'settings') {
      if (req.method === 'GET') {
        const r = await sb(url, key, 'site_settings?select=key,value&order=key.asc');
        return res.status(r.status).json(await r.json());
      }
      if (req.method === 'PUT') {
        const entries = Object.entries(req.body && req.body.settings ? req.body.settings : {});
        for (const [k, v] of entries) {
          const r = await sb(url, key, 'site_settings', 'POST', { key: k, value: String(v == null ? '' : v) });
          if (!r.ok) throw new Error(`settings upsert failed (${r.status})`);
        }
        return res.status(200).json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ---- skills / projects / messages ----
    if (TABLES.includes(resource)) {
      if (req.method === 'GET') {
        const order = resource === 'messages' ? 'created_at.desc' : 'sort_order.asc,id.asc';
        const r = await sb(url, key, `${resource}?select=*&order=${order}&limit=200`);
        return res.status(r.status).json(await r.json());
      }
      if (req.method === 'POST') {
        if (resource === 'messages') return res.status(405).json({ error: 'Method not allowed' });
        const r = await sb(url, key, resource, 'POST', req.body || {});
        return res.status(r.status).json(await r.json());
      }
      if (req.method === 'PUT') {
        if (!id || resource === 'messages') return res.status(400).json({ error: 'Missing id' });
        const r = await sb(url, key, `${resource}?id=eq.${encodeURIComponent(id)}`, 'PATCH', req.body || {});
        return res.status(r.status).json(await r.json());
      }
      if (req.method === 'DELETE') {
        if (!id) return res.status(400).json({ error: 'Missing id' });
        const r = await sb(url, key, `${resource}?id=eq.${encodeURIComponent(id)}`, 'DELETE');
        if (!r.ok) throw new Error(`delete failed (${r.status})`);
        return res.status(200).json({ ok: true });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(400).json({ error: 'Unknown resource' });
  } catch (err) {
    console.error('Admin content error:', err);
    return res.status(502).json({ error: 'Database request failed.' });
  }
}
