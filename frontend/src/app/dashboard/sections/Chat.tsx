'use client'
import { useState, useRef, useEffect } from 'react'
import { chatChannels } from '@/lib/data'

type Message = { from:string; initials:string; avatar:string; text:string; time:string; mine:boolean }
type Channel  = { id:string; label:string; scope:string; avatar:string; initials:string; sub:string; unread:number; messages:Message[] }

const AV_COLORS: Record<string,string> = {
  blue:'#3B82F6', amber:'var(--brand)', teal:'var(--accent)', purple:'#A855F7', red:'#EF4444', green:'#22C55E'
}

const SCOPE_LABELS: Record<string,{badge:string;cls:string;desc:string}> = {
  leadership: { badge:'Leadership Council', cls:'badge-red',    desc:'Senior pastors across all branches' },
  peer:       { badge:'Peer Channel',       cls:'badge-amber',  desc:'Same-role leaders across all branches' },
  unit:       { badge:'Unit Chat',          cls:'badge-teal',   desc:'Members within your unit / small group' },
}

export default function Chat() {
  const [channels, setChannels] = useState<Channel[]>(chatChannels as Channel[])
  const [activeId, setActiveId] = useState(channels[0].id)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const active = channels.find(c => c.id === activeId)!

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [activeId, active?.messages.length])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setChannels(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, { from:'You', initials:'PB', avatar:'blue', text, time: new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}), mine:true }]
    } : c))
    setInput('')
  }

  return (
    <div className="fade-in" style={{ height:'calc(100vh - 110px)', display:'flex', gap:12 }}>
      {/* Sidebar */}
      <div style={{
        width:260, flexShrink:0, background:'var(--s-2)',
        borderRadius:'var(--r-lg)', border:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:14, color:'var(--t-1)' }}>Channels</div>
          <div style={{ fontSize:12, color:'var(--t-3)', marginTop:2 }}>Tiered by your role</div>
        </div>
        {(['leadership','peer','unit'] as const).map(scope => {
          const items = channels.filter(c => c.scope === scope)
          if (!items.length) return null
          const s = SCOPE_LABELS[scope]
          return (
            <div key={scope} style={{ padding:'10px 10px 0' }}>
              <div style={{ fontSize:10, fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--t-3)', padding:'0 6px 6px', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {s.badge}
              </div>
              {items.map(c => (
                <button key={c.id}
                  onClick={() => setActiveId(c.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'9px 10px', borderRadius:'var(--r-sm)',
                    background: activeId===c.id ? 'var(--brand-lt)' : 'transparent',
                    border: activeId===c.id ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                    cursor:'pointer', width:'100%', textAlign:'left', transition:'all 0.16s',
                    marginBottom:2,
                  }}
                >
                  <div className="av av-sm" style={{ background:`${AV_COLORS[c.avatar]}22`, color:AV_COLORS[c.avatar] }}>{c.initials}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontWeight:500, fontSize:12.5, color: activeId===c.id ? 'var(--brand)' : 'var(--t-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.label}</div>
                    <div style={{ fontSize:10.5, color:'var(--t-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.sub}</div>
                  </div>
                  {c.unread > 0 && (
                    <div style={{ background:'var(--red)', color:'white', borderRadius:99, fontSize:10, fontWeight:700, padding:'2px 6px', fontFamily:'var(--font-mono)', flexShrink:0 }}>{c.unread}</div>
                  )}
                </button>
              ))}
            </div>
          )
        })}
      </div>

      {/* Chat window */}
      <div style={{
        flex:1, background:'var(--s-2)',
        borderRadius:'var(--r-lg)', border:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
          <div className="av av-md" style={{ background:`${AV_COLORS[active.avatar]}22`, color:AV_COLORS[active.avatar] }}>{active.initials}</div>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:15, color:'var(--t-1)' }}>{active.label}</div>
            <div style={{ fontSize:12, color:'var(--t-3)' }}>{active.sub}</div>
          </div>
          <span className={`badge ${SCOPE_LABELS[active.scope]?.cls} ml-auto`} style={{ marginLeft:'auto' }}>{SCOPE_LABELS[active.scope]?.badge}</span>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflow:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
          {active.messages.map((m, i) => (
            <div key={i} style={{ display:'flex', flexDirection:m.mine?'row-reverse':'row', alignItems:'flex-end', gap:8 }}>
              {!m.mine && (
                <div className="av av-sm" style={{ background:`${AV_COLORS[m.avatar]||AV_COLORS.blue}22`, color:AV_COLORS[m.avatar]||AV_COLORS.blue, flexShrink:0 }}>{m.initials}</div>
              )}
              <div style={{ display:'flex', flexDirection:'column', alignItems:m.mine?'flex-end':'flex-start', gap:4, maxWidth:'70%' }}>
                {!m.mine && <div style={{ fontSize:11.5, color:'var(--t-3)', fontFamily:'var(--font-heading)', fontWeight:500, paddingLeft:2 }}>{m.from}</div>}
                <div className={`msg-bubble ${m.mine?'mine':'other'}`}>{m.text}</div>
                <div style={{ fontSize:10.5, color:'var(--t-3)', fontFamily:'var(--font-mono)', paddingLeft:m.mine?0:2, paddingRight:m.mine?2:0 }}>{m.time}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center' }}>
          <input
            className="input" style={{ flex:1 }}
            placeholder={`Message ${active.label}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), send())}
          />
          <button className="btn btn-brand" style={{ flexShrink:0 }} onClick={send}>Send ↑</button>
        </div>
      </div>
    </div>
  )
}
