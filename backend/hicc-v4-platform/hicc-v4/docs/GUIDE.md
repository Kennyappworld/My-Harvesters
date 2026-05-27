# HICC Leadership Platform v4.0
## Complete Guide — Deployment · API Reference · Security · Functionality

> **83,400 members · 9 branches · Nigeria, UK, USA**

---

## 1. What's in the Platform

| Module | What it does |
|--------|-------------|
| **Overview** | KPIs, alerts, branch snapshot, quick links |
| **Growth & Retention** | 5-tab analytics: new members by branch, retention heatmap, first-timer funnel, cohort analysis, churn insights |
| **Members** | Directory with Growth Passport (giving faithfulness, prayer activity, serving history, milestones) |
| **Attendance** | Weekly trend by branch, rate tracking |
| **Giving & Finance** | Multi-currency (₦/£/$), tithe/offering/special breakdown, year-on-year |
| **Community Chat** | Tiered: unit → peer cross-branch → leadership → HQ broadcast |
| **Prayer Wall** | Scoped requests with elevation system (unit → branch → global) |
| **Testimony Feed** | Branch-scoped testimonies, elevatable to org-wide |
| **Volunteer Scheduler** | Serving slots, sign-ups, capacity tracking |
| **Events** | Branch submission + central approval queue |
| **Announcements** | Broadcasts with read receipts |
| **Settings** | Platform config, role management |

---

## 2. Project Structure

```
hicc-v4/
├── frontend/                     Next.js 14 App Router (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css           Design system (tokens, bento, dark-first)
│   │   │   ├── layout.tsx            Root layout + Google Fonts
│   │   │   ├── page.tsx              Landing page
│   │   │   ├── login/page.tsx        Auth page
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          Dashboard shell + sidebar
│   │   │       └── sections/         All 12 module components
│   │   └── lib/data.ts               Church data (replace with API calls)
│   ├── next.config.js                Security headers
│   ├── vercel.json                   Vercel config
│   └── package.json
│
├── backend/                      Node.js / Express
│   ├── src/
│   │   ├── server.js                 App entry + all security middleware
│   │   ├── middleware/
│   │   │   ├── auth.js               JWT verify + RBAC + requireRole
│   │   │   ├── error.js              Global error handler
│   │   │   └── logger.js             Request ID injector
│   │   └── routes/
│   │       ├── auth.js               Login / refresh / logout / me
│   │       ├── analytics.js          Growth, retention, funnel, churn
│   │       ├── members.js            Member CRUD + growth passport
│   │       ├── branches.js           Branch management
│   │       ├── giving.js             Financial analytics
│   │       ├── chat.js               Tiered channels + messages
│   │       └── prayer.js             Prayer wall + elevation
│   ├── .env.example
│   └── package.json
│
├── docs/GUIDE.md                 This file
├── .github/workflows/deploy.yml  CI/CD (audit → build → deploy)
└── .gitignore
```

---

## 3. Local Development

### Prerequisites
- Node.js 20+ (`node --version`)
- npm 10+
- Git

### Step 1 — Install

```bash
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

### Step 2 — Environment

```bash
cp backend/.env.example backend/.env
```

Generate JWT secrets (run twice — one for each):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste into `backend/.env`:
```
JWT_ACCESS_SECRET=<64-byte-hex-from-above>
JWT_REFRESH_SECRET=<different-64-byte-hex>
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

```bash
cp frontend/.env.local.example frontend/.env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 3 — Run

**Terminal 1 (API):**
```bash
cd backend && npm run dev
# → http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
# → http://localhost:3000
```

### Demo credentials

| Email | Password | Role |
|-------|----------|------|
| pastor@hicc.org | demo123 | Senior Pastor (all branches) |
| gbagada@hicc.org | demo123 | Branch Pastor (Gbagada only) |

---

## 4. Deploy to GitHub + Vercel

### Push to GitHub

```bash
cd hicc-v4

git init
git add .
git commit -m "feat: HICC Leadership Platform v4.0"

# Create a new repo at github.com, then:
git remote add origin https://github.com/YOUR_ORG/hicc-platform.git
git branch -M main
git push -u origin main
```

### Set GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g. `https://hicc-api.railway.app`) |

Every push to `main` now automatically: audits deps → type-checks → builds → deploys.

### Vercel (manual alternative)

```bash
npm install -g vercel
cd frontend
vercel --prod
# Follow prompts: link project, set NEXT_PUBLIC_API_URL
```

