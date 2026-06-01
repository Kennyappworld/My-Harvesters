/* ─────────────────────────────────────────────────────────────────────────
   HICC Church Data v4.0 — Workforce Platform
   ───────────────────────────────────────────────────────────────────────── */

export const BRANCH_COLORS: Record<string, string> = {
  lekki:'#1B4332', gbagada:'#10B981', ikeja:'#F59E0B',
  anthony:'#8B5CF6', abuja:'#EF4444', portharcourt:'#EC4899',
  ibadan:'#F97316', london:'#3B82F6', houston:'#14B8A6',
}

export const branches = [
  { id:'lekki',        name:'Lekki HQ',       short:'Lekki',   location:'Lekki Phase 1, Lagos',  country:'NG', type:'hq',           pastor:'Pastor Bolaji Idowu',  members:18200, attendance:92, services:4, color:'#1B4332', founded:2003 },
  { id:'gbagada',      name:'Gbagada',         short:'Gbagada', location:'Gbagada, Lagos',         country:'NG', type:'branch',       pastor:'Pastor Emeka Nwosu',   members:14500, attendance:88, services:3, color:'#10B981', founded:2007 },
  { id:'ikeja',        name:'Ikeja',           short:'Ikeja',   location:'Ikeja GRA, Lagos',       country:'NG', type:'review',       pastor:'TBA',                  members:11800, attendance:84, services:3, color:'#F59E0B', founded:2009 },
  { id:'anthony',      name:'Anthony Village', short:'Anthony', location:'Anthony Village, Lagos', country:'NG', type:'branch',       pastor:'Pastor Bola Fadahunsi',members:9400,  attendance:79, services:2, color:'#6B7280', founded:2011 },
  { id:'abuja',        name:'Abuja',           short:'Abuja',   location:'FCT, Abuja',             country:'NG', type:'review',       pastor:'Pastor Lola Adeleke',  members:8700,  attendance:81, services:2, color:'#C05621', founded:2012 },
  { id:'portharcourt', name:'Port Harcourt',   short:'PH',      location:'Port Harcourt, Rivers',  country:'NG', type:'branch',       pastor:'Pastor Chidi Obi',     members:6800,  attendance:80, services:2, color:'#9C4221', founded:2014 },
  { id:'ibadan',       name:'Ibadan',          short:'Ibadan',  location:'Ibadan, Oyo State',      country:'NG', type:'branch',       pastor:'TBA',                  members:3700,  attendance:77, services:2, color:'#F97316', founded:2016 },
  { id:'london',       name:'London UK',       short:'London',  location:'London, United Kingdom', country:'UK', type:'international',pastor:'Pastor James Osei',    members:6200,  attendance:86, services:2, color:'#3B82F6', founded:2010 },
  { id:'houston',      name:'Houston USA',     short:'Houston', location:'Texas, United States',   country:'US', type:'international',pastor:'Pastor Sola Williams', members:4100,  attendance:82, services:2, color:'#14B8A6', founded:2013 },
]

export const DEPARTMENTS = [
  { id:'ushering',   name:'Ushering',               color:'#1B4332', icon:'🚪', head:'Deacon Segun' },
  { id:'worship',    name:'Worship & Music',         color:'#F59E0B', icon:'🎵', head:'Minister Tolu' },
  { id:'media',      name:'Media & Technology',      color:'#3B82F6', icon:'📷', head:'Bro Kenny' },
  { id:'kids',       name:'KidsHouse',               color:'#10B981', icon:'🧒', head:'Sis Tosin' },
  { id:'protocol',   name:'Protocol & Guest Care',   color:'#9C4221', icon:'🤝', head:'Sis Amaka' },
  { id:'welfare',    name:'Welfare & Care',          color:'#C05621', icon:'❤️', head:'Deaconess Funke' },
  { id:'outreach',   name:'Outreach & Evangelism',   color:'#F97316', icon:'📢', head:'Pastor Kola' },
  { id:'prayer',     name:'Prayer & Intercession',   color:'#6B7280', icon:'🙏', head:'Elder Taiwo' },
  { id:'security',   name:'Security & Traffic',      color:'#14B8A6', icon:'🛡️', head:'Bro Ibrahim' },
  { id:'drama',      name:'Drama & Creative Arts',   color:'#6366F1', icon:'🎭', head:'Sis Ngozi' },
  { id:'IT',         name:'IT & Digital',            color:'#06B6D4', icon:'💻', head:'Bro David' },
  { id:'admin',      name:'Administration',          color:'#84CC16', icon:'📋', head:'Sis Grace' },
]

