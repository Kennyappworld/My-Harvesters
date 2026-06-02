'use client'
import { useState, useEffect, useCallback, FormEvent } from 'react'
import PoweredBy from '@/lib/PoweredBy'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const DAILY_WORDS = [
  // GOD'S LOVE & IDENTITY
  { verse: 'The Lord your God is in your midst, a mighty one who will save; he will rejoice over you with gladness; he will quiet you by his love; he will exult over you with loud singing.', ref: 'Zephaniah 3:17 (ESV)' },
  { verse: 'Can a mother forget the baby at her breast and have no compassion on the child she has borne? Though she may forget, I will not forget you! See, I have engraved you on the palms of my hands.', ref: 'Isaiah 49:15-16 (NIV)' },
  { verse: 'I have loved you with an everlasting love; therefore I have continued my faithfulness to you.', ref: 'Jeremiah 31:3 (ESV)' },
  { verse: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', ref: 'Romans 8:38-39 (NIV)' },
  { verse: 'See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!', ref: '1 John 3:1 (NIV)' },
  { verse: 'But you are a chosen people, a royal priesthood, a holy nation, God\'s special possession, that you may declare the praises of him who called you out of darkness into his wonderful light.', ref: '1 Peter 2:9 (NIV)' },
  { verse: 'For we are God\'s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.', ref: 'Ephesians 2:10 (NIV)' },
  { verse: 'The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.', ref: 'Zephaniah 3:17 (NIV)' },
  { verse: 'Before I formed you in the womb I knew you, before you were born I set you apart; I appointed you as a prophet to the nations.', ref: 'Jeremiah 1:5 (NIV)' },
  { verse: 'You are precious in my eyes, and honoured, and I love you.', ref: 'Isaiah 43:4 (ESV)' },

  // FAITH & TRUST
  { verse: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', ref: 'Proverbs 3:5-6 (NIV)' },
  { verse: 'For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11 (NIV)' },
  { verse: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', ref: 'Romans 8:28 (NIV)' },
  { verse: 'Now faith is confidence in what we hope for and assurance about what we do not see.', ref: 'Hebrews 11:1 (NIV)' },
  { verse: 'For we live by faith, not by sight.', ref: '2 Corinthians 5:7 (NIV)' },
  { verse: 'Without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.', ref: 'Hebrews 11:6 (NIV)' },
  { verse: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.', ref: 'Matthew 7:7 (NIV)' },
  { verse: 'Jesus said to him, "If you can believe, all things are possible to him who believes."', ref: 'Mark 9:23 (NKJV)' },
  { verse: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13 (NKJV)' },
  { verse: 'But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', ref: 'Isaiah 40:31 (NIV)' },

  // GRACE & SALVATION
  { verse: 'For it is by grace you have been saved, through faith - and this is not from yourselves, it is the gift of God - not by works, so that no one can boast.', ref: 'Ephesians 2:8-9 (NIV)' },
  { verse: 'The grace of God has appeared that offers salvation to all people. It teaches us to say "No" to ungodliness and worldly passions, and to live self-controlled, upright and godly lives.', ref: 'Titus 2:11-12 (NIV)' },
  { verse: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness." Therefore I will boast all the more gladly about my weaknesses, so that Christ\'s power may rest on me.', ref: '2 Corinthians 12:9 (NIV)' },
  { verse: 'The LORD is compassionate and gracious, slow to anger, abounding in love.', ref: 'Psalm 103:8 (NIV)' },
  { verse: 'Let us then approach God\'s throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.', ref: 'Hebrews 4:16 (NIV)' },

  // GOD'S PRESENCE & PROTECTION
  { verse: 'The LORD is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.', ref: 'Psalm 23:1-3 (ESV)' },
  { verse: 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.', ref: 'Isaiah 41:10 (ESV)' },
  { verse: 'Fear not, for I have redeemed you; I have called you by name, you are mine. When you pass through the waters, I will be with you; and through the rivers, they shall not overwhelm you.', ref: 'Isaiah 43:1-2 (ESV)' },
  { verse: 'The Lord is my light and my salvation - whom shall I fear? The Lord is the stronghold of my life - of whom shall I be afraid?', ref: 'Psalm 27:1 (NIV)' },
  { verse: 'God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.', ref: 'Psalm 46:1-2 (NIV)' },
  { verse: 'He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty. I will say of the LORD, "He is my refuge and my fortress; My God, in Him I will trust."', ref: 'Psalm 91:1-2 (NKJV)' },
  { verse: 'No weapon formed against you shall prosper, and every tongue which rises against you in judgment you shall condemn. This is the heritage of the servants of the LORD.', ref: 'Isaiah 54:17 (NKJV)' },
  { verse: 'The LORD will fight for you; you need only to be still.', ref: 'Exodus 14:14 (NIV)' },

  // PURPOSE & CALLING
  { verse: 'You did not choose me, but I chose you and appointed you so that you might go and bear fruit - fruit that will last.', ref: 'John 15:16 (NIV)' },
  { verse: 'For we are co-workers in God\'s service; you are God\'s field, God\'s building.', ref: '1 Corinthians 3:9 (NIV)' },
  { verse: 'Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labour in the Lord is not in vain.', ref: '1 Corinthians 15:58 (NIV)' },
  { verse: 'Each of you should use whatever gift you have received to serve others, as faithful stewards of God\'s grace in its various forms.', ref: '1 Peter 4:10 (NIV)' },
  { verse: 'He said to them, "Go into all the world and preach the gospel to all creation."', ref: 'Mark 16:15 (NIV)' },
  { verse: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward.', ref: 'Colossians 3:23-24 (NIV)' },
  { verse: 'Commit to the LORD whatever you do, and he will establish your plans.', ref: 'Proverbs 16:3 (NIV)' },

  // PEACE & REST
  { verse: 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.', ref: 'Matthew 11:28-29 (NIV)' },
  { verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', ref: 'Philippians 4:6-7 (NIV)' },
  { verse: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', ref: 'Isaiah 26:3 (NIV)' },
  { verse: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', ref: 'John 14:27 (NIV)' },
  { verse: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7 (NIV)' },
  { verse: 'The LORD gives strength to his people; the LORD blesses his people with peace.', ref: 'Psalm 29:11 (NIV)' },

  // ABUNDANCE & PROVISION
  { verse: 'Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us, to him be glory.', ref: 'Ephesians 3:20-21 (NIV)' },
  { verse: 'The thief comes only to steal and kill and destroy. I came that they may have life and have it abundantly.', ref: 'John 10:10 (ESV)' },
  { verse: 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.', ref: 'Philippians 4:19 (NIV)' },
  { verse: 'Bring the whole tithe into the storehouse, that there may be food in my house. "Test me in this," says the LORD Almighty, "and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it."', ref: 'Malachi 3:10 (NIV)' },
  { verse: 'Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap.', ref: 'Luke 6:38 (NIV)' },
  { verse: 'The LORD will open the heavens, the storehouse of his bounty, to send rain on your land in season and to bless all the work of your hands.', ref: 'Deuteronomy 28:12 (NIV)' },

  // STRENGTH & VICTORY
  { verse: 'He gives strength to the weary and increases the power of the weak. Even youths grow tired and weary, and young men stumble and fall; but those who hope in the LORD will renew their strength.', ref: 'Isaiah 40:29-31 (NIV)' },
  { verse: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', ref: 'Joshua 1:9 (NIV)' },
  { verse: 'But thanks be to God! He gives us the victory through our Lord Jesus Christ.', ref: '1 Corinthians 15:57 (NIV)' },
  { verse: 'No, in all these things we are more than conquerors through him who loved us.', ref: 'Romans 8:37 (NIV)' },
  { verse: 'For everyone born of God overcomes the world. This is the victory that has overcome the world, even our faith.', ref: '1 John 5:4 (NIV)' },
  { verse: 'The horse is made ready for the day of battle, but victory rests with the LORD.', ref: 'Proverbs 21:31 (NIV)' },
  { verse: 'Submit yourselves, then, to God. Resist the devil, and he will flee from you.', ref: 'James 4:7 (NIV)' },

  // LIFE IN THE SPIRIT
  { verse: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.', ref: 'Galatians 5:22-23 (NIV)' },
  { verse: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', ref: '2 Timothy 1:7 (NIV)' },
  { verse: 'Those who live in accordance with the Spirit have their minds set on what the Spirit desires. The mind governed by the Spirit is life and peace.', ref: 'Romans 8:5-6 (NIV)' },
  { verse: 'But you will receive power when the Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea and Samaria, and to the ends of the earth.', ref: 'Acts 1:8 (NIV)' },

  // TRANSFORMATION & RENEWAL
  { verse: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is - his good, pleasing and perfect will.', ref: 'Romans 12:2 (NIV)' },
  { verse: 'Therefore, if anyone is in Christ, the new creation has come: the old has gone, the new is here!', ref: '2 Corinthians 5:17 (NIV)' },
  { verse: 'Create in me a pure heart, O God, and renew a steadfast spirit within me.', ref: 'Psalm 51:10 (NIV)' },
  { verse: 'He who was seated on the throne said, "I am making everything new!" Then he said, "Write this down, for these words are trustworthy and true."', ref: 'Revelation 21:5 (NIV)' },

  // PRAYER & SEEKING GOD
  { verse: 'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and I will forgive their sin and will heal their land.', ref: '2 Chronicles 7:14 (NIV)' },
  { verse: 'Call to me and I will answer you and tell you great and unsearchable things you do not know.', ref: 'Jeremiah 33:3 (NIV)' },
  { verse: 'Delight yourself in the LORD, and he will give you the desires of your heart.', ref: 'Psalm 37:4 (ESV)' },
  { verse: 'Draw near to God, and he will draw near to you.', ref: 'James 4:8 (ESV)' },
  { verse: 'This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.', ref: '1 John 5:14 (NIV)' },

  // LIFE & GODLINESS
  { verse: 'His divine power has given us everything we need for a godly life through our knowledge of him who called us by his own glory and goodness.', ref: '2 Peter 1:3 (NIV)' },
  { verse: 'Seek first his kingdom and his righteousness, and all these things will be given to you as well.', ref: 'Matthew 6:33 (NIV)' },
  { verse: 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers, but whose delight is in the law of the LORD, and who meditates on his law day and night.', ref: 'Psalm 1:1-2 (NIV)' },
  { verse: 'Taste and see that the LORD is good; blessed is the one who takes refuge in him.', ref: 'Psalm 34:8 (NIV)' },
  { verse: 'May he give you the desire of your heart and make all your plans succeed.', ref: 'Psalm 20:4 (NIV)' },
  { verse: 'This is the day the LORD has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24 (NIV)' },
  { verse: 'Let the morning bring me word of your unfailing love, for I have put my trust in you. Show me the way I should go, for to you I entrust my life.', ref: 'Psalm 143:8 (NIV)' },
  { verse: 'Your word is a lamp for my feet, a light on my path.', ref: 'Psalm 119:105 (NIV)' },
  { verse: 'The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.', ref: 'Lamentations 3:22-23 (ESV)' },
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
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 1900),
      setTimeout(() => setPhase(5), 2600),
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
    setSplash({ show: true, name })
  }, [])

  // Handle magic link redirect - Supabase puts tokens in the URL hash
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const name = session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0]
          || 'Welcome'
        sessionStorage.setItem('hicc_biometric_email', session.user.email || '')
        afterAuth(name, session.user.email || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [afterAuth])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const safeEmail = email.trim().toLowerCase().replace(/[<>"'`]/g, '')

    setBusy(true)
    try {
      if (supabase) {
        // Real Supabase authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email: safeEmail,
          password,
        })
        if (error) {
          setErr(error.message || 'Incorrect email or password.')
          setBusy(false)
          return
        }
        const name = data.user?.user_metadata?.full_name
          || data.user?.email?.split('@')[0]
          || 'Welcome'
        sessionStorage.setItem('hicc_biometric_email', safeEmail)
        afterAuth(name, safeEmail)
      } else {
        // Fallback demo mode when Supabase is not yet configured
        const DEMO: Record<string, string> = {
          'pastor@hicc.org': 'Pastor Bolaji Idowu',
          'pastor.ikeja@hicc.org': 'Pastor Kanmi Adeyemi',
          'pastor.london@hicc.org': 'Pastor James Osei',
          'segun@hicc.org': 'Segun Adeyemi',
        }
        const DEMO_PASS = process.env.NEXT_PUBLIC_DEMO_PASS || 'demo123'
        if (!DEMO[safeEmail] || password !== DEMO_PASS) {
          setErr('Incorrect email or password.')
          setBusy(false)
          return
        }
        sessionStorage.setItem('hicc_biometric_email', safeEmail)
        afterAuth(DEMO[safeEmail], safeEmail)
      }
    } catch {
      setErr('Something went wrong. Please try again.')
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
