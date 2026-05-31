'use client'
export default function Attendance({ onNavigate }: { onNavigate:(p:string)=>void }) {
  return (
    <div>
      <div className="card card-p" style={{ marginBottom:14 }}>
        <div className="heading" style={{ marginBottom:8 }}>Attendance</div>
        <p style={{ fontSize:13,color:'var(--t-2)',lineHeight:1.7 }}>This module connects to the backend API. See <code style={{ background:'var(--s-3)',padding:'1px 5px',borderRadius:4,fontSize:12 }}>backend/src/routes/</code> for the corresponding endpoints. All data is role-scoped and authenticated.</p>
      </div>
    </div>
  )
}
