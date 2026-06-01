-- HICC Workforce Platform — Database Schema
-- Run this in Supabase → SQL Editor → New query → Run

-- Workers profile table (extends Supabase auth.users)
create table if not exists public.workers (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text not null,
  role          text not null default 'worker',
  branch_id     text not null default 'lekki',
  department    text,
  phone         text,
  avatar_url    text,
  created_at    timestamptz default now(),
  last_seen     timestamptz
);
alter table public.workers enable row level security;
create policy "Workers can view all workers" on public.workers for select using (true);
create policy "Workers can update their own profile" on public.workers for update using (auth.uid() = id);
create policy "Workers can insert their own profile" on public.workers for insert with check (auth.uid() = id);

-- Auto-create worker profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workers (id, email, full_name, role, branch_id, department, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'worker'),
    coalesce(new.raw_user_meta_data->>'branch_id', 'lekki'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Chat messages (real-time enabled)
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel    text not null,
  sender_id  uuid references public.workers(id),
  sender_name text,
  body       text not null,
  created_at timestamptz default now()
);
alter table public.chat_messages enable row level security;
create policy "Workers can read and send chat" on public.chat_messages for all using (true);

-- Prayer requests
create table if not exists public.prayer_requests (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references public.workers(id),
  author_name text,
  branch_id  text not null default 'lekki',
  body       text not null,
  elevated   boolean default false,
  created_at timestamptz default now()
);
alter table public.prayer_requests enable row level security;
create policy "Workers can manage prayer requests" on public.prayer_requests for all using (true);

-- Testimonies
create table if not exists public.testimonies (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid references public.workers(id),
  author_name text,
  branch_id  text not null default 'lekki',
  category   text default 'General',
  body       text not null,
  created_at timestamptz default now()
);
alter table public.testimonies enable row level security;
create policy "Workers can read and create testimonies" on public.testimonies for all using (true);

-- Soul records (new converts)
create table if not exists public.soul_records (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  phone         text,
  email         text,
  branch_id     text not null,
  led_by        uuid references public.workers(id),
  service_date  date,
  follow_up_stage int default 1,
  notes         text,
  created_at    timestamptz default now()
);
alter table public.soul_records enable row level security;
create policy "Workers can manage soul records" on public.soul_records for all using (true);

-- Attendance logs
create table if not exists public.attendance_logs (
  id           uuid primary key default gen_random_uuid(),
  branch_id    text not null,
  service_date date not null,
  department   text,
  count        int not null,
  recorded_by  uuid references public.workers(id),
  created_at   timestamptz default now()
);
alter table public.attendance_logs enable row level security;
create policy "Workers can log and view attendance" on public.attendance_logs for all using (true);

-- Announcements
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  scope        text default 'all',
  branch_id    text,
  author_id    uuid references public.workers(id),
  created_at   timestamptz default now()
);
alter table public.announcements enable row level security;
create policy "Workers can read and create announcements" on public.announcements for all using (true);

-- Enable real-time on chat and prayer
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.prayer_requests;

