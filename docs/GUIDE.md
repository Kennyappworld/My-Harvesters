# HICC Leadership Platform v3.0
## Complete Guide — Tutorial · Functionality · Security

---

## 1. Platform Overview

The HICC Leadership Platform is a private, full-stack web application for all nine branches of Harvesters International Christian Centre. It gives senior leadership complete, real-time visibility across member growth, retention trends, community engagement, finances, and pastoral care.

**83,400 members · 9 branches · Nigeria, UK, USA**

---

## 2. Design System

Built to 2026 UI research standards:

| Decision | Rationale |
|----------|-----------|
| Dark-first design (`#09090B` base) | 80%+ of professional users prefer dark mode; reduces cognitive load |
| Semantic colour tokens | `--s-1` through `--s-5` surfaces, `--t-1/t-2/t-3` text hierarchy |
| WCAG AA contrast ratios baked in | Text contrast: 15.4:1 (primary), 7.2:1 (secondary), 4.6:1 (tertiary) |
| Bento grid layout | Modular asymmetric blocks for dense analytics without visual overload |
| Atmospheric gradients (structural) | Brand glow `rgba(245,158,11,0.07)` + accent glow — identity not decoration |
| Figtree (display) + DM Sans (body) | Characterful display font + refined readable body — never generic Inter/Roboto |
| JetBrains Mono for data/numbers | Numbers, percentages, member counts rendered in monospace for alignment |
| Amber-gold brand colour (`#F59E0B`) | Warmth, faith, light — distinctive from every corporate blue SaaS |

---

## 3. Project Structure

```
hicc-final/
├── frontend/                  Next.js 14 App Router (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css        Design system (tokens, bento, cards, buttons)
│   │   │   ├── layout.tsx         Root layout + Google Fonts
│   │   │   ├── page.tsx           Landing page (dark hero, bento, counters)
│   │   │   ├── login/page.tsx     Auth page (secure form)
│   │   │   └── dashboard/
│   │   │       ├── page.tsx       Dashboard shell (sidebar, routing)
│   │   │       └── sections/
│   │   │           ├── Overview.tsx     Dashboard KPIs + charts
│   │   │           ├── Growth.tsx       ★ 5-tab analytics centrepiece
│   │   │           ├── Chat.tsx         Tiered community chat
│   │   │           ├── Prayer.tsx       Prayer wall + elevation
│   │   │           ├── Testimony.tsx    Testimony feed
│   │   │           ├── Members.tsx      Member directory
│   │   │           ├── Volunteer.tsx    Workforce scheduler
│   │   │           ├── Giving.tsx       Finance analytics
│   │   │           ├── Attendance.tsx   Attendance logs
│   │   │           └── Settings.tsx     Platform configuration
│   │   └── lib/data.ts            Church data (replace with API calls)
│   ├── next.config.js             Security headers
│   ├── vercel.json                Vercel deployment
│   └── package.json
│
├── backend/                   Node.js / Express
│   ├── src/
│   │   ├── server.js              App entry + full security middleware
│   │   ├── middleware/
│   │   │   ├── auth.js            JWT verify + RBAC
│   │   │   ├── error.js           Global error handler
│   │   │   └── logger.js          Request ID injector
│   │   └── routes/
│   │       ├── auth.js            Login, refresh, logout, /me
│   │       ├── analytics.js       Growth, retention, funnel, churn
│   │       ├── members.js         Member CRUD
│   │       ├── branches.js        Branch management
│   │       ├── giving.js          Financial data
│   │       ├── chat.js            Chat channels
│   │       └── prayer.js          Prayer requests
│   ├── .env.example
│   └── package.json
│
├── docs/GUIDE.md               This file
├── .github/workflows/deploy.yml  GitHub Actions CI/CD
└── .gitignore
```

---

## 4. Local Development

### Prerequisites
- Node.js 20+ (`node --version`)
- npm 10+ (`npm --version`)
- Git

### Step 1 — Install

```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

### Step 2 — Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and generate real JWT secrets:

```bash
# Generate 64-byte secrets (run twice)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the two outputs as `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

```bash
cp frontend/.env.local.example frontend/.env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 3 — Run

**Terminal 1:**
```bash
cd backend && npm run dev
# API running on http://localhost:5000
```

**Terminal 2:**
```bash
cd frontend && npm run dev
# App running on http://localhost:3000
```

### Step 4 — Log in

Open `http://localhost:3000/login`

