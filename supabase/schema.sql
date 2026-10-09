-- ============================================================
-- Portfolio database schema (Supabase)
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- Contact form submissions (read/write via the serverless function only)
create table if not exists messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);
alter table messages enable row level security;

-- Site-wide editable text: hero, about, facts, contact info (key -> value)
create table if not exists site_settings (
  key text primary key,
  value text not null default ''
);
alter table site_settings enable row level security;

-- Skills with proficiency bars
create table if not exists skills (
  id bigint generated always as identity primary key,
  name text not null,
  percent int not null default 80 check (percent >= 0 and percent <= 100),
  description text not null default '',
  sort_order int not null default 0
);
alter table skills enable row level security;

-- Projects (image_url points at the public portfolio-images bucket)
create table if not exists projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  language text not null default 'Web',
  link text not null default '',
  image_url text not null default '',
  tags text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table projects enable row level security;

-- NOTE: with RLS enabled and no public policies, only the secret key
-- (used by the Vercel serverless functions) can read/write these tables.
-- The public website reads through /api/content, never directly.
