// Admin login — verifies ADMIN_PASSWORD and issues a 12-hour signed token.
// Env: ADMIN_PASSWORD (set in the Vercel dashboard, never in code).
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 12 * 3600 * 1000;

export function signToken(password, exp) {
  return createHmac('sha256', password).update(String(exp)).digest('hex');
}

export function verifyToken(password, token) {
  if (!password || !token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const exp = Number(parts[0]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signToken(password, exp);
  const a = Buffer.from(parts[1], 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return res.status(500).json({ error: 'Admin login is not configured yet.' });
  }
  const given = (req.body && req.body.password) || '';
  const a = Buffer.from(String(given), 'utf8');
  const b = Buffer.from(password, 'utf8');
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    // Small delay to slow down guessing.
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: 'Wrong password.' });
  }
  const exp = Date.now() + TOKEN_TTL_MS;
  return res.status(200).json({ token: `${exp}.${signToken(password, exp)}` });
}
