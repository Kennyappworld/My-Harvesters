'use client'
import { useState, useEffect, useCallback, useRef, FormEvent } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const DAILY_WORDS = [
  // God's Love & Identity
  { verse: "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.", ref: "Zephaniah 3:17 (NIV)" },
  { verse: "Can a woman forget her nursing child, that she should have no compassion on the son of her womb? Even these may forget, yet I will not forget you. Behold, I have engraved you on the palms of my hands.", ref: "Isaiah 49:15-16 (ESV)" },
  { verse: "Long ago the LORD said to Israel: 'I have loved you, my people, with an everlasting love. With unfailing love I have drawn you to myself.'", ref: "Jeremiah 31:3 (NLT)" },
  { verse: "And I am convinced that nothing can ever separate us from God's love. Neither death nor life, neither angels nor demons, neither our fears for today nor our worries about tomorrow — not even the powers of hell can separate us from God's love.", ref: "Romans 8:38 (NLT)" },
  { verse: "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!", ref: "1 John 3:1 (NIV)" },
  { verse: "But you are a chosen race, a royal priesthood, a holy nation, a people for his own possession, that you may proclaim the excellencies of him who called you out of darkness into his marvellous light.", ref: "1 Peter 2:9 (ESV)" },
  { verse: "For we are God's masterpiece. He has created us anew in Christ Jesus, so we can do the good things he planned for us long ago.", ref: "Ephesians 2:10 (NLT)" },
  { verse: "'I knew you before I formed you in your mother's womb. Before you were born I set you apart and appointed you as my prophet to the nations.'", ref: "Jeremiah 1:5 (NLT)" },
  { verse: "You are precious in my eyes, and honoured, and I love you.", ref: "Isaiah 43:4 (ESV)" },
  // Faith & Trust
  { verse: "Trust in the LORD with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.", ref: "Proverbs 3:5-6 (NLT)" },
  { verse: "'For I know the plans I have for you,' says the LORD. 'They are plans for good and not for disaster, to give you a future and a hope.'", ref: "Jeremiah 29:11 (NLT)" },
  { verse: "And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.", ref: "Romans 8:28 (NLT)" },
  { verse: "Now faith is the assurance of things hoped for, the conviction of things not seen.", ref: "Hebrews 11:1 (ESV)" },
  { verse: "For we walk by faith, not by sight.", ref: "2 Corinthians 5:7 (ESV)" },
  { verse: "And without faith it is impossible to please him, for whoever would draw near to God must believe that he exists and that he rewards those who seek him.", ref: "Hebrews 11:6 (ESV)" },
  { verse: "Keep on asking, and you will receive what you ask for. Keep on seeking, and you will find. Keep on knocking, and the door will be opened to you.", ref: "Matthew 7:7 (NLT)" },
  { verse: "Jesus said to him, 'If you can believe, all things are possible to him who believes.'", ref: "Mark 9:23 (NKJV)" },
  { verse: "I can do everything through Christ, who gives me strength.", ref: "Philippians 4:13 (NLT)" },
  { verse: "But those who trust in the LORD will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint.", ref: "Isaiah 40:31 (NLT)" },
  // Grace & Salvation
  { verse: "God saved you by his grace when you believed. And you can't take credit for this; it is a gift from God. Salvation is not a reward for the good things we have done, so none of us can boast about it.", ref: "Ephesians 2:8-9 (NLT)" },
  { verse: "Each time he said, 'My grace is all you need. My power works best in weakness.' So now I am glad to boast about my weaknesses, so that the power of Christ can work through me.", ref: "2 Corinthians 12:9 (NLT)" },
  { verse: "The LORD is merciful and gracious, slow to anger and abounding in steadfast love.", ref: "Psalm 103:8 (ESV)" },
  { verse: "So let us come boldly to the throne of our gracious God. There we will receive his mercy, and we will find grace to help us when we need it most.", ref: "Hebrews 4:16 (NLT)" },
  { verse: "For the grace of God has appeared, bringing salvation for all people.", ref: "Titus 2:11 (ESV)" },
  { verse: "Where sin increased, grace increased all the more, so that, just as sin reigned in death, so also grace might reign through righteousness to bring eternal life through Jesus Christ our Lord.", ref: "Romans 5:20-21 (NIV)" },
  // God's Presence & Protection
  { verse: "The LORD is my shepherd; I have all that I need. He lets me rest in green meadows; he leads me beside peaceful streams. He renews my strength.", ref: "Psalm 23:1-3 (NLT)" },
  { verse: "Don't be afraid, for I am with you. Don't be discouraged, for I am your God. I will strengthen you and help you. I will hold you up with my victorious right hand.", ref: "Isaiah 41:10 (NLT)" },
  { verse: "'Do not be afraid, for I have ransomed you. I have called you by name; you are mine.'", ref: "Isaiah 43:1 (NLT)" },
  { verse: "The LORD is my light and my salvation — so why should I be afraid? The LORD is my fortress, protecting me from danger, so why should I tremble?", ref: "Psalm 27:1 (NLT)" },
  { verse: "God is our refuge and strength, always ready to help in times of trouble. So we will not fear when earthquakes come and the mountains crumble into the sea.", ref: "Psalm 46:1-2 (NLT)" },
  { verse: "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. I will say to the LORD, 'My refuge and my fortress, my God, in whom I trust.'", ref: "Psalm 91:1-2 (ESV)" },
  { verse: "No weapon formed against you shall prosper, and every tongue which rises against you in judgment you shall condemn. This is the heritage of the servants of the LORD.", ref: "Isaiah 54:17 (NKJV)" },
  { verse: "The LORD will fight for you, and you have only to be silent.", ref: "Exodus 14:14 (ESV)" },
  // Purpose & Calling
  { verse: "You didn't choose me. I chose you. I appointed you to go and produce lasting fruit, so that the Father will give you whatever you ask for, using my name.", ref: "John 15:16 (NLT)" },
  { verse: "For we are both God's workers. And you are God's field. You are God's building.", ref: "1 Corinthians 3:9 (NLT)" },
  { verse: "So, my dear brothers and sisters, be strong and immovable. Always work enthusiastically for the Lord, for you know that nothing you do for the Lord is ever useless.", ref: "1 Corinthians 15:58 (NLT)" },
  { verse: "God has given each of you a gift from his great variety of spiritual gifts. Use them well to serve one another.", ref: "1 Peter 4:10 (NLT)" },
  { verse: "And then he told them, 'Go into all the world and preach the Good News to everyone.'", ref: "Mark 16:15 (NLT)" },
  { verse: "Work willingly at whatever you do, as though you were working for the Lord rather than for people. Remember that the Lord will give you an inheritance as your reward, and that the Master you are serving is Christ.", ref: "Colossians 3:23-24 (NLT)" },
  { verse: "Commit your actions to the LORD, and your plans will succeed.", ref: "Proverbs 16:3 (NLT)" },
  // Peace & Rest
  { verse: "Then Jesus said, 'Come to me, all of you who are weary and carry heavy burdens, and I will give you rest. Take my yoke upon you. Let me teach you, because I am humble and gentle at heart, and you will find rest for your souls.'", ref: "Matthew 11:28-29 (NLT)" },
  { verse: "Don't worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God's peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.", ref: "Philippians 4:6-7 (NLT)" },
  { verse: "You will keep in perfect peace all who trust in you, all whose thoughts are fixed on you!", ref: "Isaiah 26:3 (NLT)" },
  { verse: "'I am leaving you with a gift — peace of mind and heart. And the peace I give is a gift the world cannot give. So don't be troubled or afraid.'", ref: "John 14:27 (NLT)" },
  { verse: "Give all your worries and cares to God, for he cares about you.", ref: "1 Peter 5:7 (NLT)" },
  { verse: "The LORD gives his people strength. The LORD blesses them with peace.", ref: "Psalm 29:11 (NLT)" },
  // Abundance & Provision
  { verse: "Now all glory to God, who is able, through his mighty power at work within us, to accomplish infinitely more than we might ask or think.", ref: "Ephesians 3:20 (NLT)" },
  { verse: "The thief's purpose is to steal and kill and destroy. My purpose is to give them a rich and satisfying life.", ref: "John 10:10 (NLT)" },
  { verse: "And this same God who takes care of me will supply all your needs from his glorious riches, which have been given to us in Christ Jesus.", ref: "Philippians 4:19 (NLT)" },
  { verse: "Give, and you will receive. Your gift will return to you in full — pressed down, shaken together to make room for more, running over, and poured into your lap.", ref: "Luke 6:38 (NLT)" },
  { verse: "The LORD will open to you his good treasury, the heavens, to give the rain to your land in its season and to bless all the work of your hands.", ref: "Deuteronomy 28:12 (ESV)" },
  { verse: "'Try it! Put me to the test!' says the LORD of Heaven's Armies. 'I will open the windows of heaven for you. I will pour out a blessing so great you won't have enough room to take it in!'", ref: "Malachi 3:10 (NLT)" },
  // Strength & Victory
  { verse: "He gives power to the weak and strength to the powerless. Even youths will become weak and tired, and young men will fall in exhaustion. But those who trust in the LORD will find new strength.", ref: "Isaiah 40:29-31 (NLT)" },
  { verse: "This is my command — be strong and courageous! Do not be afraid or discouraged. For the LORD your God is with you wherever you go.", ref: "Joshua 1:9 (NLT)" },
  { verse: "But thank God! He gives us victory over sin and death through our Lord Jesus Christ.", ref: "1 Corinthians 15:57 (NLT)" },
  { verse: "No, despite all these things, overwhelming victory is ours through Christ, who loved us.", ref: "Romans 8:37 (NLT)" },
  { verse: "For every child of God defeats this evil world, and we achieve this victory through our faith.", ref: "1 John 5:4 (NLT)" },
  { verse: "So humble yourselves before God. Resist the devil, and he will flee from you.", ref: "James 4:7 (NLT)" },
  // Life in the Spirit
  { verse: "But the Holy Spirit produces this kind of fruit in our lives: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.", ref: "Galatians 5:22-23 (NLT)" },
  { verse: "For God has not given us a spirit of fear and timidity, but of power, love, and self-discipline.", ref: "2 Timothy 1:7 (NLT)" },
  { verse: "So letting your sinful nature control your mind leads to death. But letting the Spirit control your mind leads to life and peace.", ref: "Romans 8:6 (NLT)" },
  { verse: "But you will receive power when the Holy Spirit comes upon you. And you will be my witnesses, telling people about me everywhere — in Jerusalem, throughout Judea, in Samaria, and to the ends of the earth.", ref: "Acts 1:8 (NLT)" },
  // Transformation & Renewal
  { verse: "Don't copy the behaviour and customs of this world, but let God transform you into a new person by changing the way you think. Then you will learn to know God's will for you, which is good and pleasing and perfect.", ref: "Romans 12:2 (NLT)" },
  { verse: "This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!", ref: "2 Corinthians 5:17 (NLT)" },
  { verse: "Create in me a clean heart, O God. Renew a loyal spirit within me.", ref: "Psalm 51:10 (NLT)" },
  { verse: "And the one sitting on the throne said, 'Look, I am making everything new!' And then he said to me, 'Write this down, for what I tell you is trustworthy and true.'", ref: "Revelation 21:5 (NLT)" },
  // Prayer & Seeking God
  { verse: "Then if my people who are called by my name will humble themselves and pray and seek my face and turn from their wicked ways, I will hear from heaven and will forgive their sins and restore their land.", ref: "2 Chronicles 7:14 (NLT)" },
  { verse: "'Call to me and I will answer you, and will tell you great and hidden things that you have not known.'", ref: "Jeremiah 33:3 (ESV)" },
  { verse: "Take delight in the LORD, and he will give you your heart's desires.", ref: "Psalm 37:4 (NLT)" },
  { verse: "Come close to God, and God will come close to you.", ref: "James 4:8 (NLT)" },
  { verse: "And we are confident that he hears us whenever we ask for anything that pleases him.", ref: "1 John 5:14 (NLT)" },
  // Life & Godliness
  { verse: "By his divine power, God has given us everything we need for living a godly life. We have received all of this by coming to know him, the one who called us to himself by means of his marvellous glory and excellence.", ref: "2 Peter 1:3 (NLT)" },
  { verse: "Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need.", ref: "Matthew 6:33 (NLT)" },
  { verse: "Oh, the joys of those who do not follow the advice of the wicked, or stand around with sinners, or join in with mockers. But they delight in the law of the LORD, meditating on it day and night.", ref: "Psalm 1:1-2 (NLT)" },
  { verse: "Taste and see that the LORD is good. Oh, the joys of those who take refuge in him!", ref: "Psalm 34:8 (NLT)" },
  { verse: "This is the day the LORD has made. We will rejoice and be glad in it.", ref: "Psalm 118:24 (NLT)" },
  { verse: "Your word is a lamp to guide my feet and a light for my path.", ref: "Psalm 119:105 (NLT)" },
  { verse: "The faithful love of the LORD never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.", ref: "Lamentations 3:22-23 (NLT)" },
]

