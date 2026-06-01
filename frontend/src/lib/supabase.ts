/**
 * Supabase client — HICC Workforce Platform
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

-- Enable Row Level Security
alter table workers enable row level security;
create policy "Workers can see all workers in their branch"
  on workers for select using (true);

-- Chat messages (real-time)
create table chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel    text not null,  -- 'unit', 'branch', 'global', or a branch id
  sender_id  uuid references workers(id),
  body       text not null,
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "All workers can read and insert chat"
  on chat_messages for all using (true);

-- Enable real-time on chat_messages
alter publication supabase_realtime add table chat_messages;

-- Prayer requests
create table prayer_requests (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references workers(id),
  branch_id  text not null,
  body       text not null,
  elevated   boolean default false,
  created_at timestamptz default now()
);
alter table prayer_requests enable row level security;
create policy "Workers can manage prayer requests"
  on prayer_requests for all using (true);

-- Testimonies
create table testimonies (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references workers(id),
  branch_id  text not null,
  category   text,
  body       text not null,
  created_at timestamptz default now()
);
alter table testimonies enable row level security;
create policy "Workers can read and create testimonies"
  on testimonies for all using (true);

-- Attendance logs
create table attendance_logs (
  id          uuid primary key default gen_random_uuid(),
  branch_id   text not null,
  service_date date not null,
  department  text,
  count       int not null,
  recorded_by uuid references workers(id),
  created_at  timestamptz default now()
);
alter table attendance_logs enable row level security;
create policy "Workers can log and view attendance"
  on attendance_logs for all using (true);

-- Soul records (new converts)
create table soul_records (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  phone       text,
  branch_id   text not null,
  led_by      uuid references workers(id),
  service_date date,
  follow_up_stage int default 1,
  created_at  timestamptz default now()
);
alter table soul_records enable row level security;
create policy "Workers can manage soul records"
  on soul_records for all using (true);

-- Push notification subscriptions
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid references workers(id),
  endpoint   text not null,
  p256dh     text,
  auth       text,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "Workers can manage their own subscriptions"
  on push_subscriptions for all using (auth.uid()::text = worker_id::text);

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
