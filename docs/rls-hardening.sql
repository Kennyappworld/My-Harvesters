-- HICC Workforce Platform — RLS Hardening
-- Run this in Supabase → SQL Editor to tighten data access
-- IMPORTANT: Run AFTER deploying the app and confirming login works

-- Workers table: require authentication to read
drop policy if exists "Workers can view all workers" on public.workers;
create policy "Authenticated workers can view workers"
  on public.workers for select
  using (auth.uid() is not null);

-- Chat messages: require authentication
drop policy if exists "Chat access" on public.chat_messages;
create policy "Authenticated workers can read and send chat"
  on public.chat_messages for all
  using (auth.uid() is not null);

-- Prayer requests: require authentication
drop policy if exists "Prayer access" on public.prayer_requests;
create policy "Authenticated workers can manage prayer requests"
  on public.prayer_requests for all
  using (auth.uid() is not null);

-- Testimonies: require authentication
drop policy if exists "Testimony access" on public.testimonies;
create policy "Authenticated workers can read and create testimonies"
  on public.testimonies for all
  using (auth.uid() is not null);

-- Soul records: require authentication + restrict writes to own records
drop policy if exists "Soul records access" on public.soul_records;
create policy "Authenticated workers can read soul records"
  on public.soul_records for select
  using (auth.uid() is not null);
create policy "Workers can insert soul records they lead"
  on public.soul_records for insert
  with check (auth.uid() is not null and led_by = auth.uid());
create policy "Workers can update their own soul records"
  on public.soul_records for update
  using (auth.uid() is not null and led_by = auth.uid());

-- Attendance logs: require authentication
drop policy if exists "Attendance access" on public.attendance_logs;
create policy "Authenticated workers can log and view attendance"
  on public.attendance_logs for all
  using (auth.uid() is not null);

-- Announcements: require authentication to read
drop policy if exists "Announcements access" on public.announcements;
create policy "Authenticated workers can read announcements"
  on public.announcements for select
  using (auth.uid() is not null);
create policy "Authenticated workers can create announcements"
  on public.announcements for insert
  with check (auth.uid() is not null);
