'use client'
import { useState, useRef, useEffect } from 'react'
import { chatChannels } from '@/lib/data'

const SCOPE_COLORS: Record<string,string> = {
  leadership:'var(--brand)', peer:'var(--teal)', unit:'var(--green)'
}

export default function Chat() {
  const [channels, setChannels] = useState(chatChannels)
  const [active, setActive] = useState(chatChannels[0].id)
  const [input, setInput] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newCh, setNewCh] = useState({ name:'', scope:'unit' })
  const bottomRef = useRef<HTMLDivElement>(null)

  const ch = channels.find(c => c.id === active)!

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [active, ch?.messages?.length])

  const send = () => {
    if (!input.trim()) return
    setChannels(prev => prev.map(c => c.id === active ? {
      ...c,
      messages: [...(c.messages||[]), {
        id: `m${Date.now()}`, from:'You', initials:'BI', av:'purple',
        text: input.trim(), time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), mine: true
      }]
    } : c))
    setInput('')
  }

  const createChannel = () => {
    if (!newCh.name.trim()) return
    const id = `ch${Date.now()}`
    setChannels(prev => [...prev, { id, label: newCh.name, scope: newCh.scope, av:'blue', initials: newCh.name.slice(0,2).toUpperCase(), sub: 'New channel', unread:0, messages:[] }])
    setActive(id); setShowNew(false); setNewCh({ name:'', scope:'unit' })
  }

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - var(--topbar-h) - 56px)', minHeight:500 }}>

      {/* Channel list */}
      <div style={{ width:240, flexShrink:0, borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', background:'var(--navy-2)', borderRadius:'14px 0 0 14px' }}>
        <div style={{ padding:'14px 16px', borderBottom:'0.5px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700, fontSize:13, fontFamily:'var(--font-display)' }}>Channels</div>
          <button className="btn btn-brand btn-sm" style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setShowNew(v=>!v)}>+ New</button>
        </div>

        {showNew && (
          <div style={{ padding:'12px 14px', borderBottom:'0.5px solid var(--border)', background:'var(--navy-3)' }}>
            <input className="input" style={{ marginBottom:8, fontSize:12 }} placeholder="Channel name" value={newCh.name} onChange={e=>setNewCh(n=>({...n,name:e.target.value}))}/>
            <select className="input" style={{ marginBottom:8, fontSize:12 }} value={newCh.scope} onChange={e=>setNewCh(n=>({...n,scope:e.target.value}))}>
              <option value="unit">Unit</option><option value="peer">Peer</option><option value="leadership">Leadership</option>
            </select>
            <button className="btn btn-brand btn-sm" style={{ width:'100%', justifyContent:'center', fontSize:11 }} onClick={createChannel}>Create</button>
          </div>
        )}

        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {channels.map(c => (
            <div key={c.id} onClick={()=>{ setActive(c.id); setChannels(prev=>prev.map(x=>x.id===c.id?{...x,unread:0}:x)) }}
              style={{ padding:'10px 12px', borderRadius:'var(--r)', marginBottom:4, cursor:'pointer', background: active===c.id?'var(--brand-soft)':'transparent', border:`1px solid ${active===c.id?'var(--border-md)':'transparent'}`, transition:'all .12s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`${SCOPE_COLORS[c.scope]||'var(--brand)'}25`, border:`1.5px solid ${SCOPE_COLORS[c.scope]||'var(--brand)'}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:SCOPE_COLORS[c.scope]||'var(--brand)', flexShrink:0 }}>{c.initials}</div>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:active===c.id?700:500, color:'var(--t-1)' }}>{c.label}</div>
                    <div style={{ fontSize:10.5, color:'var(--t-3)', marginTop:1 }}>{c.sub}</div>
                  </div>
                </div>
                {(c.unread||0) > 0 && <span style={{ background:'var(--red)', color:'white', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, flexShrink:0 }}>{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--navy)', borderRadius:'0 14px 14px 0', border:'0.5px solid var(--border)', borderLeft:'none' }}>
        <div style={{ padding:'14px 18px', borderBottom:'0.5px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:`${SCOPE_COLORS[ch.scope]||'var(--brand)'}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:SCOPE_COLORS[ch.scope]||'var(--brand)', flexShrink:0 }}>{ch.initials}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:14, fontFamily:'var(--font-display)' }}>{ch.label}</div>
            <div style={{ fontSize:11, color:'var(--t-3)' }}>{ch.sub} · <span style={{ color:SCOPE_COLORS[ch.scope]||'var(--brand)', fontWeight:500 }}>{ch.scope}</span></div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
          {(ch.messages||[]).length === 0 && (
            <div style={{ textAlign:'center', color:'var(--t-3)', fontSize:13, marginTop:'2rem' }}>No messages yet. Start the conversation.</div>
          )}
          {(ch.messages||[]).map((msg:any) => (
            <div key={msg.id} style={{ display:'flex', flexDirection: msg.mine?'row-reverse':'row', gap:8, alignItems:'flex-end' }}>
              {!msg.mine && (
                <div style={{ width:30, height:30, borderRadius:'50%', background:`${SCOPE_COLORS[ch.scope]||'var(--brand)'}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:SCOPE_COLORS[ch.scope]||'var(--brand)', flexShrink:0 }}>{msg.initials}</div>
              )}
              <div style={{ maxWidth:'70%' }}>
                {!msg.mine && <div style={{ fontSize:10.5, color:'var(--t-3)', marginBottom:3, fontWeight:600 }}>{msg.from}</div>}
                <div className={msg.mine?'bubble-mine':'bubble-them'}>{msg.text}</div>
                <div style={{ fontSize:10, color:'var(--t-3)', marginTop:3, textAlign:msg.mine?'right':'left' }}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        <div style={{ padding:'12px 16px', borderTop:'0.5px solid var(--border)', display:'flex', gap:10 }}>
          <input className="input" placeholder={`Message ${ch.label}…`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() }}} style={{ flex:1 }}/>
          <button className="btn btn-brand btn-icon" onClick={send} disabled={!input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