export const memberGrowthMonthly = [
  { month:'Jan', lekki:310, gbagada:245, ikeja:190, anthony:148, abuja:162, portharcourt:112, ibadan:58, london:98,  houston:64,  total:1387 },
  { month:'Feb', lekki:288, gbagada:230, ikeja:175, anthony:139, abuja:144, portharcourt:104, ibadan:52, london:110, houston:71,  total:1313 },
  { month:'Mar', lekki:342, gbagada:271, ikeja:204, anthony:166, abuja:178, portharcourt:128, ibadan:67, london:124, houston:78,  total:1558 },
  { month:'Apr', lekki:368, gbagada:292, ikeja:218, anthony:179, abuja:191, portharcourt:141, ibadan:72, london:131, houston:84,  total:1676 },
  { month:'May', lekki:394, gbagada:314, ikeja:231, anthony:192, abuja:204, portharcourt:155, ibadan:81, london:148, houston:91,  total:1810 },
]

export const SERVICE_RECORDS = [
  { id:'sr1', branchId:'lekki', branchName:'Lekki HQ', date:'May 25 2026', service:'1st Service', newMembers:[
    { id:'nm1', name:'Adaeze Okonkwo',   phone:'+234 810 123 4567', email:'adaeze@gmail.com',   dept:'ushering', referredBy:'Emeka Obi',   firstTimer:false },
    { id:'nm2', name:'Femi Adeyemi',     phone:'+234 803 234 5678', email:'femi.a@yahoo.com',    dept:'worship',  referredBy:'',            firstTimer:true  },
    { id:'nm3', name:'Chisom Eze',       phone:'+234 706 345 6789', email:'',                    dept:'kids',     referredBy:'Bro Chidi',   firstTimer:true  },
    { id:'nm4', name:'Blessing Nwosu',   phone:'+234 809 456 7890', email:'blessing@gmail.com',  dept:'protocol', referredBy:'Sis Grace',   firstTimer:false },
  ]},
  { id:'sr2', branchId:'lekki', branchName:'Lekki HQ', date:'May 25 2026', service:'2nd Service', newMembers:[
    { id:'nm5', name:'Oluwaseun Bello',  phone:'+234 813 567 8901', email:'seun.b@gmail.com',    dept:'media',    referredBy:'',            firstTimer:true  },
    { id:'nm6', name:'Tokunbo Adeleke',  phone:'+234 818 678 9012', email:'',                    dept:'prayer',   referredBy:'Pastor Kola', firstTimer:false },
  ]},
  { id:'sr3', branchId:'gbagada', branchName:'Gbagada', date:'May 25 2026', service:'Single Service', newMembers:[
    { id:'nm7', name:'Richard Okoro',    phone:'+234 701 789 0123', email:'richard@gmail.com',   dept:'outreach', referredBy:'',            firstTimer:true  },
    { id:'nm8', name:'Ngozi Chukwu',     phone:'+234 803 890 1234', email:'ngozi.c@yahoo.com',   dept:'welfare',  referredBy:'Deaconess Funke', firstTimer:false },
    { id:'nm9', name:'Samuel Adewale',   phone:'+234 706 901 2345', email:'',                    dept:'ushering', referredBy:'Bro Samuel',  firstTimer:true  },
  ]},
  { id:'sr4', branchId:'ikeja', branchName:'Ikeja', date:'May 25 2026', service:'Single Service', newMembers:[
    { id:'nm10', name:'Kemi Oladipo',    phone:'+234 809 012 3456', email:'kemi.o@gmail.com',    dept:'drama',    referredBy:'',            firstTimer:true  },
    { id:'nm11', name:'Taiwo Bakare',    phone:'+234 810 123 4560', email:'',                    dept:'worship',  referredBy:'Sis Joy',     firstTimer:false },
  ]},
]

export const retentionMonthly = [
  { month:'Jan', lekki:87, gbagada:84, ikeja:79, anthony:76, abuja:78, portharcourt:75, ibadan:73, london:88, houston:86, avg:80.7 },
  { month:'Feb', lekki:88, gbagada:85, ikeja:78, anthony:77, abuja:76, portharcourt:76, ibadan:74, london:89, houston:87, avg:81.1 },
  { month:'Mar', lekki:89, gbagada:86, ikeja:80, anthony:78, abuja:79, portharcourt:78, ibadan:75, london:90, houston:88, avg:82.6 },
  { month:'Apr', lekki:90, gbagada:87, ikeja:81, anthony:79, abuja:77, portharcourt:79, ibadan:76, london:91, houston:89, avg:83.2 },
  { month:'May', lekki:92, gbagada:88, ikeja:82, anthony:80, abuja:78, portharcourt:80, ibadan:77, london:92, houston:90, avg:84.3 },
]