### Backend — Railway

```bash
npm install -g @railway/cli
cd backend
railway login
railway init
railway up

# In Railway dashboard → Variables, add:
# NODE_ENV=production
# PORT=5000
# JWT_ACCESS_SECRET=<64-byte-hex>
# JWT_REFRESH_SECRET=<different-64-byte-hex>
# ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### Post-deployment checklist

- [ ] `NODE_ENV=production` on backend
- [ ] JWT secrets are real 64-byte random hex (not example values)
- [ ] `ALLOWED_ORIGINS` is exact Vercel URL (no trailing slash)
- [ ] `NEXT_PUBLIC_API_URL` points to live Railway URL
- [ ] HTTPS enforced on both ends (Vercel + Railway handle this)
- [ ] Run `npm audit --audit-level=high` in both dirs before go-live

---

## 5. API Reference

Base URL: `https://your-api.railway.app/api`

All protected routes require: `Authorization: Bearer <accessToken>`

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Returns access token + sets `hicc_rt` refresh cookie |
| POST | `/auth/refresh` | No | Rotates refresh token, returns new access token |
| POST | `/auth/logout` | Yes | Revokes token + clears cookie |
| GET | `/auth/me` | Yes | Current user profile |

### Analytics

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/analytics/overview` | branch_pastor | Platform KPIs |
| GET | `/analytics/growth` | unit_head | Monthly new members by branch |
| GET | `/analytics/retention` | branch_pastor | Retention % + cohort heatmap |
| GET | `/analytics/funnel` | branch_pastor | First-timer funnel (8 Sundays) |
| GET | `/analytics/cohort` | branch_pastor | Branch cohort comparison |
| GET | `/analytics/churn` | senior_pastor | Churn reasons + interventions |

### Members

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/members` | unit_head | Paginated member directory |
| GET | `/members/:id` | unit_head | Member profile + passport |
| GET | `/members/report/gone-quiet` | branch_pastor | Inactive members list |
| POST | `/members` | branch_pastor | Add member |
| PATCH | `/members/:id` | branch_pastor | Update member |

### Branches

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/branches` | branch_pastor | All accessible branches |
| GET | `/branches/:id` | branch_pastor | Branch detail + services |
| GET | `/branches/:id/summary` | unit_head | Branch summary stats |

### Giving

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/giving/overview` | senior_pastor | Org-wide totals + monthly trend |
| GET | `/giving/branch/:id` | branch_pastor | Branch giving breakdown |
| GET | `/giving/all-branches` | senior_pastor | Cross-branch comparison |

### Chat

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/chat/channels` | member | Accessible channels for user |
| GET | `/chat/channels/:id/messages` | member | Last 50 messages |
| POST | `/chat/channels/:id/messages` | member | Send message |

### Prayer

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/prayer` | member | Visible prayer requests |
| POST | `/prayer` | member | Post prayer request |
| POST | `/prayer/:id/elevate` | unit_head | Elevate to next level |
| POST | `/prayer/:id/intercede` | member | Add intercessor count |
| DELETE | `/prayer/:id` | branch_pastor | Remove request |

### Response envelope

```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "string (on error)",
  "errors": { "field": "message" }
}
```

---

## 6. Role × Permission Matrix

| Capability | member | unit_head | branch_pastor | senior_pastor | super_admin |
|-----------|:------:|:---------:|:-------------:|:-------------:|:-----------:|
| View own profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Unit chat | ✓ | ✓ | ✓ | ✓ | ✓ |
| Peer cross-branch chat | | ✓ | ✓ | ✓ | ✓ |
| Leadership channel | | | ✓ | ✓ | ✓ |
| HQ broadcast (post) | | | | ✓ | ✓ |
| Post prayer request | ✓ | ✓ | ✓ | ✓ | ✓ |
| Elevate to branch | | ✓ | ✓ | ✓ | ✓ |
| Elevate to global | | | ✓ | ✓ | ✓ |
| Growth analytics | | ✓ | ✓ | ✓ | ✓ |
| Retention heatmap | | | ✓ | ✓ | ✓ |
| Churn data | | | | ✓ | ✓ |
| All branches data | | | | ✓ | ✓ |
| Add/edit members | | | ✓ | ✓ | ✓ |
| View giving (own branch) | | | ✓ | ✓ | ✓ |
| View all giving | | | | ✓ | ✓ |
| Approve events | | | | ✓ | ✓ |

