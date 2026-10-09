-- Supabase schema for the portfolio contact form.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Lock the table down: with RLS enabled and no public policies,
-- only the secret key (used by the Vercel serverless function) can read/write.
alter table messages enable row level security;
