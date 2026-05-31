'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const BRANCHES: Record<string,string> = {
  lekki:'Lekki HQ', gbagada:'Gbagada', ikeja:'Ikeja', anthony:'Anthony Village',
  abuja:'Abuja', portharcourt:'Port Harcourt', ibadan:'Ibadan', london:'London UK', houston:'Houston USA'
}
const DEPARTMENTS = [
  {id:'ushering',name:'Ushering',icon:'🚪'},{id:'worship',name:'Worship & Music',icon:'🎵'},
  {id:'media',name:'Media & Technology',icon:'📷'},{id:'kids',name:'KidsHouse',icon:'🧒'},
  {id:'protocol',name:'Protocol & Guest Care',icon:'🤝'},{id:'welfare',name:'Welfare & Care',icon:'❤️'},
  {id:'outreach',name:'Outreach & Evangelism',icon:'📢'},{id:'prayer',name:'Prayer & Intercession',icon:'🙏'},
  {id:'security',name:'Security & Traffic',icon:'🛡️'},{id:'drama',name:'Drama & Creative Arts',icon:'🎭'},
  {id:'IT',name:'IT & Digital',icon:'💻'},{id:'admin',name:'Administration',icon:'📋'},
]

function SignupForm() {
  const params = useSearchParams()
  const branchParam = params.get('branch') || ''
  const branchName = BRANCHES[branchParam] || 'Harvesters HICC'

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', phone:'', email:'', branch:branchParam||'lekki', dept:'', firstTimer:'no', dob:'' })
  const [done, setDone] = useState(false)

  const next = (e:React.FormEvent) => { e.preventDefault(); setStep(2) }
  const submit = (e:React.FormEvent) => { e.preventDefault(); setDone(true) }

  if (done) return (
    <div style={{textAlign:'center',padding:'3rem 1.5rem'}}>
      <div style={{fontSize:56,marginBottom:20}}>🙌</div>
      <div style={{fontFamily:'var(--font-display)',fontSize:28,fontWeight:800,color:'var(--t-1)',marginBottom:10}}>Welcome to the family!</div>
      <div style={{fontSize:15,color:'var(--t-2)',lineHeight:1.7,marginBottom:24,maxWidth:400,margin:'0 auto 24px'}}>
        {form.name}, your registration is complete. Your campus coordinator at <strong style={{color:'var(--brand)'}}>{BRANCHES[form.branch]||branchName}</strong> will be in touch within 2 weeks.
      </div>
      <div style={{background:'var(--navy-2)',border:'1px solid var(--border)',borderRadius:14,padding:'16px 20px',maxWidth:320,margin:'0 auto 24px',textAlign:'left'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--brand)',marginBottom:10,letterSpacing:'0.06em',textTransform:'uppercase'}}>What happens next</div>
        {['2 weeks — Personalised welcome message','4 weeks — Small group invitation','3 months — Growth Track enrolment','4 months — Membership pathway'].map((s,i)=>(
          <div key={i} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:12.5,color:'var(--t-2)'}}>
            <span style={{color:'var(--brand)',fontWeight:700,flexShrink:0}}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
      <Link href="/" className="btn btn-brand">Back to home</Link>
    </div>
  )

  return (
    <div style={{width:'100%',maxWidth:440}}>
      {/* Header */}
      <div style={{textAlign:'center',marginBottom:'2rem'}}>
        <div style={{width:56,height:56,background:'var(--grad-brand)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'var(--sh-brand)'}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="28" height="28"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-display)',color:'var(--t-1)',letterSpacing:'-0.02em',marginBottom:4}}>
          Welcome to {branchName}
        </div>
        <div style={{fontSize:13,color:'var(--t-2)'}}>Register to join the Harvesters family</div>
        {/* Step indicator */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:16}}>
          {[1,2].map(s=>(
            <div key={s} style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:step>=s?'var(--grad-brand)':'var(--navy-3)',border:`2px solid ${step>=s?'var(--brand)':'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:step>=s?'white':'var(--t-3)'}}>{s}</div>
              {s<2 && <div style={{width:40,height:2,background:step>s?'var(--brand)':'var(--navy-4)',borderRadius:2}}/>}
            </div>
          ))}
        </div>
      </div>

      <div className="card glass" style={{padding:'2rem'}}>
        {step===1 ? (
          <form onSubmit={next}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Personal details</h3>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Full name *</label>
              <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your full name" required autoFocus/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Phone number *</label>
              <input className="input" type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+234 800 000 0000" required/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Email address</label>
              <input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Optional"/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Date of birth</label>
              <input className="input" type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:5}}>Campus *</label>
              <select className="input" value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                {Object.entries(BRANCHES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-brand" style={{width:'100%',justifyContent:'center',padding:'11px'}}>Next →</button>
          </form>
        ) : (
          <form onSubmit={submit}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Get involved</h3>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:8}}>Are you a first-time visitor?</label>
              <div style={{display:'flex',gap:10}}>
                {[['yes','Yes, first time! 🙋'],['no','No, I have visited before']].map(([v,l])=>(
                  <button key={v} type="button" onClick={()=>setForm(f=>({...f,firstTimer:v}))} className="btn btn-sm" style={{flex:1,justifyContent:'center',background:form.firstTimer===v?'var(--grad-brand)':'transparent',color:form.firstTimer===v?'white':'var(--t-2)',border:`1px solid ${form.firstTimer===v?'var(--brand)':'var(--border-md)'}`,fontSize:11.5}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11.5,fontWeight:600,color:'var(--t-2)',display:'block',marginBottom:8}}>Which department interests you?</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {DEPARTMENTS.map(d=>(
                  <button key={d.id} type="button" onClick={()=>setForm(f=>({...f,dept:d.id}))} style={{padding:'8px 10px',borderRadius:'var(--r)',border:`1px solid ${form.dept===d.id?'var(--brand)':'var(--border-md)'}`,background:form.dept===d.id?'var(--brand-soft)':'transparent',cursor:'pointer',textAlign:'left',transition:'all .12s',display:'flex',gap:7,alignItems:'center'}}>
                    <span style={{fontSize:16}}>{d.icon}</span>
                    <span style={{fontSize:11.5,color:form.dept===d.id?'var(--brand)':'var(--t-2)',fontWeight:form.dept===d.id?600:400}}>{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="button" className="btn btn-ghost" onClick={()=>setStep(1)}>← Back</button>
              <button type="submit" className="btn btn-brand" style={{flex:1,justifyContent:'center',padding:'11px'}}>Complete registration 🙌</button>
            </div>
          </form>
        )}
      </div>

      <p style={{textAlign:'center',fontSize:12,color:'var(--t-3)',marginTop:'1rem'}}>
        Already registered? <Link href="/login" style={{color:'var(--brand)'}}>Sign in</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--navy)',padding:'1.5rem',position:'relative',overflow:'hidden'}}>
      <div style={{position:'fixed',top:'-10%',left:'-5%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'-10%',right:'-5%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}}/>
      <Suspense fallback={<div style={{color:'var(--t-2)'}}>Loading…</div>}>
        <SignupForm/>
      </Suspense>
    </div>
  )
}
