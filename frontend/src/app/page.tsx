'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import { getOrgSettings } from '@/lib/orgSettings'

export default function Landing() {
  const [logoUrl, setLogoUrl] = useState('')
  const [appName, setAppName] = useState('SanctuaryHQ')

  useEffect(() => {
    const s = getOrgSettings()
    if (s.logoUrl) setLogoUrl(s.logoUrl)
    if (s.appName) setAppName(s.appName)
  }, [])

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: '#06090f',
      color: '#e8edf5',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Background decorations ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-15%', right: '-8%',
          width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}/>
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,130,246,0.05) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}/>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }}/>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #1e2d45',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(6,9,15,0.88)',
        padding: '0 1.5rem',
      }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#111827',
              border: '1px solid rgba(201,168,76,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(201,168,76,0.12)',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {logoUrl
                ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" width="17" height="17">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
              }
            </div>
            <span style={{
              fontSize: 15, fontWeight: 600,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              letterSpacing: '0.01em',
              color: '#e8edf5',
            }}>
              {appName}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/signup" style={{
              fontSize: 13, color: '#7a8fa8',
              textDecoration: 'none', padding: '7px 14px',
              borderRadius: 8,
              transition: 'color .12s',
              fontWeight: 500,
            }}>
              Register
            </Link>
            <Link href="/login" style={{
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
              border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: 8,
              color: '#06090f',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 12px rgba(201,168,76,0.22)',
            }}>
              Sign in
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem 5rem',
        position: 'relative', zIndex: 1,
      }}>

        {/* Gold overline label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(201,168,76,0.07)',
          border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 99, padding: '5px 14px',
          marginBottom: 28,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px rgba(201,168,76,0.6)' }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {appName}
          </span>
        </div>

        {/* Logo mark */}
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: '#111827',
          border: '1px solid rgba(201,168,76,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 30px',
          boxShadow: '0 12px 48px rgba(201,168,76,0.16), 0 4px 12px rgba(0,0,0,0.5)',
          animation: 'glow-pulse 3s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <svg viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" width="34" height="34">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
          }
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          color: '#e8edf5',
          marginBottom: 20,
          maxWidth: 700,
        }}>
          Your Church,<br/>
          <span style={{ color: '#c9a84c' }}>Fully Organised</span>
        </h1>

        {/* Subhead */}
        <p style={{
          fontSize: 'clamp(14px, 1.8vw, 16.5px)',
          color: '#7a8fa8',
          lineHeight: 1.75,
          maxWidth: 460,
          marginBottom: 44,
        }}>
          SanctuaryHQ brings your entire ministry team into one platform — members, attendance, departments, events, and more. Built for churches of every size.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login" style={{
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 36px',
            background: 'linear-gradient(135deg, #8a6a20 0%, #c9a84c 60%, #e2c06c 100%)',
            border: '1px solid rgba(201,168,76,0.40)',
            borderRadius: 14,
            color: '#06090f',
            fontSize: 15, fontWeight: 700,
            boxShadow: '0 4px 28px rgba(201,168,76,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
            letterSpacing: '-0.01em',
          }}>
            Sign in to your account
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          <Link href="/signup" style={{
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px',
            border: '1px solid #1e2d45',
            borderRadius: 14,
            fontSize: 14,
            color: '#a0b0c8',
            fontWeight: 500,
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all .15s',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Register as a worker
          </Link>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: 20, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: '🔒', text: 'Secure & encrypted' },
            { icon: '⚡', text: 'Real-time sync' },
            { icon: '📱', text: 'Works on any device' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4a6080' }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #1e2d45',
        padding: '1rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontSize: 11, color: '#2a3f5f' }}>
          © {new Date().getFullYear()} SanctuaryHQ. All rights reserved.
        </p>
        <PoweredBy dark />
      </footer>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 12px 48px rgba(201,168,76,0.16), 0 4px 12px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 12px 60px rgba(201,168,76,0.35), 0 4px 12px rgba(0,0,0,0.5); }
        }
      `}</style>
    </div>
  )
}
