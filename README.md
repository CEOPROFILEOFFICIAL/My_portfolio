# Portfolio — Chaudhary Muhammad Ahmad

My personal portfolio website. Dark modern one-pager with animated hero, skills,
projects, journey timeline, a working contact form, and a full **admin panel**.

## Stack

- **Frontend:** hand-written HTML, CSS and JavaScript (no frameworks)
- **Hosting:** Vercel (static + serverless functions)
- **Database & storage:** Supabase (Postgres + Storage bucket `portfolio-images`)
- **Admin:** password-protected panel at `/admin.html`

## Admin panel

Open `/admin.html` on the live site and log in with the admin password
(`ADMIN_PASSWORD` env var). From there you can:

- **Site Settings** — edit hero text, typing roles, bio, about paragraphs,
  facts, tool chips, contact email / GitHub / location. Changes go live instantly.
- **Skills** — add, edit, delete skills with proficiency bars.
- **Projects** — add, edit, delete projects, upload a project image
  (stored in Supabase Storage).
- **Messages** — read and delete contact-form submissions.

## Setup

### 1. Database (one-time)

In the Supabase dashboard go to **SQL Editor → New query**, paste the contents
of `supabase/schema.sql` and run it. This creates the `messages`,
`site_settings`, `skills` and `projects` tables with row-level security
enabled (only the secret key can access them).

### 2. Environment variables (Vercel)

In the Vercel project go to **Settings → Environment Variables** and add:

| Name                  | Value                                              |
| --------------------- | -------------------------------------------------- |
| `SUPABASE_URL`        | Project URL, e.g. `https://xyzcompany.supabase.co` |
| `SUPABASE_SECRET_KEY` | The secret API key (`sb_secret_…`)                 |
| `ADMIN_PASSWORD`      | Your chosen admin-panel password                   |

Redeploy after adding them.

### 3. Seed content

After the tables exist, the site pulls all content from the database.
Seed it via the admin panel, or ask your assistant to seed it for you.

### 4. Deploy

Push to the connected GitHub repo — Vercel deploys automatically. Or deploy
the folder directly with the Vercel CLI / MCP server.

## Structure

```
├── index.html          # the public site (content loaded from the database)
├── styles.css          # dark modern theme
├── script.js           # preloader, typing, reveals, dynamic rendering, form
├── admin.html          # admin panel UI
├── admin.js            # admin panel logic
├── api/
│   ├── content.js      # public content API (no auth)
│   ├── contact.js      # contact form endpoint
│   ├── admin-login.js  # issues signed admin tokens
│   ├── admin-content.js# CRUD for settings/skills/projects/messages (token auth)
│   └── admin-upload.js # image upload to Supabase Storage (token auth)
└── supabase/
    └── schema.sql      # all tables
```
