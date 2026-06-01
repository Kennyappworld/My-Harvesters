export default function Loading() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ width:44, height:44, background:'var(--grad-brand)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--brand-lt)', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
          ))}
        </div>
        <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0);opacity:.3}40%{transform:scale(1);opacity:1}}`}</style>
      </div>
    </div>
  )
}
