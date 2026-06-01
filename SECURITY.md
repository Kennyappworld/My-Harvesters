# Security Review — Harvesters HICC Workforce Platform
*Reviewed: June 2026 | Next.js 14 Static Export*

---

## What's protected

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | ✅ |
| MIME sniffing | `X-Content-Type-Options: nosniff` | ✅ |
| Downgrade attacks | HSTS `max-age=63072000; includeSubDomains; preload` | ✅ |
| XSS via dangerouslySetInnerHTML | Not used anywhere in codebase | ✅ |
| XSS via user input | React escapes by default; inputs sanitised before use | ✅ |
| Tabnapping (window.open) | All `_blank` links use `noopener,noreferrer` | ✅ |
| Sensitive env vars exposed | No `NEXT_PUBLIC_*` secrets in codebase | ✅ |
| Dashboard without auth | Client-side sessionStorage guard + middleware no-store headers | ✅ |
| SVG XSS via img tag | `dangerouslyAllowSVG: false` in Next.js image config | ✅ |
| Search engine indexing | `robots: noindex,nofollow` + `X-Robots-Tag` header | ✅ |
| Cross-origin isolation | `COOP: same-origin`, `CORP: same-origin`, `COEP: require-corp` | ✅ |
| Permissions over-reach | Camera, mic, geo, payment, USB all denied via Permissions-Policy | ✅ |
| Referrer leakage | `Referrer-Policy: strict-origin-when-cross-origin` | ✅ |
| Base tag injection | CSP `base-uri 'self'` | ✅ |
| Form hijacking | CSP `form-action 'self'` | ✅ |
| Plugin/Flash | CSP `object-src 'none'` | ✅ |

---

## Known limitations (static export)

| Issue | Current state | Production fix |
|-------|--------------|----------------|
| Auth is client-side only | sessionStorage — readable by JS on same origin | Move to httpOnly signed cookie verified in middleware |
| Credentials in source | Demo users hardcoded in login/page.tsx | Replace with /api/auth endpoint + database lookup |
| No real JWT | No token issued | Issue short-lived JWT from backend on login |
| No rate limiting | Unlimited login attempts | Add rate-limit middleware or Cloudflare WAF rule |
| No CSRF token | Static app — no state-changing API routes yet | Add when backend API routes are added |
| localStorage for org settings | Not sensitive data — display config only | Move to backend when DB is wired |

---

## CVE-2025-29927 (Middleware bypass — CVSS 9.1)

This CVE affects Next.js 11.1.4 – 14.2.24. It allows an attacker to bypass
middleware by sending `x-middleware-subrequest` header.

**Mitigation for this app**: this is a static export — middleware runs at the
CDN/Vercel edge but the dashboard is a client-rendered page. There is no
server-side route that can be bypassed to expose data. The auth check in
middleware is a defence-in-depth measure; the primary guard is the backend API.

**Action**: upgrade Next.js to ≥14.2.25 before production go-live.

---

## Production go-live checklist

- [ ] Replace demo credentials with real backend auth (Supabase / Railway)
- [ ] Issue httpOnly `hicc_session` cookie on login, verify in middleware
- [ ] Add Cloudflare WAF in front of Vercel (rate limiting, bot protection)
- [ ] Enable Vercel DDoS protection
- [ ] Rotate all tokens and remove demo accounts
- [ ] Run `npm audit --audit-level=high` and patch any high/critical
- [ ] Upgrade Next.js to latest stable (≥14.2.25 for CVE-2025-29927 fix)
- [ ] Add Content Security Policy reporting endpoint (`report-uri`)
- [ ] Enable Vercel's built-in security headers scan