| Field    | Value             |
|----------|-------------------|
| Email    | pastor@hicc.org   |
| Password | demo123           |
| Role     | Senior Pastor (all branches) |

---

## 5. Deployment to GitHub + Vercel

### Push to GitHub

```bash
cd hicc-final

# Initialise git
git init
git add .
git commit -m "feat: HICC Leadership Platform v3.0"

# Create a new repo at github.com, then:
git remote add origin https://github.com/YOUR_ORG/hicc-platform.git
git branch -M main
git push -u origin main
```

### Set GitHub Secrets

Go to **GitHub → Settings → Secrets → Actions → New repository secret**:

| Secret              | Value |
|---------------------|-------|
| `VERCEL_TOKEN`      | Your token from vercel.com/account/tokens |
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g. `https://hicc-api.railway.app`) |

Every push to `main` now auto-builds and deploys to Vercel.

### Vercel manual setup (alternative)

1. vercel.com → New Project → Import from GitHub
2. Root directory: `frontend`
3. Framework: Next.js
4. Environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy

### Backend — Railway

```bash
npm install -g @railway/cli
cd backend
railway login
railway init        # creates a new Railway project
railway up          # deploys

# In Railway dashboard, add:
# JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ALLOWED_ORIGINS, NODE_ENV=production
```

### Post-deployment checklist

- [ ] `NODE_ENV=production` set on backend
- [ ] JWT secrets are 64+ bytes of random hex (not example values)
- [ ] `ALLOWED_ORIGINS` includes exact Vercel URL
- [ ] `NEXT_PUBLIC_API_URL` points to live backend
- [ ] HTTPS enforced on both (Vercel/Railway handle this automatically)

---

## 6. Growth & Retention Analytics

The centrepiece module — 5 tabs:

### Tab 1: New Members
- Stacked bar chart: monthly new members by branch (Jan–May)
- Branch filter: toggle any combination of the 9 branches
- All-branch area trend with % growth annotation
- Horizontal ranked bar: branches by May intake

### Tab 2: Retention
- Multi-line chart: rolling 90-day retention % per branch
- Dashed average line across all branches
- **Retention heatmap table**: 3-month, 6-month, 12-month per branch
  - Colour-coded: green ≥85%, amber 75–84%, red <75%
  - At-risk count and gone-quiet count per row
  - "Draft outreach" button per branch

### Tab 3: First-Timer Funnel
- Week selector (last 8 Sundays)
- Waterfall: First-time visitors → Returned week 2 → Joined small group → Became full member
- Conversion % at each stage
- Key insight callout: small group connection = strongest retention predictor

### Tab 4: Cohort Analysis
- Grouped bar chart: 3m vs 6m vs 12m retention per branch
- 12-month ranking (best to worst)
- Risk dashboard with total gone-quiet count + re-engagement CTA

### Tab 5: Churn Insights
- Pie chart: exit survey data by reason
- Intervention cards with priority (High/Medium/Low) per churn driver

---

## 7. Security Architecture

### Authentication flow

```
1. User POST /api/auth/login with email + password
2. Server validates with Zod, runs bcrypt.compare (constant-time, even if user not found)
3. On success: issues 15-min JWT access token + 7-day httpOnly Strict refresh cookie
4. Client stores access token in memory (NOT localStorage — XSS risk)
5. Every API call: Authorization: Bearer <accessToken>
6. At expiry: client calls POST /api/auth/refresh → new access token + rotated refresh cookie
7. On logout: refresh token revoked server-side; cookie cleared
```

### Role hierarchy

```
super_admin (5)
  └── senior_pastor (4)  — sees all branches
        └── branch_pastor (3)  — sees own branch
              └── unit_head (2)  — sees own unit
                    └── member (1)  — sees own profile
```

### What each OWASP control prevents

| Control | Threat prevented |
|---------|-----------------|
| `bcrypt.compare` always runs | User enumeration via timing attack |
| Generic "Invalid email or password" | Account existence enumeration |
| 15-min access token lifetime | Token theft window minimised |
| httpOnly + Secure + SameSite=Strict cookie | XSS + CSRF token theft |
| Refresh token rotation | Token replay after logout |
| Server-side jti revocation store | Token persistence after revocation |
| `express.json({ limit: '10kb' })` | Large-body DoS |
| `mongoSanitize()` | NoSQL injection ($-based attacks) |
| `xss-clean()` | Reflected XSS via inputs |
| `helmet()` CSP + HSTS | Clickjacking, protocol downgrade |
| CORS allowlist | Cross-origin request forgery |
| Rate limiting (10 fails/15min on auth) | Brute-force credential attacks |
| Zod validation on all bodies | Malformed input exploitation |
| `hp()` HPP filter | HTTP parameter pollution |
| Error handler strips stack traces in prod | Internal path disclosure |
| `app.disable('x-powered-by')` | Technology fingerprinting |