export const retentionCohorts = [
  { branch:'Lekki HQ',      id:'lekki',        r3m:92, r6m:87, r12m:79, atRisk:340,  goneQuiet:820  },
  { branch:'Gbagada',       id:'gbagada',       r3m:88, r6m:83, r12m:74, atRisk:290,  goneQuiet:640  },
  { branch:'Ikeja',         id:'ikeja',         r3m:82, r6m:76, r12m:67, atRisk:480,  goneQuiet:980  },
  { branch:'Anthony',       id:'anthony',       r3m:80, r6m:74, r12m:65, atRisk:310,  goneQuiet:590  },
  { branch:'Abuja',         id:'abuja',         r3m:78, r6m:72, r12m:63, atRisk:390,  goneQuiet:720  },
  { branch:'Port Harcourt', id:'portharcourt',  r3m:80, r6m:74, r12m:65, atRisk:220,  goneQuiet:430  },
  { branch:'Ibadan',        id:'ibadan',        r3m:77, r6m:71, r12m:62, atRisk:180,  goneQuiet:310  },
  { branch:'London UK',     id:'london',        r3m:92, r6m:88, r12m:81, atRisk:140,  goneQuiet:210  },
  { branch:'Houston USA',   id:'houston',       r3m:90, r6m:85, r12m:79, atRisk:98,   goneQuiet:140  },
]

export const firstTimerFunnel = [
  { week:'Apr 6',  firstTimers:710, returnedWk2:412, joinedGroup:198, becameMember:89  },
  { week:'Apr 13', firstTimers:740, returnedWk2:428, joinedGroup:211, becameMember:97  },
  { week:'Apr 20', firstTimers:768, returnedWk2:445, joinedGroup:224, becameMember:104 },
  { week:'Apr 27', firstTimers:792, returnedWk2:460, joinedGroup:236, becameMember:112 },
  { week:'May 4',  firstTimers:820, returnedWk2:480, joinedGroup:248, becameMember:118 },
  { week:'May 11', firstTimers:845, returnedWk2:494, joinedGroup:261, becameMember:124 },
  { week:'May 18', firstTimers:868, returnedWk2:512, joinedGroup:274, becameMember:131 },
  { week:'May 25', firstTimers:890, returnedWk2:528, joinedGroup:286, becameMember:139 },
]

export const churnReasons = [
  { reason:'Relocated',                 pct:28, color:'#1B4332' },
  { reason:'Joined another church',     pct:22, color:'#C05621' },
  { reason:'No small group connection', pct:19, color:'#F59E0B' },
  { reason:'Irregular → lapse',         pct:16, color:'#6B7280' },
  { reason:'Life circumstances',        pct:10, color:'#9C4221' },
  { reason:'Other',                     pct:5,  color:'#71717A' },
]

export const weeklyAttendance = [
  { week:'Apr 6',  lekki:12800, gbagada:9800,  ikeja:6200, anthony:4800, abuja:5100, london:3800, houston:2300 },
  { week:'Apr 13', lekki:13100, gbagada:10100, ikeja:6400, anthony:4900, abuja:5200, london:3900, houston:2380 },
  { week:'Apr 20', lekki:12900, gbagada:10000, ikeja:6300, anthony:4850, abuja:5150, london:3850, houston:2350 },
  { week:'Apr 27', lekki:13400, gbagada:10300, ikeja:6550, anthony:5000, abuja:5300, london:4000, houston:2420 },
  { week:'May 4',  lekki:13600, gbagada:10400, ikeja:6620, anthony:5100, abuja:5350, london:4050, houston:2460 },
  { week:'May 11', lekki:13800, gbagada:10550, ikeja:6680, anthony:5150, abuja:5400, london:4100, houston:2490 },
  { week:'May 18', lekki:13680, gbagada:10500, ikeja:6700, anthony:5200, abuja:5450, london:4150, houston:2540 },
  { week:'May 25', lekki:14100, gbagada:10700, ikeja:6700, anthony:5300, abuja:5500, london:4200, houston:2600 },
]

