-- EZ Academy analytics mirror. Firestore stays the source of truth.
-- These tables only hold a copy used by the admin daily report.
create table if not exists report_users (
  id text primary key,
  email text,
  display_name text,
  created_at bigint not null default 0
);
create table if not exists report_tasks (
  id text primary key,
  uid text not null,
  skill text not null,
  at bigint not null,
  score numeric
);
create index if not exists report_tasks_at_idx on report_tasks (at);
create table if not exists report_visits (
  id text primary key,
  user_id text not null,
  day text not null,
  at bigint not null
);
create index if not exists report_visits_day_idx on report_visits (day);
create table if not exists report_sync (
  key text primary key,
  value bigint not null
);

-- The server uses the service role key, which bypasses row level security.
-- Turning RLS on with no policies keeps the public anon key from reading anything.
alter table report_users enable row level security;
alter table report_tasks enable row level security;
alter table report_visits enable row level security;
alter table report_sync enable row level security;
revoke all on report_users, report_tasks, report_visits, report_sync from anon, authenticated;
