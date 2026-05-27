'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Overview from './sections/Overview'
import Growth from './sections/Growth'
import Members from './sections/Members'
import Chat from './sections/Chat'
import Prayer from './sections/Prayer'
import Testimony from './sections/Testimony'
import Giving from './sections/Giving'
import Attendance from './sections/Attendance'
import Volunteer from './sections/Volunteer'
import Events from './sections/Events'
import Announcements from './sections/Announcements'
import Feedback from './sections/Feedback'
import Settings from './sections/Settings'

const NAV = [
  { id:'overview',      icon:'◈', label:'Overview',          group:'main'       },
  { id:'growth',        icon:'📈', label:'Growth & Retention', group:'main'      },
  { id:'members',       icon:'👥', label:'Members',           group:'main'       },
  { id:'attendance',    icon:'✓',  label:'Attendance',        group:'main'       },
  { id:'giving',        icon:'₦',  label:'Giving',            group:'main'       },
  { id:'chat',          icon:'💬', label:'Community Chat',    group:'community'  },
  { id:'prayer',        icon:'🙏', label:'Prayer Wall',       group:'community'  },
  { id:'testimony',     icon:'🎉', label:'Testimonies',       group:'community'  },
  { id:'feedback',      icon:'📝', label:'Feedback',          group:'community'  },
  { id:'volunteer',     icon:'🤝', label:'Workforce',         group:'operations' },
  { id:'events',        icon:'📅', label:'Events',            group:'operations' },
  { id:'announcements', icon:'📢', label:'Announcements',     group:'operations' },
  { id:'settings',      icon:'⚙️', label:'Settings',          group:'admin'      },
]

const GROUPS = [
  { key:'main',       label:'Dashboard'   },
  { key:'community',  label:'Community'   },
  { key:'operations', label:'Operations'  },
  { key:'admin',      label:'Admin'       },
]

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('hicc_at')
    if (!token) router.replace('/login')
  }, [router])

  const logout = () => {
    sessionStorage.removeItem('hicc_at')
    router.push('/login')
  }

  const sections: Record<string, JSX.Element> = {
    overview:      <Overview onNavigate={setActive} />,
    growth:        <Growth />,
    members:       <Members />,
    attendance:    <Attendance />,
    giving:        <Giving />,
    chat:          <Chat />,
    prayer:        <Prayer />,
    testimony:     <Testimony />,
    feedback:      <Feedback />,
    volunteer:     <Volunteer />,
    events:        <Events />,
    announcements: <Announcements />,
    settings:      <Settings />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--s-1)' }}>
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--grad-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, boxShadow: 'var(--sh-brand)' }}>✦</div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 13.5, color: 'var(--t-1)', lineHeight: 1 }}>HICC</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t-3)', marginTop: 2, lineHeight: 1 }}>LEADERSHIP</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'auto' }}>
          {GROUPS.map(g => {
            const items = NAV.filter(n => n.group === g.key)
            return (
              <div key={g.key} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, fontWeight: 600, color: 'var(--t-3)', letterSpacing: '0.1em', padding: '0 6px 6px', textTransform: 'uppercase' }}>{g.label}</div>
                {items.map(item => (
                  <button key={item.id} className={`sidebar-link${active === item.id ? ' active' : ''}`} onClick={() => { setActive(item.id); setSidebarOpen(false) }}>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-sm)' }}>
            <div className="av av-sm" style={{ background: 'var(--brand-lt)', color: 'var(--brand)' }}>PB</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12.5, color: 'var(--t-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pastor Bolaji</div>
              <div style={{ fontSize: 10.5, color: 'var(--t-3)' }}>Senior Pastor</div>
            </div>
            <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-3)', fontSize: 14, padding: 4 }}>⏻</button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 'var(--sidebar-w)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', position: 'sticky', top: 0, zIndex: 30, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--t-2)', fontSize: 20, cursor: 'pointer' }} className="mobile-menu-btn">☰</button>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: 'var(--t-1)' }}>
              {NAV.find(n => n.id === active)?.label || 'Dashboard'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-3)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
            </div>
            <div className="badge badge-green" style={{ fontSize: 10 }}>● Live</div>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24, maxWidth: 1400, width: '100%' }}>
          {sections[active] || sections.overview}
        </main>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 39 }} />
      )}
    </div>
  )
}
