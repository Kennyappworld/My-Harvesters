/**
 * Supabase client — HICC Workforce Community
 *
 * Setup steps (one-time):
 * 1. Go to https://supabase.com → New project → name it "hicc-workforce"
 * 2. Copy your Project URL and anon key from Settings → API
 * 3. Create a .env.local file in /frontend with:
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
 * 4. Run the SQL schema below in Supabase → SQL editor
 * 5. That's it — auth, chat, prayer wall, and notifications all go live
 *
 * The app falls back to localStorage gracefully when Supabase is not configured.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Returns null when env vars aren't set — app uses localStorage fallback
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const isSupabaseReady = !!supabase

/* ────────────────────────────────────────────────────────────────────────────
   DATABASE SCHEMA — paste this into Supabase → SQL Editor → Run
   ──────────────────────────────────────────────────────────────────────────

-- Workers table (replaces hardcoded WORKFORCE_USERS)
create table workers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  full_name     text not null,
  role          text not null default 'member',
  branch_id     text not null,
  department    text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz default now(),
  last_seen     timestamptz
);

-- ════════════════════════════════════════════════════════════
-- SECURITY: Proper Row Level Security (not using(true))
-- Run this in Supabase SQL Editor to apply all policies
-- ════════════════════════════════════════════════════════════

-- Helper: is the current user an admin or pastor?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from workers
    where id = auth.uid()
    and role in ('senior_pastor','pastor','admin')
  );
$$;

-- Workers table
alter table workers enable row level security;

-- Any authenticated user can read workers in their own branch
create policy "workers_select_own_branch"
  on workers for select
  using (
    branch_id = (select branch_id from workers where id = auth.uid())
    or is_admin()
  );

-- Workers can update only their own record
create policy "workers_update_own"
  on workers for update
  using (id = auth.uid());

-- Only admins can update any worker (e.g. approve, change role)
create policy "admins_update_any_worker"
  on workers for update
  using (is_admin());

-- Only admins can insert new workers (QR signup inserts are done via service role)
create policy "admins_insert_worker"
  on workers for insert
  with check (is_admin());

-- Only admins can delete workers
create policy "admins_delete_worker"
  on workers for delete
  using (is_admin());

-- Workers: must_change_password flag
alter table workers add column if not exists must_change_password boolean default false;
alter table workers add column if not exists status text default 'pending';

-- Chat messages
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel    text not null,
  sender_id  uuid references workers(id) on delete set null,
  body       text not null check (char_length(body) <= 4000),
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;

create policy "chat_select_authenticated"
  on chat_messages for select
  using (auth.uid() is not null);

create policy "chat_insert_own"
  on chat_messages for insert
  with check (sender_id = auth.uid());

-- Users can only delete their own messages; admins can delete any
create policy "chat_delete_own_or_admin"
  on chat_messages for delete
  using (sender_id = auth.uid() or is_admin());

alter publication supabase_realtime add table chat_messages;

-- Prayer requests
create table if not exists prayer_requests (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references workers(id) on delete set null,
  branch_id  text not null,
  body       text not null check (char_length(body) <= 2000),
  elevated   boolean default false,
  created_at timestamptz default now()
);
alter table prayer_requests enable row level security;

create policy "prayer_select_own_branch"
  on prayer_requests for select
  using (
    branch_id = (select branch_id from workers where id = auth.uid())
    or is_admin()
  );

create policy "prayer_insert_authenticated"
  on prayer_requests for insert
  with check (author_id = auth.uid());

create policy "prayer_delete_own_or_admin"
  on prayer_requests for delete
  using (author_id = auth.uid() or is_admin());

-- Only admins can mark prayers as elevated
create policy "prayer_update_admin"
  on prayer_requests for update
  using (is_admin());

-- Testimonies
create table if not exists testimonies (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references workers(id) on delete set null,
  branch_id  text not null,
  category   text,
  body       text not null check (char_length(body) <= 3000),
  created_at timestamptz default now()
);
alter table testimonies enable row level security;

create policy "testimony_select_authenticated"
  on testimonies for select
  using (auth.uid() is not null);

create policy "testimony_insert_own"
  on testimonies for insert
  with check (author_id = auth.uid());

create policy "testimony_delete_own_or_admin"
  on testimonies for delete
  using (author_id = auth.uid() or is_admin());

-- Attendance logs
create table if not exists attendance_logs (
  id          uuid primary key default gen_random_uuid(),
  branch_id   text not null,
  service_date date not null,
  department  text,
  count       int not null check (count >= 0 and count <= 100000),
  recorded_by uuid references workers(id) on delete set null,
  created_at  timestamptz default now()
);
alter table attendance_logs enable row level security;

create policy "attendance_select_own_branch"
  on attendance_logs for select
  using (
    branch_id = (select branch_id from workers where id = auth.uid())
    or is_admin()
  );

create policy "attendance_insert_unit_head_or_admin"
  on attendance_logs for insert
  with check (
    exists (select 1 from workers where id = auth.uid()
            and role in ('senior_pastor','pastor','admin','unit_head'))
  );

-- Soul records
create table if not exists soul_records (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (char_length(first_name) <= 100),
  last_name   text not null check (char_length(last_name) <= 100),
  phone       text check (char_length(phone) <= 30),
  branch_id   text not null,
  led_by      uuid references workers(id) on delete set null,
  service_date date,
  follow_up_stage int default 1 check (follow_up_stage between 1 and 5),
  created_at  timestamptz default now()
);
alter table soul_records enable row level security;

create policy "souls_select_own_branch"
  on soul_records for select
  using (
    branch_id = (select branch_id from workers where id = auth.uid())
    or is_admin()
  );

create policy "souls_insert_authenticated"
  on soul_records for insert
  with check (auth.uid() is not null);

create policy "souls_update_own_or_admin"
  on soul_records for update
  using (led_by = auth.uid() or is_admin());

create policy "souls_delete_admin"
  on soul_records for delete
  using (is_admin());

-- Push notification subscriptions
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid references workers(id) on delete cascade,
  endpoint   text not null,
  p256dh     text,
  auth       text,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;

create policy "push_own_only"
  on push_subscriptions for all
  using (worker_id = auth.uid())
  with check (worker_id = auth.uid());

-- Meetings table
create table if not exists meetings (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) <= 200),
  type         text not null default 'Peer',
  meeting_date date not null,
  meeting_time text,
  duration_mins int default 60 check (duration_mins > 0 and duration_mins <= 480),
  agenda       text check (char_length(agenda) <= 5000),
  summary      text check (char_length(summary) <= 10000),
  meet_link    text check (char_length(meet_link) <= 500),
  attendants   text,  -- JSON array
  status       text default 'upcoming',
  created_by   uuid references workers(id) on delete set null,
  created_at   timestamptz default now()
);
alter table meetings enable row level security;

create policy "meetings_select_authenticated"
  on meetings for select using (auth.uid() is not null);

create policy "meetings_insert_unit_head"
  on meetings for insert
  with check (
    exists (select 1 from workers where id = auth.uid()
            and role in ('senior_pastor','pastor','admin','unit_head'))
  );

create policy "meetings_update_creator_or_admin"
  on meetings for update
  using (created_by = auth.uid() or is_admin());

create policy "meetings_delete_admin"
  on meetings for delete using (is_admin());

-- Announcements
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) <= 300),
  body       text not null check (char_length(body) <= 10000),
  scope      text default 'all',
  branch_id  text,
  created_by uuid references workers(id) on delete set null,
  created_at timestamptz default now()
);
alter table announcements enable row level security;

create policy "announcements_select"
  on announcements for select
  using (
    scope = 'all'
    or (scope = 'branch' and branch_id = (select branch_id from workers where id = auth.uid()))
    or (scope = 'admin' and is_admin())
  );

create policy "announcements_insert_admin"
  on announcements for insert
  with check (is_admin());

-- ════════════════════════════════════════════════════════════
-- RATE LIMITING: Login attempt tracking
-- ════════════════════════════════════════════════════════════
create table if not exists login_attempts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  attempted_at timestamptz default now(),
  success     boolean default false
);
-- Auto-clean attempts older than 1 hour
create index if not exists login_attempts_email_idx on login_attempts(email, attempted_at);

   ──────────────────────────────────────────────────────────────────────── */

// ── Auth helpers ──────────────────────────────────────────────────────────

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return { error: { message: 'Supabase not configured — using demo mode' } }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ── Real-time chat ────────────────────────────────────────────────────────

export function subscribeToChat(channel: string, onMessage: (msg: any) => void) {
  if (!supabase) return () => {}
  const sub = supabase
    .channel(`chat:${channel}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `channel=eq.${channel}`,
    }, payload => onMessage(payload.new))
    .subscribe()
  return () => supabase.removeChannel(sub)
}

export async function sendChatMessage(channel: string, senderId: string, body: string) {
  if (!supabase) return null
  return supabase.from('chat_messages').insert({ channel, sender_id: senderId, body })
}

export async function getChatHistory(channel: string, limit = 50) {
  if (!supabase) return []
  const { data } = await supabase
    .from('chat_messages')
    .select('*, workers(full_name,avatar_url)')
    .eq('channel', channel)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