---

## 7. Security Architecture

### Authentication flow

```
1. POST /auth/login → bcrypt.compare (runs even if user not found)
2. On success: 15-min JWT access token (memory only, NOT localStorage)
              + 7-day httpOnly Secure SameSite=Strict refresh cookie
3. Every API call: Authorization: Bearer <accessToken>
4. On 401: POST /auth/refresh → new access token + rotated refresh cookie
5. On logout: jti revoked server-side + cookie cleared
```

### OWASP Top 10 2025 controls

| Control | Threat prevented |
|---------|-----------------|
| `bcrypt.compare` always runs | User enumeration via timing attack |
| Generic "Invalid email or password" | Account existence enumeration |
| 15-min access token + rotation | Token theft window minimised |
| `httpOnly Secure SameSite=Strict` cookie | XSS + CSRF token theft |
| Server-side jti revocation | Token replay after logout |
| `express.json({ limit: '10kb' })` | Large-body DoS |
| `mongoSanitize()` | NoSQL injection |
| `xss-clean()` | Reflected XSS |
| `helmet()` CSP + HSTS | Clickjacking, downgrade attacks |
| Explicit CORS allowlist | Cross-origin request forgery |
| Rate limiting (10 fails/15min auth) | Brute-force |
| Zod on all request bodies | Malformed input exploitation |
| `hpp()` | HTTP parameter pollution |
| Error handler strips stack in prod | Internal path disclosure |
| `app.disable('x-powered-by')` | Technology fingerprinting |
| Algorithm pinned to HS256 | `alg:none` / downgrade attacks |

### Generate production secrets

```bash
# Run once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Rotate every 90 days in production.

---

## 8. Growth & Retention Analytics (5 Tabs)

| Tab | What leadership sees |
|-----|---------------------|
| **New Members** | Stacked bar by branch (Jan–May) + area trend + May ranking |
| **Retention** | Multi-line 90-day rolling % + cohort heatmap (3m/6m/12m, green→red) + draft outreach |
| **First-Timer Funnel** | Week selector, waterfall: Visitor → Returned Wk2 → Small Group → Member |
| **Cohort Analysis** | Branch comparison bar + 12-month ranking + risk dashboard |
| **Churn Insights** | Exit survey pie chart + prioritised intervention cards |

Key insight surfaced: small group connection is the strongest predictor of 12-month retention. Members who join a small group within 3 months retain at 91% vs 61% for those who don't.

---

## 9. Chat System — Tiered Access

```
HQ Broadcast      ← senior_pastor only can post; everyone can read
    │
Leadership Council ← branch_pastor+ (all pastors, cross-branch)
    │
Peer Cross-Branch  ← unit_head+ (e.g. all KidsHouse heads, all Worship leads)
    │
Unit Chat          ← all members within same unit/branch
```

This ensures cross-pollination of ideas (unit heads learning from each other across Lekki, London, Houston) while keeping sensitive leadership discussions appropriately scoped.

---

## 10. Prayer Wall — Elevation System

```
private → unit → branch → global
```

- Members post to `unit` by default (visible to their unit in their branch)
- Unit heads can elevate to `branch` (visible to whole branch)
- Branch pastors can elevate to `global` (visible to all 83,400 members)
- Senior pastors can elevate from any branch

This respects privacy while allowing the whole body to intercede for genuinely shared needs.

---

## 11. Troubleshooting

**CORS error in browser**
Check `ALLOWED_ORIGINS` in `backend/.env` exactly matches your frontend URL (no trailing slash, no wildcard).

**TOKEN_EXPIRED on API calls**
Implement an axios interceptor in the frontend that calls `POST /api/auth/refresh` on 401 responses, then retries the original request.

**Build fails on Vercel**
Run `npm ci` locally in `frontend/`, commit the updated `package-lock.json`, then push again.

**Login works locally but fails in production**
Verify `NODE_ENV=production` is set on the backend (affects the `secure` flag on cookies). Also confirm `JWT_ACCESS_SECRET` is set — the server exits at startup if missing.

**Charts don't render (SSR error)**
Recharts must run client-side. Add `'use client'` at the top of any component that imports from recharts, or use `dynamic(() => import(...), { ssr: false })`.

---

*HICC Leadership Platform v4.0 · Confidential · Internal use only*
*© 2026 Harvesters International Christian Centre*
