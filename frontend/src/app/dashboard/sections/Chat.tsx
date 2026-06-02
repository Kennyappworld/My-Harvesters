'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { chatChannels } from '@/lib/data'
import { persist, hydrate } from '@/lib/store'
import { useSession } from '@/lib/useSession'
import { createClient } from '@supabase/supabase-js'

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

const SCOPE_COLORS: Record<string,string> = {
  leadership:'var(--brand)', peer:'var(--teal)', unit:'var(--green)', custom:'var(--gold)'
}

// Mock member list — in production from workers table
const ALL_MEMBERS = [
  { id:'m1', name:'Pastor Bolaji Idowu', role:'senior_pastor', branch:'lekki', dept:'Leadership' },
  { id:'m2', name:'Pastor Kanmi Adeyemi', role:'pastor', branch:'ikeja', dept:'Leadership' },
  { id:'m3', name:'Segun Adeyemi', role:'unit_head', branch:'lekki', dept:'Ushering' },
  { id:'m4', name:'Tolu Mensah', role:'unit_head', branch:'lekki', dept:'Worship' },
  { id:'m5', name:'Tosin Obi', role:'unit_head', branch:'lekki', dept:'KidsHouse' },
  { id:'m6', name:'Kenny Appiah', role:'worker', branch:'lekki', dept:'Media' },
  { id:'m7', name:'Emeka Obi', role:'worker', branch:'lekki', dept:'Ushering' },
  { id:'m8', name:'Ngozi Kalu', role:'worker', branch:'lekki', dept:'Ushering' },
  { id:'m9', name:'Blessing Okafor', role:'worker', branch:'gbagada', dept:'KidsHouse' },
  { id:'m10', name:'Elder Taiwo', role:'unit_head', branch:'lekki', dept:'Prayer' },
]

type Channel = {
  id: string; label: string; scope: string; initials: string; sub: string
  unread: number; messages: Msg[]; members?: string[]; createdBy?: string; custom?: boolean
}
type Msg = { id:string; from:string; initials:string; text:string; time:string; mine:boolean }
type Invite = { id:string; channelId:string; channelName:string; memberId:string; memberName:string; invitedBy:string; status:'pending'|'approved'|'rejected' }

const INIT_CHANNELS: Channel[] = chatChannels.map(c => ({ ...c, messages: [] }))

