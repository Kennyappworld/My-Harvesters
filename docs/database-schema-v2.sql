-- ════════════════════════════════════════════════════════════════════════════
-- ChurchOS / SanctuaryHQ / PulpitPro  —  Multi-Tenant Database Schema v2.0
--
-- Run in Supabase → SQL Editor → New Query → Run
-- Designed for any church, not HICC-specific.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 0. Extensions ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- for full-text search

-- ── 1. Organisations (multi-tenant root) ─────────────────────────────────────
-- Each row is one church installation.
-- In the hosted SaaS model, org_id is passed in every query.
-- In the self-hosted model, there is exactly one row.
create table if not exists public.organisations (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null check (slug ~ '^[a-z0-9-]{3,60}$'),
  name            text not null check (char_length(name) between 2 and 200),
  tagline         text check (char_length(tagline) <= 300),
  logo_url        text check (char_length(logo_url) <= 1000),
  address         text check (char_length(address) <= 500),
  city            text check (char_length(city) <= 100),
  country         text not null default 'NG' check (char_length(country) = 2),
  phone           text check (char_length(phone) <= 30),
  email           text check (char_length(email) <= 200),
  website         text check (char_length(website) <= 300),
  -- Branding
  primary_color   text default '#1B4332' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color    text default '#C9A84C' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- Platform config
  timezone        text default 'Africa/Lagos',
  currency        text default 'NGN',
  -- Developer / super-admin owner
  owner_email     text not null,
  -- Feature flags
  allow_self_reg  boolean default true,
  require_approval boolean default true,
  -- Powered-by attribution
  powered_by_text text default 'Powered by Anchorsuites Technologies Ltd',
  powered_by_url  text default 'https://anchorsuites.com',
  powered_by_visible boolean default true,
  -- Follow-up schedule (JSON array of human-readable strings)
  followup_stages jsonb default '["2 weeks","4 weeks","3 months","4 months"]',
  -- App name selected by this org
  app_name        text default 'ChurchOS',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Default organisation row (single-church install)
insert into public.organisations (
  slug, name, owner_email, country, primary_color, accent_color, app_name
) values (
  'default', 'My Church', 'kennyappworld@gmail.com', 'NG', '#1B4332', '#C9A84C', 'ChurchOS'
) on conflict (slug) do nothing;

-- ── 2. Branches / Subunits ────────────────────────────────────────────────────
create table if not exists public.branches (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  branch_key      text not null check (char_length(branch_key) <= 60),  -- slug-style key
  name            text not null check (char_length(name) between 2 and 200),
  short_name      text check (char_length(short_name) <= 40),
  location        text check (char_length(location) <= 300),
  country         text default 'NG' check (char_length(country) = 2),
  type            text default 'branch' check (type in ('hq','branch','satellite','international','online')),
  pastor_name     text check (char_length(pastor_name) <= 200),
  phone           text check (char_length(phone) <= 30),
  email           text check (char_length(email) <= 200),
  color           text default '#1B4332' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  founded_year    int check (founded_year between 1800 and 2100),
  is_active       boolean default true,
  sort_order      int default 0,
  created_at      timestamptz default now(),
  unique (org_id, branch_key)
);

alter table public.branches enable row level security;

-- ── 3. Workers (platform users) ───────────────────────────────────────────────
create table if not exists public.workers (
  id              uuid primary key references auth.users(id) on delete cascade,
  org_id          uuid references public.organisations(id) on delete set null,
  email           text unique not null,
  full_name       text not null check (char_length(full_name) between 1 and 200),
  role            text not null default 'worker'
                    check (role in ('developer','senior_pastor','pastor','admin','unit_head','worker','guest')),
  branch_id       uuid references public.branches(id) on delete set null,
  branch_key      text,   -- denormalised for fast queries without join
  department      text check (char_length(department) <= 100),
  phone           text check (char_length(phone) <= 30),
  avatar_url      text check (char_length(avatar_url) <= 1000),
  marital_status  text check (marital_status in ('single','married','widowed','divorced') or marital_status is null),
  status          text default 'pending' check (status in ('pending','active','suspended','deleted')),
  must_change_password boolean default false,
  phone_public    boolean default false,
  last_seen       timestamptz,
  created_at      timestamptz default now()
);

alter table public.workers enable row level security;

-- ── 4. Departments ────────────────────────────────────────────────────────────
create table if not exists public.departments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  dept_key        text not null check (char_length(dept_key) <= 60),
  name            text not null check (char_length(name) between 2 and 200),
  icon            text default '📋',
  color           text default '#1B4332',
  head_name       text check (char_length(head_name) <= 200),
  is_active       boolean default true,
  sort_order      int default 0,
  created_at      timestamptz default now(),
  unique (org_id, dept_key)
);

