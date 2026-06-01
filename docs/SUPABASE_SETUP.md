# Connecting Supabase — HICC Workforce Platform

This takes about 15 minutes and gives you real authentication, live chat, persistent data, and push notifications that work across every browser and device.

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project**
3. Name it `hicc-workforce`
4. Choose **Frankfurt** or **London** as the region (closest to Nigeria with good latency)
5. Set a strong database password and save it somewhere safe
6. Wait ~2 minutes for the project to spin up

---

## Step 2 — Copy your API keys

1. In your Supabase dashboard → **Settings** → **API**
2. Copy **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy **anon / public** key (starts with `eyJhbGc...`)

---

## Step 3 — Add keys to Vercel

1. Go to [vercel.com](https://vercel.com) → your `my-harvesters` project
2. **Settings** → **Environment Variables**
3. Add these two:
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
4. Click **Save** — Vercel will redeploy automatically

---

## Step 4 — Run the database schema

1. In Supabase → **SQL Editor** → **New query**
2. Open `frontend/src/lib/supabase.ts` and copy the SQL block inside the large comment
3. Paste it into the SQL editor
4. Click **Run** — you'll see green checkmarks for each table

---

## Step 5 — Create worker accounts

Option A — Supabase dashboard (easiest):
1. **Authentication** → **Users** → **Invite user**
2. Enter the worker's email — they get a magic link to set their password

Option B — Bulk import via CSV:
1. Prepare a CSV: `email, full_name, role, branch_id, department`
2. **SQL Editor** → paste and run:
   ```sql
   insert into workers (email, full_name, role, branch_id, department)
   values
     ('pastor@harvesters.org', 'Pastor Bolaji Idowu', 'senior_pastor', 'lekki', 'Leadership'),
     ('worship@harvesters.org', 'Name Here', 'worker', 'lekki', 'Worship');
   ```

---

## What goes live immediately after connecting

| Feature | Before Supabase | After Supabase |
|---|---|---|
| Login | Demo password only | Real accounts, email reset |
| Chat | Local session only | Live across all devices |
| Prayer wall | Resets on refresh | Persistent, cross-branch |
| Attendance | Local only | Synced, reportable |
| Soul records | Local only | Team-wide, follow-up tracked |
| Push notifications | Browser only | Any device, any session |
| Data on reload | **Lost** | **Persisted** |

---

## Cost

The free tier handles:
- 500MB database
- 50,000 monthly active users  
- 2GB bandwidth
- Unlimited real-time connections

For a 9-branch church workforce app this is more than enough unless you have 500+ daily active users, which is when the $25/month Pro plan kicks in.

---

## Need help?

Contact Anchorsuites Technologies Ltd — the team that built this platform — for guided deployment support.