### Generating production secrets

```bash
# Run twice — one for access, one for refresh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never reuse between environments. Rotate every 90 days in production.

---

## 8. API Reference

Base URL: `https://your-api.com/api`

All protected routes: `Authorization: Bearer <token>`

### Auth endpoints

| Method | Path            | Auth | Description |
|--------|-----------------|------|-------------|
| POST   | /auth/login     | No   | Returns access token + sets refresh cookie |
| POST   | /auth/refresh   | No   | Rotates refresh token, returns new access token |
| POST   | /auth/logout    | Yes  | Revokes refresh token |
| GET    | /auth/me        | Yes  | Current user profile |

### Analytics endpoints

| Method | Path                   | Min role       | Description |
|--------|------------------------|----------------|-------------|
| GET    | /analytics/overview    | branch_pastor  | Platform-wide KPIs |
| GET    | /analytics/growth      | unit_head      | Monthly new members per branch |
| GET    | /analytics/retention   | branch_pastor  | Retention % monthly + cohorts |
| GET    | /analytics/funnel      | branch_pastor  | First-timer funnel (8 Sundays) |
| GET    | /analytics/churn       | senior_pastor  | Churn reasons + interventions |

### Response envelope

```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "string (on error)",
  "errors": { ... }  (on validation failure)
}
```

---

## 9. Role × Permission Matrix

| Capability                     | member | unit_head | branch_pastor | senior_pastor | super_admin |
|-------------------------------|:------:|:---------:|:-------------:|:-------------:|:-----------:|
| View own profile               | ✓ | ✓ | ✓ | ✓ | ✓ |
| Unit chat                      | ✓ | ✓ | ✓ | ✓ | ✓ |
| Peer cross-branch chat         |   | ✓ | ✓ | ✓ | ✓ |
| Leadership chat                |   |   | ✓ | ✓ | ✓ |
| Post prayer request            | ✓ | ✓ | ✓ | ✓ | ✓ |
| Elevate prayer to branch wall  |   | ✓ | ✓ | ✓ | ✓ |
| Elevate prayer to global       |   |   | ✓ | ✓ | ✓ |
| Growth analytics               |   | ✓ | ✓ | ✓ | ✓ |
| Retention heatmap              |   |   | ✓ | ✓ | ✓ |
| Churn data                     |   |   |   | ✓ | ✓ |
| All branches data              |   |   |   | ✓ | ✓ |
| Add/remove members             |   |   | ✓ | ✓ | ✓ |
| Approve events                 |   |   |   | ✓ | ✓ |
| Publish announcements          |   |   | ✓ | ✓ | ✓ |
| View giving data (own branch)  |   |   | ✓ | ✓ | ✓ |
| View all giving                |   |   |   | ✓ | ✓ |
| Admin settings                 |   |   |   | ✓ | ✓ |

---

## 10. Troubleshooting

**CORS error in browser**  
Check `ALLOWED_ORIGINS` in `backend/.env` exactly matches your frontend URL (no trailing slash).

**TOKEN_EXPIRED response**  
Call `POST /api/auth/refresh` with the `hicc_rt` cookie to get a new access token. For production, add an axios interceptor that does this automatically on 401 responses.

**Build fails on Vercel**  
Run `npm ci` locally in `frontend/`, then commit the updated `package-lock.json`.

**Charts don't render / SSR error**  
Recharts must run client-side. If you get hydration errors, add `'use client'` at the top of the chart component or use `dynamic(() => import(...), { ssr: false })`.

**Login fails in production but works locally**  
Check `NODE_ENV=production` is set on the backend (affects the `secure` flag on cookies). Also verify `JWT_ACCESS_SECRET` is set — the server logs a fatal error at startup if it's missing.

---

*HICC Leadership Platform v3.0 · Confidential · Internal use only*  
*© 2026 Harvesters International Christian Centre*