export default function Chat() {
  const { user } = useSession()
  const [channels, setChannels] = useState<Channel[]>(() => hydrate('hicc_chat_channels_v2', INIT_CHANNELS))
  const [active, setActive] = useState(INIT_CHANNELS[0].id)
  const [input, setInput] = useState('')
  const [realtimeReady, setRealtimeReady] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showInviteApproval, setShowInviteApproval] = useState(false)
  const [invites, setInvites] = useState<Invite[]>(() => hydrate('hicc_chat_invites', []))
  const [newGroup, setNewGroup] = useState({ name:'', scope:'unit' })
  const [memberSearch, setMemberSearch] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<any>(null)

  const ch = channels.find(c => c.id === active) || channels[0]
  const pendingInvites = invites.filter(i => i.status === 'pending')

  const scrollBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 80)
  }, [])

  useEffect(() => { scrollBottom() }, [active, ch?.messages?.length, scrollBottom])

  // Real-time subscription
  useEffect(() => {
    if (!supabase) return
    if (subRef.current) { supabase.removeChannel(subRef.current); subRef.current = null }

    supabase.from('chat_messages').select('id,body,sender_name,created_at,sender_id')
      .eq('channel', active).order('created_at', { ascending: true }).limit(80)
      .then(({ data }) => {
        if (!data) return
        const msgs: Msg[] = data.map((m:any) => ({
          id: m.id, from: m.sender_name||'Worker',
          initials: (m.sender_name||'W').slice(0,2).toUpperCase(),
          text: m.body, time: new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
          mine: m.sender_id === user?.id,
        }))
        setChannels(prev => prev.map(c => c.id === active ? {...c, messages: msgs} : c))
        scrollBottom()
      })

    const sub = supabase.channel(`chat_rt_${active}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'chat_messages', filter:`channel=eq.${active}` },
        (payload:any) => {
          const m = payload.new
          const msg: Msg = { id:m.id, from:m.sender_name||'Worker', initials:(m.sender_name||'W').slice(0,2).toUpperCase(),
            text:m.body, time:new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), mine:m.sender_id===user?.id }
          setChannels(prev => prev.map(c => c.id===active ? {...c, messages:[...(c.messages||[]).filter(x=>x.id!==m.id), msg]} : c))
          scrollBottom()
        })
      .subscribe((s:string) => setRealtimeReady(s==='SUBSCRIBED'))
    subRef.current = sub
    return () => { if (subRef.current) supabase.removeChannel(subRef.current) }
  }, [active, user?.id, scrollBottom])

  const send = async () => {
    if (!input.trim()) return
    const text = input.trim(); setInput('')
    const name = user?.name || 'Worker'
    const opt: Msg = { id:`opt_${Date.now()}`, from:name, initials:name.slice(0,2).toUpperCase(), text, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), mine:true }
    setChannels(prev => { const next = prev.map(c => c.id===active ? {...c, messages:[...(c.messages||[]), opt]} : c); if(!supabase) persist('hicc_chat_channels_v2', next); return next })
    scrollBottom()
    if (supabase && user?.id) await supabase.from('chat_messages').insert({ channel:active, sender_id:user.id, sender_name:name, body:text })
  }

  const createGroup = () => {
    if (!newGroup.name.trim()) return
    const id = `grp_${Date.now()}`
    const grp: Channel = { id, label:newGroup.name, scope:newGroup.scope, initials:newGroup.name.slice(0,2).toUpperCase(), sub:`Created by ${user?.name||'you'}`, unread:0, messages:[], members:[user?.id||'me'], createdBy:user?.id||'me', custom:true }
    const next = [...channels, grp]
    setChannels(next); persist('hicc_chat_channels_v2', next)
    setActive(id); setShowCreate(false); setNewGroup({ name:'', scope:'unit' })
  }

  const deleteGroup = () => {
    const next = channels.filter(c => c.id !== active)
    setChannels(next); persist('hicc_chat_channels_v2', next)
    setActive(next[0]?.id || INIT_CHANNELS[0].id)
    setShowDeleteConfirm(false)
  }

  const inviteMember = (member: typeof ALL_MEMBERS[0]) => {
    const invite: Invite = { id:`inv_${Date.now()}`, channelId:active, channelName:ch.label, memberId:member.id, memberName:member.name, invitedBy:user?.name||'Admin', status:'pending' }
    const next = [...invites, invite]; setInvites(next); persist('hicc_chat_invites', next)
    setShowInvite(false)
  }

  const approveInvite = (inviteId: string) => {
    const inv = invites.find(i => i.id === inviteId)
    if (!inv) return
    // Add member to channel
    setChannels(prev => { const next = prev.map(c => c.id===inv.channelId ? {...c, members:[...(c.members||[]), inv.memberId], sub:`${(c.members||[]).length+1} members`} : c); persist('hicc_chat_channels_v2', next); return next })
    const next = invites.map(i => i.id===inviteId ? {...i, status:'approved' as const} : i); setInvites(next); persist('hicc_chat_invites', next)
  }

  const rejectInvite = (inviteId: string) => {
    const next = invites.map(i => i.id===inviteId ? {...i, status:'rejected' as const} : i); setInvites(next); persist('hicc_chat_invites', next)
  }

  const approveAll = () => pendingInvites.forEach(i => approveInvite(i.id))

  const filteredMembers = ALL_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
    !ch.members?.includes(m.id) && m.id !== (user?.id||'')
  )

  const modalStyle: React.CSSProperties = { position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }
  const panelStyle: React.CSSProperties = { background:'var(--s-2)', borderRadius:18, width:'100%', maxWidth:420, maxHeight:'80vh', overflow:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }
  const pHead: React.CSSProperties = { padding:'14px 18px', background:'var(--grad-brand)', borderRadius:'18px 18px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }

  return (
    <div style={{ display:'flex', height:'calc(100vh - var(--topbar-h) - 56px)', minHeight:520, borderRadius:16, overflow:'hidden', border:'0.5px solid var(--border)' }}>

      {/* ── Modals ── */}
      {showCreate && (
        <div style={modalStyle} onClick={() => setShowCreate(false)}>
          <div style={panelStyle} onClick={e => e.stopPropagation()}>
            <div style={pHead}>
              <span style={{fontWeight:700,fontSize:14,color:'white'}}>Create group</span>
              <button onClick={() => setShowCreate(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <label style={{fontSize:11,fontWeight:700,color:'var(--t-3)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Group name</label>
              <input className="input" value={newGroup.name} onChange={e=>setNewGroup(n=>({...n,name:e.target.value}))} placeholder="e.g. Worship Leads, Lekki Media" style={{marginBottom:12}} autoFocus/>
              <label style={{fontSize:11,fontWeight:700,color:'var(--t-3)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:5}}>Scope</label>
              <select className="input" value={newGroup.scope} onChange={e=>setNewGroup(n=>({...n,scope:e.target.value}))} style={{marginBottom:16}}>
                <option value="unit">Unit — my department only</option>
                <option value="peer">Peer — across departments</option>
                <option value="leadership">Leadership — pastors &amp; leaders</option>
              </select>
              <div style={{fontSize:12,color:'var(--t-3)',marginBottom:16,lineHeight:1.6,background:'var(--s-3)',padding:'10px 12px',borderRadius:10}}>
                You'll be added automatically. After creating, use <strong>Invite members</strong> to add people. Inviting someone at or above your role level requires approval from your admin.
              </div>
              <button className="btn btn-brand" style={{width:'100%',justifyContent:'center',padding:'11px'}} onClick={createGroup} disabled={!newGroup.name.trim()}>Create group</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div style={modalStyle} onClick={() => setShowInvite(false)}>
          <div style={panelStyle} onClick={e => e.stopPropagation()}>
            <div style={pHead}>
              <span style={{fontWeight:700,fontSize:14,color:'white'}}>Invite to {ch.label}</span>
              <button onClick={() => setShowInvite(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <input className="input" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Search by name or department…" style={{marginBottom:12}} autoFocus/>
              <div style={{maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                {filteredMembers.length === 0 && <div style={{textAlign:'center',color:'var(--t-3)',fontSize:13,padding:'1rem'}}>No members found or all already added.</div>}
                {filteredMembers.map(m => {
                  const needsApproval = ['senior_pastor','pastor','admin'].includes(m.role)
                  return (
                    <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',border:'1px solid var(--border)',borderRadius:12,background:'var(--s-1)'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--brand-soft)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--brand)',flexShrink:0}}>{m.name.slice(0,2).toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--t-1)'}}>{m.name}</div>
                        <div style={{fontSize:11,color:'var(--t-3)'}}>{m.role.replace(/_/g,' ')} · {m.dept}</div>
                      </div>
                      <button onClick={() => inviteMember(m)} className="btn btn-sm btn-brand" style={{fontSize:11,padding:'4px 10px'}}>
                        {needsApproval ? '📋 Request' : 'Invite'}
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{marginTop:12,fontSize:11.5,color:'var(--t-3)',lineHeight:1.6,borderTop:'0.5px solid var(--border)',paddingTop:12}}>
                <strong style={{color:'var(--t-2)'}}>📋 Request</strong> = requires admin approval before the person receives the invite.
              </div>
            </div>
          </div>
        </div>
      )}

      {showInviteApproval && (
        <div style={modalStyle} onClick={() => setShowInviteApproval(false)}>
          <div style={panelStyle} onClick={e => e.stopPropagation()}>
            <div style={pHead}>
              <span style={{fontWeight:700,fontSize:14,color:'white'}}>Pending invites ({pendingInvites.length})</span>
              <button onClick={() => setShowInviteApproval(false)} style={{background:'rgba(255,255,255,0.15)',border:'none',borderRadius:8,width:28,height:28,cursor:'pointer',color:'white',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div style={{padding:20}}>
              {pendingInvites.length > 1 && (
                <button className="btn btn-brand btn-sm" style={{width:'100%',justifyContent:'center',marginBottom:14,padding:'9px'}} onClick={approveAll}>
                  ✓ Approve all ({pendingInvites.length})
                </button>
              )}
              {pendingInvites.length === 0 && <div style={{textAlign:'center',color:'var(--t-3)',fontSize:13,padding:'2rem'}}>No pending invites.</div>}
              {invites.map(inv => (
                <div key={inv.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',border:'1px solid var(--border)',borderRadius:12,marginBottom:8,background:'var(--s-1)',opacity:inv.status!=='pending'?0.55:1}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--t-1)'}}>{inv.memberName}</div>
                    <div style={{fontSize:11,color:'var(--t-3)'}}>→ {inv.channelName} · by {inv.invitedBy}</div>
                  </div>
                  {inv.status === 'pending' ? (
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={() => approveInvite(inv.id)} className="btn btn-sm" style={{background:'var(--green-lt)',color:'var(--green)',border:'1px solid rgba(16,185,129,0.3)',fontSize:11}}>✓ Approve</button>
                      <button onClick={() => rejectInvite(inv.id)} className="btn btn-sm" style={{background:'rgba(197,48,48,0.08)',color:'var(--red)',border:'1px solid rgba(197,48,48,0.2)',fontSize:11}}>✕ Reject</button>
                    </div>
                  ) : (
                    <span style={{fontSize:11,fontWeight:600,color:inv.status==='approved'?'var(--green)':'var(--red)',padding:'2px 8px',borderRadius:100,background:inv.status==='approved'?'var(--green-lt)':'rgba(197,48,48,0.08)'}}>{inv.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={modalStyle} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{...panelStyle, maxWidth:340}} onClick={e => e.stopPropagation()}>
            <div style={{padding:'24px 20px',textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:12}}>🗑</div>
              <div style={{fontWeight:700,fontSize:16,color:'var(--t-1)',marginBottom:8}}>Delete "{ch.label}"?</div>
              <div style={{fontSize:13,color:'var(--t-3)',lineHeight:1.6,marginBottom:20}}>All messages in this group will be permanently deleted. This cannot be undone.</div>
              <div style={{display:'flex',gap:10}}>
                <button className="btn" style={{flex:1,justifyContent:'center'}} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn" style={{flex:1,justifyContent:'center',background:'var(--red)',color:'white',border:'none'}} onClick={deleteGroup}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Channel sidebar ── */}
      <div style={{width:240,flexShrink:0,borderRight:'0.5px solid var(--border)',display:'flex',flexDirection:'column',background:'linear-gradient(180deg,#F2F0E8 0%,#EDEAE0 100%)'}}>
        <div style={{padding:'13px 14px',borderBottom:'0.5px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{fontWeight:700,fontSize:13,fontFamily:'var(--font-display)'}}>Channels</span>
            {supabase && <div style={{width:6,height:6,borderRadius:'50%',background:realtimeReady?'#22c55e':'#f59e0b'}}/>}
          </div>
          <div style={{display:'flex',gap:5}}>
            {pendingInvites.length > 0 && (
              <button onClick={() => setShowInviteApproval(true)} style={{position:'relative',background:'var(--red)',border:'none',borderRadius:8,width:26,height:26,cursor:'pointer',color:'white',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {pendingInvites.length}
              </button>
            )}
            <button className="btn btn-brand btn-sm" style={{fontSize:11,padding:'4px 10px'}} onClick={() => setShowCreate(true)}>+ New</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:8}}>
          {channels.map(c => (
            <div key={c.id} onClick={() => { setActive(c.id); setChannels(prev => prev.map(x => x.id===c.id?{...x,unread:0}:x)) }}
              style={{padding:'10px 12px',borderRadius:'var(--r)',marginBottom:4,cursor:'pointer',background:active===c.id?'var(--brand-soft)':'transparent',border:`1px solid ${active===c.id?'var(--border-md)':'transparent'}`,transition:'all .12s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:`${SCOPE_COLORS[c.scope]||'var(--brand)'}25`,border:`1.5px solid ${SCOPE_COLORS[c.scope]||'var(--brand)'}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:SCOPE_COLORS[c.scope]||'var(--brand)',flexShrink:0}}>{c.initials}</div>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:active===c.id?700:500,color:'var(--t-1)',lineHeight:1.3}}>{c.label}</div>
                    <div style={{fontSize:10.5,color:'var(--t-3)',marginTop:1}}>{c.sub}</div>
                  </div>
                </div>
                {(c.unread||0) > 0 && <span style={{background:'var(--red)',color:'white',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{c.unread}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'var(--dark-2)'}}>
        {/* Header */}
        <div style={{padding:'12px 16px',borderBottom:'0.5px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:`${SCOPE_COLORS[ch?.scope]||'var(--brand)'}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:SCOPE_COLORS[ch?.scope]||'var(--brand)',flexShrink:0}}>{ch?.initials}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13.5,color:'white',fontFamily:'var(--font-display)'}}>{ch?.label}</div>
            <div style={{fontSize:10.5,color:'rgba(255,255,255,0.4)'}}>{ch?.sub} · <span style={{color:SCOPE_COLORS[ch?.scope]||'var(--brand)'}}>{ch?.scope}</span></div>
          </div>
          <div style={{display:'flex',gap:7,alignItems:'center'}}>
            {supabase && <div style={{fontSize:10,color:realtimeReady?'#22c55e':'rgba(255,255,255,0.3)',display:'flex',alignItems:'center',gap:4}}><div style={{width:5,height:5,borderRadius:'50%',background:realtimeReady?'#22c55e':'rgba(255,255,255,0.3)'}}/>{realtimeReady?'Live':'…'}</div>}
            <button onClick={() => setShowInvite(true)} className="btn btn-sm" style={{fontSize:11,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',padding:'4px 10px'}}>
              + Invite
            </button>
            {ch?.custom && (
              <button onClick={() => setShowDeleteConfirm(true)} style={{background:'rgba(197,48,48,0.15)',border:'1px solid rgba(197,48,48,0.25)',borderRadius:8,width:28,height:28,cursor:'pointer',color:'#FC8181',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>
                🗑
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
          {(ch?.messages||[]).length === 0 && (
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:13,marginTop:'3rem'}}>
              No messages yet. Start the conversation.
            </div>
          )}
          {(ch?.messages||[]).map((msg:Msg) => (
            <div key={msg.id} style={{display:'flex',flexDirection:msg.mine?'row-reverse':'row',gap:8,alignItems:'flex-end'}}>
              {!msg.mine && (
                <div style={{width:28,height:28,borderRadius:'50%',background:`${SCOPE_COLORS[ch?.scope]||'var(--brand)'}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:SCOPE_COLORS[ch?.scope]||'var(--brand)',flexShrink:0}}>{msg.initials}</div>
              )}
              <div style={{maxWidth:'68%'}}>
                {!msg.mine && <div style={{fontSize:10.5,color:'rgba(255,255,255,0.45)',marginBottom:3,fontWeight:600}}>{msg.from}</div>}
                <div className={msg.mine?'bubble-mine':'bubble-them'}>{msg.text}</div>
                <div style={{fontSize:9.5,color:'rgba(255,255,255,0.3)',marginTop:3,textAlign:msg.mine?'right':'left'}}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:'10px 14px',borderTop:'0.5px solid rgba(255,255,255,0.08)',display:'flex',gap:8}}>
          <input className="input" placeholder={`Message ${ch?.label}…`} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() }}}
            style={{flex:1,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'white'}}/>
          <button className="btn btn-brand btn-icon" onClick={send} disabled={!input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