alter table public.departments enable row level security;

-- ── 5. Chat messages ──────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organisations(id) on delete cascade,
  channel    text not null check (char_length(channel) <= 200),
  sender_id  uuid references public.workers(id) on delete set null,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz default now()
);

alter table public.chat_messages enable row level security;
alter publication supabase_realtime add table public.chat_messages;

-- ── 6. Prayer requests ────────────────────────────────────────────────────────
create table if not exists public.prayer_requests (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organisations(id) on delete cascade,
  author_id   uuid references public.workers(id) on delete set null,
  author_name text check (char_length(author_name) <= 200),
  branch_key  text,
  body        text not null check (char_length(body) between 1 and 2000),
  elevated    boolean default false,
  is_answered boolean default false,
  created_at  timestamptz default now()
);

alter table public.prayer_requests enable row level security;
alter publication supabase_realtime add table public.prayer_requests;

-- ── 7. Testimonies ────────────────────────────────────────────────────────────
create table if not exists public.testimonies (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organisations(id) on delete cascade,
  author_id   uuid references public.workers(id) on delete set null,
  author_name text check (char_length(author_name) <= 200),
  branch_key  text,
  category    text default 'General' check (char_length(category) <= 100),
  body        text not null check (char_length(body) between 1 and 3000),
  created_at  timestamptz default now()
);

alter table public.testimonies enable row level security;

-- ── 8. Soul records ───────────────────────────────────────────────────────────
create table if not exists public.soul_records (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references public.organisations(id) on delete cascade,
  first_name      text not null check (char_length(first_name) between 1 and 100),
  last_name       text not null check (char_length(last_name) between 1 and 100),
  phone           text check (char_length(phone) <= 30),
  email           text check (char_length(email) <= 200),
  branch_key      text,
  led_by          uuid references public.workers(id) on delete set null,
  service_date    date,
  follow_up_stage int default 1 check (follow_up_stage between 1 and 10),
  notes           text check (char_length(notes) <= 5000),
  created_at      timestamptz default now()
);

alter table public.soul_records enable row level security;

-- ── 9. Attendance logs ────────────────────────────────────────────────────────
create table if not exists public.attendance_logs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organisations(id) on delete cascade,
  branch_key   text not null,
  service_date date not null,
  service_name text check (char_length(service_name) <= 200),
  department   text check (char_length(department) <= 100),
  count        int not null check (count >= 0 and count <= 1000000),
  recorded_by  uuid references public.workers(id) on delete set null,
  created_at   timestamptz default now()
);

alter table public.attendance_logs enable row level security;

-- ── 10. Meetings ──────────────────────────────────────────────────────────────
create table if not exists public.meetings (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid references public.organisations(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 200),
  type           text not null default 'Peer',
  meeting_date   date not null,
  meeting_time   text check (char_length(meeting_time) <= 10),
  duration_mins  int default 60 check (duration_mins > 0 and duration_mins <= 480),
  agenda         text check (char_length(agenda) <= 5000),
  summary        text check (char_length(summary) <= 10000),
  meet_link      text check (char_length(meet_link) <= 500),
  attendants     jsonb,
  status         text default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_by     uuid references public.workers(id) on delete set null,
  created_at     timestamptz default now()
);