export const ATTENDANCE_RECORDS = [
  { id:'at1', date:'May 25 2026', branchId:'lekki', branchName:'Lekki HQ', service:'1st Service (8AM)', total:4820, departments:[
    { dept:'Ushering',   count:48, members:[{name:'Segun Adeyemi',phone:'+234 810 111 2222'},{name:'Bisi Okafor',phone:'+234 803 222 3333'},{name:'Tunde Bakare',phone:'+234 706 333 4444'}] },
    { dept:'Worship',    count:32, members:[{name:'Tolu Adewale',phone:'+234 809 444 5555'},{name:'Amaka Eze',phone:'+234 813 555 6666'}] },
    { dept:'KidsHouse',  count:24, members:[{name:'Tosin Obi',phone:'+234 818 666 7777'}] },
    { dept:'Media',      count:12, members:[{name:'Kenny James',phone:'+234 701 777 8888'}] },
    { dept:'Protocol',   count:18, members:[{name:'Grace Nwosu',phone:'+234 803 888 9999'}] },
  ]},
  { id:'at2', date:'May 25 2026', branchId:'lekki', branchName:'Lekki HQ', service:'2nd Service (10AM)', total:5890, departments:[
    { dept:'Ushering',   count:52, members:[{name:'Emeka Obi',phone:'+234 810 000 1111'},{name:'Funke Ade',phone:'+234 706 111 2222'}] },
    { dept:'Worship',    count:38, members:[{name:'Seun Cole',phone:'+234 803 222 3334'}] },
    { dept:'KidsHouse',  count:28, members:[{name:'Ngozi Kalu',phone:'+234 809 333 4445'}] },
    { dept:'Media',      count:14, members:[{name:'David Brown',phone:'+234 813 444 5556'}] },
  ]},
  { id:'at3', date:'May 25 2026', branchId:'gbagada', branchName:'Gbagada', service:'Single Service (9AM)', total:3840, departments:[
    { dept:'Ushering',   count:36, members:[{name:'Richard Okoro',phone:'+234 701 555 6667'}] },
    { dept:'Worship',    count:22, members:[{name:'Chisom Eze',phone:'+234 803 666 7778'}] },
    { dept:'KidsHouse',  count:18, members:[{name:'Samuel Adewale',phone:'+234 706 777 8889'}] },
  ]},
]

export const prayerRequests = [
  { id:'1', author:'Funke Oladipo',    branch:'Ikeja',    branchId:'ikeja',   initials:'FO', av:'purple', time:'2h ago',  scope:'branch', elevated:true,  text:'Trusting God for a job breakthrough this month. I have been waiting for 8 months. Please agree with me in prayer.',       interceding:31, responses:4 },
  { id:'2', author:'Kolade Nwachukwu', branch:'London UK',branchId:'london',  initials:'KN', av:'blue',   time:'5h ago',  scope:'global', elevated:false, text:'My mother is scheduled for surgery next Friday. Standing on Isaiah 53:5 — please lift her in prayer.',                  interceding:58, responses:9 },
  { id:'3', author:'Toyin Okafor',     branch:'Gbagada',  branchId:'gbagada', initials:'TO', av:'amber',  time:'1d ago',  scope:'unit',   elevated:false, text:'Believing God for peace in my home. Things have been difficult. Please pray for restoration and understanding.',         interceding:14, responses:2 },
  { id:'4', author:'Richard Eze',      branch:'Abuja',    branchId:'abuja',   initials:'RE', av:'teal',   time:'2d ago',  scope:'branch', elevated:false, text:'Believing God for admission into medical school. Third attempt this year. Your prayers are appreciated.',                interceding:22, responses:6 },
]

export const chatChannels = [
  { id:'sc', label:'Senior Pastors Council',        scope:'leadership', av:'purple', initials:'SC', sub:'All branches · Leadership', unread:0, messages:[
    { id:'m1', from:'Pastor Bolaji', initials:'BI', av:'purple', text:'Good morning. This Sunday we observe communion. Please ensure all branch pastors brief their ushering leads by Thursday.', time:'9:02 AM', mine:false },
    { id:'m2', from:'P. Kanmi',      initials:'KA', av:'amber',  text:'Noted sir. Ikeja is ready and we will communicate to our unit heads today.', time:'9:15 AM', mine:false },
    { id:'m3', from:'You',           initials:'BI', av:'purple', text:'Each campus sources locally — coordinator will send the spec by end of today.', time:'9:21 AM', mine:true },
  ]},
  { id:'kh', label:'KidsHouse Leaders (All Branches)', scope:'peer', av:'green', initials:'KH', sub:'All KidsHouse heads · 9 members', unread:2, messages:[
    { id:'m4', from:'Sis Tosin (Gbagada)', initials:'ST', av:'green', text:'Has anyone tried the new curriculum from Open Doors? We piloted it and the kids loved it.', time:'10:12 AM', mine:false },
    { id:'m5', from:'Bro Seun (Lekki)',   initials:'BS', av:'blue',  text:'Yes! We used it in February. Happy to share our adaptation — will upload to the resources folder.', time:'10:20 AM', mine:false },
  ]},
  { id:'fr', label:'Small Group: Faith Rising', scope:'unit', av:'teal', initials:'FR', sub:'Lekki HQ · 18 members', unread:3, messages:[
    { id:'m6', from:'Adaeze', initials:'AA', av:'blue',  text:'Mid-week study is at my place this Thursday. Who can make it?', time:'2:14 PM', mine:false },
    { id:'m7', from:'Emmanuel', initials:'EM', av:'teal', text:'I will be there! Should I bring anything?', time:'2:20 PM', mine:false },
  ]},
  { id:'uw', label:'Ushering Unit — Lekki HQ', scope:'unit', av:'amber', initials:'UW', sub:'Ushering dept · 48 members', unread:1, messages:[
    { id:'m8', from:'Deacon Segun', initials:'DS', av:'amber', text:'Reminder: All ushers must arrive by 7:30AM this Sunday. Communion service — we need full strength.', time:'Fri 3PM', mine:false },
  ]},
]

