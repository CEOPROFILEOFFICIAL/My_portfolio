// Admin image upload — stores the file in the public Supabase Storage bucket
// "portfolio-images" and returns its public URL.
// Auth: Authorization: Bearer <token>. Body: { filename, contentType, data (base64) }.
import { createHmac, timingSafeEqual } from 'node:crypto';

const BUCKET = 'portfolio-images';
const MAX_BYTES = 4 * 1024 * 1024; // keep under the serverless payload limit

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

function safeName(name) {
  const base = String(name || 'image').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 80) || 'image';
  return `${Date.now()}-${base}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authorized(req)) {
    return res.status(401).json({ error: 'Not authorized. Please log in again.' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }
  const { filename, contentType, data } = req.body || {};
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'No image data received.' });
  }
  const buffer = Buffer.from(data, 'base64');
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ error: 'Image is too large (max ~4MB).' });
  }
  if (!/^image\//.test(contentType || '')) {
    return res.status(400).json({ error: 'Only image files are allowed.' });
  }
  const name = safeName(filename);
  try {
    const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: buffer,
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('Storage upload failed:', r.status, text);
      return res.status(502).json({ error: 'Image upload failed.' });
    }
    return res.status(200).json({
      url: `${url}/storage/v1/object/public/${BUCKET}/${name}`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(502).json({ error: 'Image upload failed.' });
  }
}
