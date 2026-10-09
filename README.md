# Portfolio — Chaudhary Muhammad Ahmad

My personal portfolio website. Dark modern one-pager with animated hero, skills,
projects, journey timeline and a working contact form.

## Stack

- **Frontend:** hand-written HTML, CSS and JavaScript (no frameworks)
- **Hosting:** Vercel
- **Contact form backend:** Vercel Serverless Function (`/api/contact.js`)
- **Database:** Supabase (`messages` table)

## Setup

### 1. Database (one-time)

In the Supabase dashboard go to **SQL Editor → New query**, paste the contents
of `supabase/schema.sql` and run it. This creates the `messages` table with
row-level security enabled (only the secret key can access it).

### 2. Environment variables (Vercel)

In the Vercel project go to **Settings → Environment Variables** and add:

| Name                 | Value                                              |
| -------------------- | -------------------------------------------------- |
| `SUPABASE_URL`       | Project URL, e.g. `https://xyzcompany.supabase.co` |
| `SUPABASE_SECRET_KEY`| The secret API key (`sb_secret_…`)                 |

Redeploy after adding them.

### 3. Deploy

Push to the connected GitHub repo — Vercel deploys automatically. Or deploy
the folder directly with the Vercel CLI / MCP server.

## Structure

```
├── index.html          # the whole site
├── styles.css          # dark modern theme
├── script.js           # preloader, typing, reveals, form
├── api/
│   └── contact.js      # serverless contact-form endpoint
└── supabase/
    └── schema.sql      # messages table
```