export const testimonies = [
  { id:'1', author:'Emmanuel Abiola', branch:'Gbagada',      initials:'EA', av:'teal',   role:'Small group leader',    date:'May 23', category:'Healing',     text:'After three years of waiting, God gave us twins last week Thursday. The Gbagada Next Level Prayers group kept interceding for us.', celebrating:284, comments:47 },
  { id:'2', author:'Ngozi Kalu',      branch:'Lekki HQ',     initials:'NK', av:'blue',   role:'Growth Track graduate', date:'May 21', category:'Finance',     text:'I completed Growth Track Level 3 last month. Within 30 days, I received a promotion I had been passed over for twice.',           celebrating:192, comments:31 },
  { id:'3', author:'Michael Osei',    branch:'London UK',    initials:'MO', av:'purple', role:'Member',                date:'May 18', category:'Salvation',   text:'My brother who I have been praying for since 2019 gave his life to Christ last Sunday at the London campus.',                     celebrating:145, comments:22 },
  { id:'4', author:'Amaka Obi',       branch:'Port Harcourt',initials:'AO', av:'red',    role:'Workforce member',      date:'May 15', category:'Breakthrough', text:'After 18 months of rejection, my business proposal was accepted and funded. I serve in the media unit faithfully.',              celebrating:118, comments:18 },
]

export const volunteerSlots = [
  { id:'1', title:'Ushering — Lekki HQ (Service 1)', dept:'Ushering',  branch:'Lekki HQ',  date:'Jun 1', need:8,  confirmed:6,  color:'#1B4332' },
  { id:'2', title:'KidsHouse teachers — Gbagada',     dept:'KidsHouse', branch:'Gbagada',   date:'Jun 1', need:6,  confirmed:4,  color:'#10B981' },
  { id:'3', title:'Worship team — Ikeja (Service 2)', dept:'Worship',   branch:'Ikeja',     date:'Jun 1', need:12, confirmed:12, color:'#F59E0B' },
  { id:'4', title:'Media & livestream — Lekki HQ',    dept:'Media',     branch:'Lekki HQ',  date:'Jun 1', need:5,  confirmed:3,  color:'#3B82F6' },
  { id:'5', title:'Parking & traffic — Anthony',      dept:'Security',  branch:'Anthony',   date:'Jun 1', need:10, confirmed:7,  color:'#9C4221' },
]

export const announcements = [
  { id:'1', title:'Sunday — Special Communion Service',   from:'Senior Pastor',    to:'All branches', date:'May 24', scope:'all',    reached:71200, read:68400, status:'published', body:'This Sunday we observe Holy Communion across all campuses. Members are encouraged to come fasting.' },
  { id:'2', title:'HSAP Q2 2026 — Applications Now Open', from:'HSAP Coordinator', to:'Lekki HQ',     date:'May 22', scope:'branch', reached:18200, read:15600, status:'published', body:'The Harvesters Skill Acquisition Programme Q2 intake is open. Applications close June 15.' },
  { id:'3', title:'Growth Track Graduation — June 28',    from:'Discipleship Team',to:'All branches', date:'May 20', scope:'all',    reached:71200, read:54100, status:'published', body:'All members who completed Growth Track Level 3 are invited to graduation on June 28.' },
  { id:'4', title:'Abuja Praise Night — Awaiting Approval',from:'Abuja Admin',     to:'Abuja',        date:'May 22', scope:'branch', reached:0,     read:0,     status:'pending',   body:'Abuja campus submitted a praise night announcement for June 14. Awaiting senior pastor approval.' },
]