alter table public.meetings enable row level security;

-- ── 11. Announcements ─────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organisations(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 300),
  body         text not null check (char_length(body) between 1 and 10000),
  scope        text default 'all' check (scope in ('all','branch','admin','department')),
  branch_key   text,
  dept_key     text,
  status       text default 'published' check (status in ('draft','pending','published')),
  created_by   uuid references public.workers(id) on delete set null,
  created_at   timestamptz default now()
);

alter table public.announcements enable row level security;

-- ── 12. Volunteer slots ───────────────────────────────────────────────────────
create table if not exists public.volunteer_slots (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organisations(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  dept_key     text,
  branch_key   text,
  slot_date    date,
  spots_needed int default 1 check (spots_needed > 0),
  created_by   uuid references public.workers(id) on delete set null,
  created_at   timestamptz default now()
);

alter table public.volunteer_slots enable row level security;

create table if not exists public.volunteer_applications (
  id        uuid primary key default gen_random_uuid(),
  slot_id   uuid references public.volunteer_slots(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete cascade,
  note      text check (char_length(note) <= 1000),
  status    text default 'pending' check (status in ('pending','confirmed','declined')),
  created_at timestamptz default now(),
  unique (slot_id, worker_id)
);

alter table public.volunteer_applications enable row level security;

-- ── 13. Network opportunities ─────────────────────────────────────────────────
create table if not exists public.network_opportunities (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organisations(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  category     text check (char_length(category) <= 100),
  description  text check (char_length(description) <= 3000),
  contact_name text check (char_length(contact_name) <= 200),
  contact_info text check (char_length(contact_info) <= 300),
  posted_by    uuid references public.workers(id) on delete set null,
  expires_at   date,
  created_at   timestamptz default now()
);

alter table public.network_opportunities enable row level security;

-- ── 14. Login rate-limit tracking ─────────────────────────────────────────────
create table if not exists public.login_attempts (
  id           uuid primary key default gen_random_uuid(),
  email        text not null check (char_length(email) <= 200),
  ip_hash      text,          -- SHA-256 of client IP, never raw IP
  attempted_at timestamptz default now(),
  success      boolean default false
);

create index if not exists login_attempts_email_idx
  on public.login_attempts (lower(email), attempted_at);

-- Auto-clean attempts older than 24 hours (run as pg_cron or scheduled function)
-- delete from public.login_attempts where attempted_at < now() - interval '24 hours';

-- ── 15. Devotionals ───────────────────────────────────────────────────────────
create table if not exists public.devotionals (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid references public.organisations(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 300),
  body         text not null check (char_length(body) between 1 and 20000),
  scripture    text check (char_length(scripture) <= 2000),
  scripture_ref text check (char_length(scripture_ref) <= 100),
  author_id    uuid references public.workers(id) on delete set null,
  publish_date date not null default current_date,
  created_at   timestamptz default now()
);

alter table public.devotionals enable row level security;

-- ════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Get current worker's org_id
create or replace function get_my_org_id()
returns uuid language sql security definer stable as $$
  select org_id from public.workers where id = auth.uid() limit 1;
$$;

-- Get current worker's branch_key
create or replace function get_my_branch()
returns text language sql security definer stable as $$
  select branch_key from public.workers where id = auth.uid() limit 1;
$$;

-- Get current worker's role
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from public.workers where id = auth.uid() limit 1;
$$;

-- Is current user at least admin?
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select get_my_role() in ('developer','senior_pastor','pastor','admin');
$$;

-- Is current user at least unit head?
create or replace function is_unit_head()
returns boolean language sql security definer stable as $$
  select get_my_role() in ('developer','senior_pastor','pastor','admin','unit_head');
$$;

-- Is the developer super-admin?
create or replace function is_developer()
returns boolean language sql security definer stable as $$
  select get_my_role() = 'developer';
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- ── organisations ────────────────────────────────────────────────────────────
alter table public.organisations enable row level security;
drop policy if exists "org_select_own" on public.organisations;
drop policy if exists "org_update_admin" on public.organisations;
drop policy if exists "org_insert_developer" on public.organisations;

create policy "org_select_own"
  on public.organisations for select
  using (id = get_my_org_id() or is_developer());

create policy "org_update_admin"
  on public.organisations for update
  using (id = get_my_org_id() and is_admin());

-- ── branches ─────────────────────────────────────────────────────────────────
drop policy if exists "branches_select_own_org" on public.branches;
drop policy if exists "branches_write_admin" on public.branches;

create policy "branches_select_own_org"
  on public.branches for select
  using (org_id = get_my_org_id());

create policy "branches_write_admin"
  on public.branches for all
  using (org_id = get_my_org_id() and is_admin())
  with check (org_id = get_my_org_id() and is_admin());

-- ── workers ───────────────────────────────────────────────────────────────────
drop policy if exists "workers_select_same_org" on public.workers;
drop policy if exists "workers_update_own" on public.workers;
drop policy if exists "workers_update_admin" on public.workers;
drop policy if exists "workers_insert_service_role" on public.workers;
drop policy if exists "workers_delete_admin" on public.workers;

create policy "workers_select_same_org"
  on public.workers for select
  using (org_id = get_my_org_id() or is_developer());

create policy "workers_update_own"
  on public.workers for update
  using (id = auth.uid());

create policy "workers_update_admin"
  on public.workers for update
  using (org_id = get_my_org_id() and is_admin());

create policy "workers_delete_admin"
  on public.workers for delete
  using (org_id = get_my_org_id() and is_admin());

-- ── departments ───────────────────────────────────────────────────────────────
drop policy if exists "depts_select_own_org" on public.departments;
drop policy if exists "depts_write_admin" on public.departments;

create policy "depts_select_own_org"
  on public.departments for select
  using (org_id = get_my_org_id());

create policy "depts_write_admin"
  on public.departments for all
  using (org_id = get_my_org_id() and is_admin())
  with check (org_id = get_my_org_id() and is_admin());

-- ── chat_messages ─────────────────────────────────────────────────────────────
drop policy if exists "chat_select_same_org" on public.chat_messages;
drop policy if exists "chat_insert_own" on public.chat_messages;
drop policy if exists "chat_delete_own_or_admin" on public.chat_messages;

create policy "chat_select_same_org"
  on public.chat_messages for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "chat_insert_own"
  on public.chat_messages for insert
  with check (org_id = get_my_org_id() and sender_id = auth.uid());

create policy "chat_delete_own_or_admin"
  on public.chat_messages for delete
  using (sender_id = auth.uid() or (org_id = get_my_org_id() and is_admin()));

-- ── prayer_requests ───────────────────────────────────────────────────────────
drop policy if exists "prayer_select_same_org" on public.prayer_requests;
drop policy if exists "prayer_insert_own" on public.prayer_requests;
drop policy if exists "prayer_update_own_or_admin" on public.prayer_requests;
drop policy if exists "prayer_delete_own_or_admin" on public.prayer_requests;

create policy "prayer_select_same_org"
  on public.prayer_requests for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "prayer_insert_own"
  on public.prayer_requests for insert
  with check (org_id = get_my_org_id() and author_id = auth.uid());

create policy "prayer_update_own_or_admin"
  on public.prayer_requests for update
  using (author_id = auth.uid() or (org_id = get_my_org_id() and is_admin()));

create policy "prayer_delete_own_or_admin"
  on public.prayer_requests for delete
  using (author_id = auth.uid() or (org_id = get_my_org_id() and is_admin()));

-- ── testimonies ───────────────────────────────────────────────────────────────
drop policy if exists "testimonies_select_same_org" on public.testimonies;
drop policy if exists "testimonies_insert_own" on public.testimonies;
drop policy if exists "testimonies_delete_own_or_admin" on public.testimonies;

create policy "testimonies_select_same_org"
  on public.testimonies for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "testimonies_insert_own"
  on public.testimonies for insert
  with check (org_id = get_my_org_id() and author_id = auth.uid());

create policy "testimonies_delete_own_or_admin"
  on public.testimonies for delete
  using (author_id = auth.uid() or (org_id = get_my_org_id() and is_admin()));

-- ── soul_records ──────────────────────────────────────────────────────────────
drop policy if exists "souls_select_same_org" on public.soul_records;
drop policy if exists "souls_insert_authenticated" on public.soul_records;
drop policy if exists "souls_update_own_or_admin" on public.soul_records;
drop policy if exists "souls_delete_admin" on public.soul_records;

create policy "souls_select_same_org"
  on public.soul_records for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "souls_insert_authenticated"
  on public.soul_records for insert
  with check (org_id = get_my_org_id() and auth.uid() is not null);

create policy "souls_update_own_or_admin"
  on public.soul_records for update
  using (led_by = auth.uid() or (org_id = get_my_org_id() and is_admin()));

create policy "souls_delete_admin"
  on public.soul_records for delete
  using (org_id = get_my_org_id() and is_admin());

-- ── attendance_logs ───────────────────────────────────────────────────────────
drop policy if exists "attendance_select_same_org" on public.attendance_logs;
drop policy if exists "attendance_insert_unit_head" on public.attendance_logs;
drop policy if exists "attendance_delete_admin" on public.attendance_logs;

create policy "attendance_select_same_org"
  on public.attendance_logs for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "attendance_insert_unit_head"
  on public.attendance_logs for insert
  with check (org_id = get_my_org_id() and is_unit_head());

create policy "attendance_delete_admin"
  on public.attendance_logs for delete
  using (org_id = get_my_org_id() and is_admin());

-- ── meetings ──────────────────────────────────────────────────────────────────
drop policy if exists "meetings_select_same_org" on public.meetings;
drop policy if exists "meetings_insert_unit_head" on public.meetings;
drop policy if exists "meetings_update_creator_or_admin" on public.meetings;
drop policy if exists "meetings_delete_admin" on public.meetings;

create policy "meetings_select_same_org"
  on public.meetings for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "meetings_insert_unit_head"
  on public.meetings for insert
  with check (org_id = get_my_org_id() and is_unit_head());

create policy "meetings_update_creator_or_admin"
  on public.meetings for update
  using (created_by = auth.uid() or (org_id = get_my_org_id() and is_admin()));

create policy "meetings_delete_admin"
  on public.meetings for delete
  using (org_id = get_my_org_id() and is_admin());

-- ── announcements ─────────────────────────────────────────────────────────────
drop policy if exists "announcements_select_same_org" on public.announcements;
drop policy if exists "announcements_write_admin" on public.announcements;

create policy "announcements_select_same_org"
  on public.announcements for select
  using (org_id = get_my_org_id() and auth.uid() is not null
    and (scope = 'all'
      or (scope = 'branch' and branch_key = get_my_branch())
      or (scope = 'admin' and is_admin())));

create policy "announcements_write_admin"
  on public.announcements for all
  using (org_id = get_my_org_id() and is_admin())
  with check (org_id = get_my_org_id() and is_admin());

-- ── volunteer slots + applications ───────────────────────────────────────────
drop policy if exists "vol_slots_select_same_org" on public.volunteer_slots;
drop policy if exists "vol_slots_write_unit_head" on public.volunteer_slots;
drop policy if exists "vol_apps_select_same_org" on public.volunteer_applications;
drop policy if exists "vol_apps_insert_own" on public.volunteer_applications;
drop policy if exists "vol_apps_update_admin" on public.volunteer_applications;

create policy "vol_slots_select_same_org"
  on public.volunteer_slots for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "vol_slots_write_unit_head"
  on public.volunteer_slots for all
  using (org_id = get_my_org_id() and is_unit_head())
  with check (org_id = get_my_org_id() and is_unit_head());

create policy "vol_apps_select_same_org"
  on public.volunteer_applications for select
  using (auth.uid() is not null
    and (worker_id = auth.uid() or is_admin()));

create policy "vol_apps_insert_own"
  on public.volunteer_applications for insert
  with check (worker_id = auth.uid());

create policy "vol_apps_update_admin"
  on public.volunteer_applications for update
  using (is_admin());

-- ── network opportunities ─────────────────────────────────────────────────────
drop policy if exists "network_select_same_org" on public.network_opportunities;
drop policy if exists "network_insert_authenticated" on public.network_opportunities;
drop policy if exists "network_delete_own_or_admin" on public.network_opportunities;

create policy "network_select_same_org"
  on public.network_opportunities for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "network_insert_authenticated"
  on public.network_opportunities for insert
  with check (org_id = get_my_org_id() and auth.uid() is not null);

create policy "network_delete_own_or_admin"
  on public.network_opportunities for delete
  using (posted_by = auth.uid() or (org_id = get_my_org_id() and is_admin()));

-- ── devotionals ───────────────────────────────────────────────────────────────
drop policy if exists "devotionals_select_same_org" on public.devotionals;
drop policy if exists "devotionals_write_admin" on public.devotionals;

create policy "devotionals_select_same_org"
  on public.devotionals for select
  using (org_id = get_my_org_id() and auth.uid() is not null);

create policy "devotionals_write_admin"
  on public.devotionals for all
  using (org_id = get_my_org_id() and is_admin())
  with check (org_id = get_my_org_id() and is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create worker profile on signup
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid;
begin
  -- Get default org
  select id into v_org_id from public.organisations order by created_at limit 1;

  insert into public.workers (id, org_id, email, full_name, role, branch_key, department, phone)
  values (
    new.id,
    v_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'worker'),
    new.raw_user_meta_data->>'branch_key',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.workers.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- SEED: Developer super-admin (kennyappworld@gmail.com)
-- NOTE: Create this auth user first in Supabase Dashboard → Authentication
-- → Add User → email: kennyappworld@gmail.com, password: Password2026!
-- Then run this to set role:
-- ════════════════════════════════════════════════════════════════════════════
-- update public.workers
-- set role = 'developer', status = 'active', must_change_password = false
-- where email = 'kennyappworld@gmail.com';

-- ════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ════════════════════════════════════════════════════════════════════════════
create index if not exists workers_org_id_idx on public.workers(org_id);
create index if not exists workers_email_idx on public.workers(lower(email));
create index if not exists workers_branch_key_idx on public.workers(branch_key);
create index if not exists workers_role_idx on public.workers(role);
create index if not exists branches_org_id_idx on public.branches(org_id);
create index if not exists chat_messages_channel_idx on public.chat_messages(channel, created_at desc);
create index if not exists prayer_requests_org_idx on public.prayer_requests(org_id, created_at desc);
create index if not exists soul_records_org_branch_idx on public.soul_records(org_id, branch_key, created_at desc);
create index if not exists attendance_org_branch_idx on public.attendance_logs(org_id, branch_key, service_date desc);
create index if not exists soul_records_full_name_idx on public.soul_records using gin (
  to_tsvector('english', first_name || ' ' || last_name)
);
create index if not exists workers_full_name_idx on public.workers using gin (
  to_tsvector('simple', full_name)
);

-- ════════════════════════════════════════════════════════════════════════════
-- VIEWS (convenience, does not bypass RLS)
-- ════════════════════════════════════════════════════════════════════════════
create or replace view public.worker_summary as
  select
    w.id, w.org_id, w.email, w.full_name, w.role,
    w.branch_key, b.name as branch_name,
    w.department, w.phone, w.avatar_url,
    w.status, w.must_change_password, w.created_at, w.last_seen
  from public.workers w
  left join public.branches b on b.branch_key = w.branch_key and b.org_id = w.org_id;
