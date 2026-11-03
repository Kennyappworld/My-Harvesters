-- ════════════════════════════════════════════════════════════════════════════
-- SanctuaryHQ — security fix (November 2026)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run more than once. Nothing here deletes any member data.
-- ════════════════════════════════════════════════════════════════════════════

-- ── STEP 0 (optional, read-only): see the problem first ──────────────────────
-- Rules whose condition is literally "true" let ANYONE with the public app key
-- (it ships inside the website) read or change that table.
--
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and (qual = 'true' or with_check = 'true')
--   order by tablename;

begin;

-- ── 1. Remove "open to everyone" rules ───────────────────────────────────────
-- Database rules add up: while an open rule exists, the stricter rules next to
-- it protect nothing. An open rule is removed only when the table has another,
-- stricter rule for the same action, so no screen loses access it should have.
do $$
declare r record;
begin
  for r in
    select p.tablename, p.policyname, p.cmd
    from pg_policies p
    where p.schemaname = 'public'
      and (p.qual = 'true' or p.with_check = 'true')
  loop
    if exists (
      select 1 from pg_policies s
      where s.schemaname = 'public'
        and s.tablename = r.tablename
        and s.policyname <> r.policyname
        and coalesce(s.qual, '') <> 'true'
        and coalesce(s.with_check, '') <> 'true'
        and (s.cmd = r.cmd or s.cmd = 'ALL' or r.cmd = 'ALL')
    ) then
      execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
      raise notice 'Removed open rule "%" on %', r.policyname, r.tablename;
    else
      raise notice 'KEPT open rule "%" on % (no stricter rule exists yet — ask your developer)', r.policyname, r.tablename;
    end if;
  end loop;
end $$;

-- ── 2. Allow every role and status the app actually uses ─────────────────────
alter table public.workers drop constraint if exists workers_role_check;
alter table public.workers add constraint workers_role_check check (
  role in ('developer','senior_pastor','pastor','ops_head','admin_head','admin','unit_head','worker','guest')
);
alter table public.workers drop constraint if exists workers_status_check;
alter table public.workers add constraint workers_status_check check (
  status is null or status in ('pending','active','suspended','inactive','deleted')
);

-- ── 3. Stop people promoting themselves ──────────────────────────────────────
-- The rule "workers can update their own record" covered every column, so any
-- member could set their own role to 'developer' straight through the database.
-- This trigger lets only higher-ranked admins change role, status, church or
-- email, and never on their own record. The app's server (service key) and the
-- SQL editor are unaffected.
create or replace function public.protect_worker_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lvl constant jsonb := '{"developer":7,"senior_pastor":6,"pastor":5,"ops_head":4,"admin_head":4,"admin":3,"unit_head":2,"worker":1,"guest":0}';
  caller_role  text;
  caller_level int;
begin
  -- Trusted callers: the app's server (service role) and the SQL editor.
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') then
    return new;
  end if;

  select role into caller_role from public.workers where id = auth.uid();
  caller_level := coalesce((lvl ->> caller_role)::int, 0);

  if tg_op = 'INSERT' then
    -- New members are created by the server (sign-up page / admin "create account").
    if caller_role = 'developer' then return new; end if;
    raise exception 'New members must be added through the app' using errcode = '42501';
  end if;

  if new.role   is not distinct from old.role
     and new.status is not distinct from old.status
     and new.org_id is not distinct from old.org_id
     and new.email  is not distinct from old.email then
    return new;  -- ordinary profile edit
  end if;

  if caller_role = 'developer' then return new; end if;

  if new.id = auth.uid() then
    raise exception 'You cannot change your own role, status, church or email' using errcode = '42501';
  end if;
  if caller_level < 3 then
    raise exception 'Only administrators can change role or status' using errcode = '42501';
  end if;
  if coalesce((lvl ->> old.role)::int, 1) >= caller_level
     or coalesce((lvl ->> new.role)::int, 1) >= caller_level then
    raise exception 'You can only manage people below your own rank' using errcode = '42501';
  end if;
  if new.org_id is distinct from old.org_id or new.email is distinct from old.email then
    raise exception 'Church and email can only be changed by the developer' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_worker_privileged_columns on public.workers;
create trigger protect_worker_privileged_columns
  before insert or update on public.workers
  for each row execute function public.protect_worker_privileged_columns();

commit;

-- ── STEP 4 (read-only): confirm ──────────────────────────────────────────────
-- Should return no rows (or only rows the notices said were KEPT):
--   select tablename, policyname from pg_policies
--   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
