// Public content API — the website reads everything through here.
// No auth needed (content is public); the secret key stays server-side.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  try {
    const [sRes, skRes, pRes] = await Promise.all([
      fetch(`${url}/rest/v1/site_settings?select=key,value`, { headers }),
      fetch(`${url}/rest/v1/skills?select=*&order=sort_order.asc,id.asc`, { headers }),
      fetch(`${url}/rest/v1/projects?select=*&order=sort_order.asc,id.asc`, { headers }),
    ]);
    if (!sRes.ok || !skRes.ok || !pRes.ok) {
      throw new Error(`Supabase responded ${sRes.status}/${skRes.status}/${pRes.status}`);
    }
    const [sRows, skills, projects] = await Promise.all([sRes.json(), skRes.json(), pRes.json()]);
    const settings = {};
    for (const row of sRows) settings[row.key] = row.value;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ settings, skills, projects });
  } catch (err) {
    console.error('Content API error:', err);
    return res.status(502).json({ error: 'Could not load site content.' });
  }
}