// Supabase client - gracefully falls back if env vars not yet set
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

function WelcomeSplash({ name, onDone }: { name: string; onDone: () => void }) {
  const [vis, setVis] = useState(false)
  const [word] = useState(() => {
    try {
      const custom = localStorage.getItem('hicc_custom_scriptures')
      if (custom) {
        const pool = JSON.parse(custom)
        if (Array.isArray(pool) && pool.length > 0) {
          return pool[Math.floor(Math.random() * pool.length)]
        }
      }
    } catch {}
    return DAILY_WORDS[Math.floor(Math.random() * DAILY_WORDS.length)]
  })
  const [phase, setPhase] = useState(0) // 0=hidden 1=cross 2=grace words 3=name 4=scripture 5=buttons

  useEffect(() => {
    requestAnimationFrame(() => setVis(true))
    // Fast sequence — total ~900ms before buttons appear
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 220),
      setTimeout(() => setPhase(3), 550),
      setTimeout(() => setPhase(4), 720),
      setTimeout(() => setPhase(5), 900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const graceWords = ['Grace!', 'Grace!!', 'Grace!!!']
  const dismiss = () => { setVis(false); setTimeout(onDone, 350) }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'var(--dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', transition:'opacity .5s', opacity: vis ? 1 : 0, overflow:'hidden' }}>
      {/* Ambient glow layers */}
      <div style={{ position:'absolute', top:'-5%', left:'-10%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.55) 0%, transparent 70%)', filter:'blur(70px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-5%', right:'-8%', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:300, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(27,67,50,0.2) 0%, transparent 70%)', filter:'blur(80px)', pointerEvents:'none' }}/>

      <div style={{ maxWidth:440, width:'100%', textAlign:'center', position:'relative' }}>
        {/* Cross icon */}
        <div style={{ width:56, height:56, background:'linear-gradient(135deg,rgba(201,168,76,0.25),rgba(201,168,76,0.08))', border:'1px solid rgba(201,168,76,0.35)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 40px rgba(201,168,76,0.15)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" width="22" height="22"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>

        {/* Grace words - stagger in one by one */}
        <div style={{ marginBottom:6, display:'flex', gap:'0.4em', justifyContent:'center', flexWrap:'wrap' }}>
          {graceWords.map((w, i) => (
            <span key={w} style={{
              fontFamily:'var(--font-display)', fontSize:'clamp(1.8rem,6vw,3rem)', fontWeight:800,
              color:'var(--gold)', letterSpacing:'-0.02em', lineHeight:1,
              textShadow:'0 0 60px rgba(201,168,76,0.4)',
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(14px)',
              transition: `opacity 0.5s ease ${i*180}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i*180}ms`,
            }}>{w}</span>
          ))}
        </div>
        <p style={{ fontSize:12, fontWeight:600, color:'rgba(201,168,76,0.6)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:18, opacity:phase>=2?1:0, transition:'opacity 0.5s ease 560ms' }}>This is my story</p>

        {/* Name */}
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.2rem,3.5vw,1.6rem)', fontWeight:700, color:'white', marginBottom:24, letterSpacing:'-0.01em', opacity:phase>=3?1:0, transform:phase>=3?'translateY(0)':'translateY(10px)', transition:'opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)' }}>
          Welcome back, <span style={{ color:'var(--gold)' }}>{name}</span>
        </h1>

        {/* Scripture card */}
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderLeft:'3px solid rgba(201,168,76,0.6)', borderRadius:14, padding:'1.2rem 1.4rem', marginBottom:28, textAlign:'left', opacity:phase>=4?1:0, transform:phase>=4?'translateY(0)':'translateY(10px)', transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
          <p style={{ fontSize:13.5, fontStyle:'italic', color:'rgba(255,255,255,.78)', lineHeight:1.8, marginBottom:10 }}>"{word.verse}"</p>
          <p style={{ fontSize:11, color:'var(--gold)', fontWeight:700, letterSpacing:'.08em', textAlign:'right' }}>- {word.ref}</p>
        </div>

        {/* Buttons */}
        <div style={{ opacity:phase>=5?1:0, transform:phase>=5?'translateY(0)':'translateY(8px)', transition:'opacity 0.4s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
          <button onClick={dismiss} className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15, fontWeight:700, marginBottom:12, letterSpacing:'0.02em', boxShadow:'0 0 30px rgba(27,67,50,0.6)' }}>
            Enter the community →
          </button>
          <button onClick={dismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.25)', fontSize:12, fontFamily:'var(--font-body)', letterSpacing:'.04em' }}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

// Forgot password - uses Supabase magic link / OTP
function ForgotFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'email'|'sent'>('email')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const sendReset = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/login?reset=true` }
        )
        if (error) { setErr(error.message); setBusy(false); return }
      }
      setStep('sent')
    } catch {
      setErr('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ width:'100%', maxWidth:380 }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.45)', fontSize:12.5, marginBottom:22, fontFamily:'var(--font-body)', padding:0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to sign in
      </button>

      {step === 'email' ? (
        <div className="glass" style={{ padding:'2rem' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', marginBottom:6 }}>Reset password</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20 }}>Enter your work email. We'll send a reset link.</p>
          {err && <p style={{ background:'rgba(197,48,48,.15)', border:'1px solid rgba(197,48,48,.3)', borderRadius:8, padding:'9px 13px', fontSize:12.5, color:'#FC8181', marginBottom:14 }}>{err}</p>}
          <form onSubmit={sendReset}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }}>Email address</label>
            <input className="input-dark" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} placeholder="your@email.com" required autoFocus style={{ marginBottom:14 }}/>
            <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }} disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
        </div>
      ) : (
        <div className="glass" style={{ padding:'2rem', textAlign:'center' }}>
          <p style={{ fontSize:44, marginBottom:12 }}>📬</p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'white', marginBottom:6 }}>Check your inbox</h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:20 }}>A reset link has been sent to <strong style={{ color:'white' }}>{email}</strong>. Click it to set a new password.</p>
          <button onClick={onBack} className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'11px' }}>Back to sign in</button>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [mode, setMode]         = useState<'login'|'forgot'>('login')
  const [splash, setSplash]     = useState<{show:boolean;name:string}>({show:false,name:''})
  const [biometric, setBiometric] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(ok => setBiometric(ok)).catch(() => {})
    }
  }, [])

  const afterAuth = useCallback((name: string, userEmail: string) => {
    sessionStorage.setItem('hicc_user', JSON.stringify({ email: userEmail, name, authenticated: true }))
    sessionStorage.setItem('hicc_biometric_email', userEmail)
    // Only show splash once every 8 hours — otherwise go straight to dashboard
    const lastSplash = Number(localStorage.getItem('hicc_splash_ts') || '0')
    const eightHours = 8 * 60 * 60 * 1000
    if (Date.now() - lastSplash > eightHours) {
      localStorage.setItem('hicc_splash_ts', String(Date.now()))
      setSplash({ show: true, name })
    } else {
      router.push('/dashboard')
    }
  }, [router])

  // Handle magic-link redirect ONLY — do NOT fire on password login
  // (password login calls afterAuth directly to avoid double navigation)
  const magicHandled = useRef(false)
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle SIGNED_IN triggered by magic link (not password — password flow handles itself)
      if (event === 'SIGNED_IN' && session?.user && !magicHandled.current) {
        // If we're in busy state, password flow will handle it — skip
        const hash = window.location.hash
        if (!hash.includes('access_token') && !hash.includes('type=magiclink')) return
        magicHandled.current = true
        const name = session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0]
          || 'Welcome'
        afterAuth(name, session.user.email || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [afterAuth])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const safeEmail = email.trim().toLowerCase().replace(/[<>"'`]/g, '')
    if (!safeEmail || !password) return

    setBusy(true)

    // Hard timeout — if nothing resolves in 8 seconds, unblock the UI
    const timeoutId = setTimeout(() => {
      setBusy(false)
      setErr('Sign-in is taking too long. Please check your connection and try again.')
    }, 8000)

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
        })
        clearTimeout(timeoutId)
        if (error) {
          setErr(error.message === 'Invalid login credentials'
            ? 'Incorrect email or password.'
            : error.message || 'Incorrect email or password.')
          setBusy(false)
          return
        }
        const name = data.user?.user_metadata?.full_name
          || data.user?.email?.split('@')[0]
          || 'Welcome'
        // Don't setBusy(false) — we navigate away, no need to unblock
        afterAuth(name, safeEmail)
      } else {
        // Demo fallback
        const DEMO: Record<string, string> = {
          'pastor@hicc.org': 'Pastor Bolaji Idowu',
          'pastor.ikeja@hicc.org': 'Pastor Kanmi Adeyemi',
          'pastor.london@hicc.org': 'Pastor James Osei',
          'segun@hicc.org': 'Segun Adeyemi',
        }
        const DEMO_PASS = process.env.NEXT_PUBLIC_DEMO_PASS || 'demo123'
        clearTimeout(timeoutId)
        if (!DEMO[safeEmail] || password !== DEMO_PASS) {
          setErr('Incorrect email or password.')
          setBusy(false)
          return
        }
        afterAuth(DEMO[safeEmail], safeEmail)
      }
    } catch {
      clearTimeout(timeoutId)
      setErr('Something went wrong. Please check your connection and try again.')
      setBusy(false)
    }
  }

  const useBiometric = async () => {
    setBioLoading(true)
    try {
      await new Promise<void>(res => setTimeout(res, 900))
      const linked = sessionStorage.getItem('hicc_biometric_email')
      if (!linked) {
        setErr('Please sign in with your password first to register biometric login.')
        setBioLoading(false)
        return
      }
      // Re-authenticate via Supabase session if available
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          const name = data.session.user?.user_metadata?.full_name || linked.split('@')[0]
          afterAuth(name, linked)
          return
        }
      }
      // Fallback - use stored email with demo data
      const DEMO: Record<string, string> = {
        'pastor@hicc.org': 'Pastor Bolaji Idowu',
        'pastor.ikeja@hicc.org': 'Pastor Kanmi Adeyemi',
        'segun@hicc.org': 'Segun Adeyemi',
      }
      const name = DEMO[linked] || linked.split('@')[0]
      afterAuth(name, linked)
    } catch {
      setErr('Biometric not available. Please use your password.')
    } finally {
      setBioLoading(false)
    }
  }

  const [magicMode, setMagicMode] = useState(false)
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicBusy, setMagicBusy] = useState(false)

  const sendMagicLink = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const safeEmail = magicEmail.trim().toLowerCase().replace(/[<>"'\`]/g, '')
    if (!safeEmail) return
    setMagicBusy(true)
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email: safeEmail,
          options: { emailRedirectTo: window.location.origin + '/dashboard' }
        })
        if (error) { setErr(error.message); setMagicBusy(false); return }
        setMagicSent(true)
      } else {
        setErr('Magic link requires Supabase to be connected.')
      }
    } catch {
      setErr('Something went wrong. Please try again.')
    } finally {
      setMagicBusy(false)
    }
  }

  if (splash.show) {
    return <WelcomeSplash name={splash.name} onDone={() => { setSplash({show:false,name:''}); router.push('/dashboard') }}/>
  }

  if (mode === 'forgot') return (
    <main style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <ForgotFlow onBack={() => setMode('login')}/>
      <div style={{ marginTop:24 }}><PoweredBy dark={true}/></div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem', position:'relative', overflow:'hidden' }}>
      {/* Ambient background blobs */}
      <div style={{ position:'absolute', top:'8%', left:'10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(27,67,50,0.35) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'15%', right:'8%', width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)', filter:'blur(50px)', pointerEvents:'none' }}/>

      {/* Logo mark */}
      <div style={{ marginBottom:28, textAlign:'center' }}>
        <div style={{ width:52, height:52, background:'var(--grad-brand)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', boxShadow:'var(--sh-brand)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </div>
        <div style={{ fontSize:13, fontWeight:800, fontFamily:'var(--font-display)', color:'white', letterSpacing:'-0.01em' }}>Harvesters HICC</div>
        <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'.08em', fontWeight:600, textTransform:'uppercase', marginTop:2 }}>Workforce Community</div>
      </div>

      {/* Login card */}
      <div className="glass" style={{ width:'100%', maxWidth:380, padding:'2rem' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'white', marginBottom:4, letterSpacing:'-0.02em' }}>Sign in</h1>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:16 }}>Enter your credentials to continue</p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:18, padding:'6px 10px', background: supabase ? 'rgba(16,185,129,0.08)' : 'rgba(201,168,76,0.08)', border:`1px solid ${supabase ? 'rgba(16,185,129,0.2)' : 'rgba(201,168,76,0.2)'}`, borderRadius:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: supabase ? '#10B981' : '#C9A84C', flexShrink:0 }}/>
          <span style={{ fontSize:11, color: supabase ? '#6EE7B7' : 'var(--gold)' }}>
            {supabase ? 'Connected to Harvesters database' : 'Demo mode - database not connected'}
          </span>
        </div>

        {err && (
          <div style={{ background:'rgba(197,48,48,.15)', border:'1px solid rgba(197,48,48,.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#FC8181', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:6, letterSpacing:'.03em' }}>Email address</label>
            <input className="input-dark" type="email" value={email} onChange={e => { setEmail(e.target.value); setErr('') }} placeholder="your@email.com" required autoComplete="email" autoFocus/>
          </div>
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'rgba(255,255,255,.45)', display:'block', marginBottom:6, letterSpacing:'.03em' }}>Password</label>
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              <input className="input-dark" type={showPwd ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErr('') }} placeholder="Enter password" required autoComplete="current-password" style={{ paddingRight:44, marginBottom:0 }}/>
              <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.45)', padding:4, display:'flex', alignItems:'center', zIndex:1 }}>
                {showPwd
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div style={{ textAlign:'right', marginBottom:20 }}>
            <button type="button" onClick={() => setMode('forgot')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gold)', fontSize:12, fontFamily:'var(--font-body)', fontWeight:600 }}>
              Forgot password?
            </button>
          </div>
          <button type="submit" className="btn btn-brand" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, fontWeight:700 }} disabled={busy}>
            {busy ? (
              <><svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Signing in…</>
            ) : 'Sign in to your account'}
          </button>
        </form>

        {biometric && (
          <button onClick={useBiometric} disabled={bioLoading} style={{ width:'100%', marginTop:10, padding:'11px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, cursor:'pointer', color:'rgba(255,255,255,.7)', fontSize:13, fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}>
            {bioLoading ? (
              <><svg className="anim-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Authenticating…</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M6 9a6 6 0 0 0 12 0"/><path d="M12 17v5"/><path d="M9 20h6"/></svg> Use Face ID / Fingerprint</>
            )}
          </button>
        )}

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'18px 0 14px' }}>
          <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,0.1)' }}/>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.25)', letterSpacing:'.06em', textTransform:'uppercase' }}>or</span>
          <div style={{ flex:1, height:'0.5px', background:'rgba(255,255,255,0.1)' }}/>
        </div>

        {/* Magic link */}
        {!magicMode ? (
          <button onClick={() => { setMagicMode(true); setErr('') }} style={{ width:'100%', padding:'11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, cursor:'pointer', color:'rgba(255,255,255,.55)', fontSize:13, fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .15s' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Sign in with magic link
          </button>
        ) : magicSent ? (
          <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>📬</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#6EE7B7', marginBottom:4 }}>Magic link sent!</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.6 }}>Check your inbox at <strong style={{ color:'white' }}>{magicEmail}</strong> and click the link to sign in.</div>
            <button onClick={() => { setMagicMode(false); setMagicSent(false); setMagicEmail('') }} style={{ marginTop:12, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.35)', fontSize:12, fontFamily:'var(--font-body)' }}>Back to sign in</button>
          </div>
        ) : (
          <form onSubmit={sendMagicLink}>
            <div style={{ display:'flex', gap:8 }}>
              <input className="input-dark" type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} placeholder="your@email.com" required autoFocus style={{ flex:1, marginBottom:0 }}/>
              <button type="submit" className="btn btn-brand" style={{ padding:'10px 14px', whiteSpace:'nowrap', flexShrink:0 }} disabled={magicBusy}>
                {magicBusy ? '…' : 'Send link'}
              </button>
            </div>
            <button type="button" onClick={() => { setMagicMode(false); setErr('') }} style={{ marginTop:8, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,.3)', fontSize:12, fontFamily:'var(--font-body)', padding:0 }}>← Back to password</button>
          </form>
        )}

        <p style={{ textAlign:'center', marginTop:18, fontSize:12.5, color:'rgba(255,255,255,.3)' }}>
          New worker?{' '}
          <a href="/signup" style={{ color:'var(--gold)', fontWeight:600, textDecoration:'none' }}>Register here</a>
        </p>
      </div>

      <div style={{ marginTop:24 }}><PoweredBy dark={true}/></div>
    </main>
  )
}
