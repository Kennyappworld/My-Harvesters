'use client'
import { useEffect, useState } from 'react'
import { getOrgSettings, type OrgSettings } from './orgSettings'

type Props = {
  dark?: boolean   // true = white text (dark bg), false = muted text (light bg)
}

export default function PoweredBy({ dark = false }: Props) {
  const [settings, setSettings] = useState<OrgSettings | null>(null)

  useEffect(() => {
    setSettings(getOrgSettings())
  }, [])

  if (!settings?.poweredByVisible) return null

  const textColor = dark ? 'rgba(255,255,255,0.22)' : 'rgba(13,31,22,0.28)'
  const accentColor = dark ? 'rgba(201,168,76,0.55)' : 'var(--gold-dk)'
  const dividerColor = dark ? 'rgba(255,255,255,0.08)' : 'var(--border)'

  return (
    <div style={{
      borderTop: `1px solid ${dividerColor}`,
      padding: '10px 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}>
      {/* Anchor icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.8" width="11" height="11">
        <circle cx="12" cy="5" r="3"/>
        <line x1="12" y1="8" x2="12" y2="21"/>
        <path d="M5 15a7 7 0 0 0 14 0"/>
      </svg>
      <a
        href={settings.poweredByUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 10.5,
          color: textColor,
          textDecoration: 'none',
          letterSpacing: '0.03em',
          fontFamily: 'var(--font-body)',
          transition: 'color .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
        onMouseLeave={e => (e.currentTarget.style.color = textColor)}
      >
        {settings.poweredByText}
      </a>
    </div>
  )
}
