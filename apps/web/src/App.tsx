import { useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, CheckCheck,
  ChevronDown, ClipboardCheck, Clock3, FileText, GraduationCap, LayoutDashboard,
  LifeBuoy, LogOut, Search, Settings2, ShieldCheck, Users, X,
} from 'lucide-react';
import { demoAccounts, type DemoAccount } from './demo/accounts';

const demoEnabled = import.meta.env.DEV;
type Page = 'Overview' | 'People' | 'Academic operations' | 'Approvals' | 'Circulars' | 'Reports' | 'Settings';
const navGroups = [
  { label: 'WORKSPACE', items: [{ name: 'Overview', icon: LayoutDashboard }, { name: 'People', icon: Users }, { name: 'Academic operations', icon: CalendarDays }, { name: 'Approvals', icon: ClipboardCheck }] },
  { label: 'INSTITUTION', items: [{ name: 'Circulars', icon: FileText }, { name: 'Reports', icon: Activity }, { name: 'Settings', icon: Settings2 }] },
];
const stats = [
  { label: 'Active staff', value: '248', note: 'Across 6 departments', icon: Users, tone: 'blue' },
  { label: 'Pending approvals', value: '08', note: '3 need attention', icon: ClipboardCheck, tone: 'green' },
  { label: 'Classes scheduled', value: '126', note: 'This academic week', icon: CalendarDays, tone: 'orange' },
  { label: 'Attendance submitted', value: '92.4%', note: 'This academic week', icon: CheckCheck, tone: 'violet' },
];
const requests = [
  { initials: 'AS', name: 'Ananya Shah', kind: 'Laboratory equipment requisition', dept: 'Computer Engineering', time: 'Today, 10:42 AM', state: 'Needs review', tone: 'amber' },
  { initials: 'RK', name: 'Rahul Kulkarni', kind: 'On-duty request', dept: 'Information Technology', time: 'Today, 09:18 AM', state: 'Pending HOD', tone: 'blue' },
  { initials: 'PM', name: 'Priya More', kind: 'Syllabus completion review', dept: 'AI & Data Science', time: 'Yesterday', state: 'Awaiting action', tone: 'violet' },
];
const events = [
  { title: 'Attendance submitted', detail: 'Computer Engineering · TE-A', time: '11 min ago', icon: CheckCheck },
  { title: 'Circular published', detail: 'Internal assessment schedule', time: '42 min ago', icon: FileText },
  { title: 'Approval completed', detail: 'Faculty duty request · IT', time: '1 hr ago', icon: ShieldCheck },
  { title: 'Timetable updated', detail: 'Room B-204 · Friday', time: '2 hrs ago', icon: CalendarDays },
];

export default function App() {
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [page, setPage] = useState<Page>('Overview');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('principal@astra.demo');
  const [password, setPassword] = useState('Demo@1234');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const signIn = (selected: DemoAccount) => {
    if (!demoEnabled) return;
    setAccount(selected);
    setPage('Overview');
    setError('');
  };
  const submitLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const selected = demoAccounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!selected) { setError('Invalid demo email or password.'); return; }
    signIn(selected);
  };

  if (!account) return <div className="login-page">
    <div className="login-art">
      <div className="login-brand"><div className="brand-mark"><GraduationCap size={25} /></div><div><strong>astra<span>+</span></strong><small>CAMPUS OPERATIONS</small></div></div>
      <div className="art-copy"><span className="eyebrow">INSTITUTIONAL OPERATIONS PLATFORM</span><h1>Every part of your campus.<br /><em>Working as one.</em></h1><p>A focused workspace for academic leadership, faculty, and the people who keep a college running.</p><div className="art-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><GraduationCap size={34} /></div><div className="orbit-node node-one"><Users size={17} /></div><div className="orbit-node node-two"><CalendarDays size={17} /></div><div className="orbit-node node-three"><ClipboardCheck size={17} /></div></div></div>
      <div className="art-foot"><span>BUILT FOR CAMPUS TEAMS</span><span>SECURE BY DESIGN · ROLE-AWARE WORKFLOWS</span></div>
    </div>
    <div className="login-side"><div className="login-form-wrap"><div className="mobile-brand"><GraduationCap size={22} /> ASTRA+</div><div className="form-kicker">WELCOME BACK</div><h2>Sign in to your workspace</h2><p className="form-intro">Use your institution-provided account to continue.</p>
      <form onSubmit={submitLogin}><label>Institutional email<input autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@college.edu" /></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <div className="login-error" role="alert">{error}</div>}<button className="login-submit" type="submit">Continue <ArrowUpRight size={17} /></button></form>
      {demoEnabled && <div className="demo-area"><button className="demo-toggle" onClick={() => setShowDemo(!showDemo)}>{showDemo ? <X size={15} /> : <ShieldCheck size={15} />} {showDemo ? 'Hide test accounts' : 'Open demo test accounts'} <ChevronDown size={15} /></button>{showDemo && <div className="demo-panel"><div className="demo-heading"><strong>Development test accounts</strong><span>Local preview only · no live college data</span></div>{demoAccounts.map((item) => <button className="demo-account" key={item.id} onClick={() => { setEmail(item.email); setPassword(item.password); signIn(item); }}><span className="demo-avatar">{item.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="demo-account-copy"><strong>{item.role}</strong><small>{item.email}</small></span><ArrowUpRight size={15} /></button>)}<div className="demo-password">Shared demo password: <code>Demo@1234</code></div></div>}</div>}
      <div className="login-security"><ShieldCheck size={16} /><span>Access is assigned by your institution. Your role determines the records and actions available to you.</span></div><div className="login-footer">ASTRA+ CAMPUS <span>·</span> INTERNAL STAFF WORKSPACE</div>
    </div></div>
  </div>;

  const title = page === 'Overview' ? `Good morning, ${account.role === 'Principal' ? 'Dr. Patil' : account.name.split(' ')[0]}` : page;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><GraduationCap size={22} /></div><div><div className="brand-name">astra<span>+</span></div><div className="brand-caption">CAMPUS OPERATIONS</div></div></div>
      <div className="institution-switch"><div className="institution-emblem">S</div><div className="institution-copy"><strong>Siddhant College</strong><span>Institution workspace</span></div><ChevronDown size={15} /></div><div className="nav-label">YOUR WORKSPACE</div>
      {navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-group-title">{group.label}</div>{group.items.map((item) => { const Icon = item.icon; return <button key={item.name} className={page === item.name ? 'nav-item active' : 'nav-item'} onClick={() => setPage(item.name as Page)}><Icon size={17} /><span>{item.name}</span>{item.name === 'Approvals' && <em>8</em>}</button>; })}</div>)}
      <div className="sidebar-spacer" /><div className="sidebar-status"><span className="status-dot" /><div><strong>Demo workspace</strong><small>Sample data · not connected</small></div></div><button className="nav-item muted" onClick={() => setPage('Settings')}><Settings2 size={17} /><span>Settings & configuration</span></button>
      <div className="sidebar-footer"><div className="avatar avatar-dark">{account.name.split(' ').map((part) => part[0]).slice(0,2).join('')}</div><div className="user-copy"><strong>{account.name}</strong><span>{account.role} · {account.department}</span></div><button className="icon-button small" title="Sign out" onClick={() => setAccount(null)}><LogOut size={16} /></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div><div className="topbar-actions"><label className="search-box"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." /></label><div className="top-action-wrap"><button className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={18} /><i /></button>{notificationsOpen && <div className="popover-panel"><strong>Notifications</strong><p>3 items need your attention.</p><p>Attendance submission is due by 4:00 PM.</p></div>}</div><div className="top-action-wrap"><button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}><div className="avatar">{account.name.split(' ').map((part) => part[0]).slice(0,2).join('')}</div><span><strong>{account.name}</strong><small>{account.role}</small></span><ChevronDown size={15} /></button>{profileOpen && <div className="popover-panel profile-popover"><strong>{account.name}</strong><p>{account.department}</p><button onClick={() => setAccount(null)}>Sign out</button></div>}</div></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> INTERNAL OPERATIONS</div><h1>{title}</h1><p>{page === 'Overview' ? 'A quick view of work moving across the institution.' : `Your ${page.toLowerCase()} workspace.`}</p></div><div className="heading-actions"><span className="demo-badge">DEMO · SAMPLE DATA</span><button className="primary-button" onClick={() => setPage('Approvals')}><ClipboardCheck size={16} /> Review approvals</button></div></div>
      {page === 'Overview' ? <>
        <div className="notice-strip"><div className="notice-icon"><Activity size={17} /></div><div><strong>Welcome to the staff operations preview</strong><span>Figures below are illustrative sample data, not live college records.</span></div></div>
        <div className="metric-grid">{stats.map((metric) => { const Icon = metric.icon; return <article className="metric-card" key={metric.label}><div className="metric-top"><div className={`metric-icon metric-icon-${metric.tone}`}><Icon size={18} /></div><span className="metric-period">SAMPLE</span></div><div className="metric-value">{metric.value}</div><div className="metric-label">{metric.label}</div><div className="metric-foot"><span className="trend"><ArrowUpRight size={14} />{metric.note}</span></div></article>; })}</div>
        <div className="content-grid"><section className="panel"><div className="panel-heading"><div><h2>Approval queue</h2><p>Illustrative requests for workflow testing</p></div><button className="text-link" onClick={() => setPage('Approvals')}>View all <ArrowUpRight size={14} /></button></div><div className="approval-list">{requests.filter((item) => !search || `${item.name} ${item.kind} ${item.dept}`.toLowerCase().includes(search.toLowerCase())).map((item) => <div className="approval-row" key={item.name}><div className="avatar">{item.initials}</div><div className="approval-copy"><strong>{item.kind}</strong><span>{item.name} · {item.dept}</span><small>{item.time}</small></div><span className={`status-pill ${item.tone}`}>{item.state}</span></div>)}</div><div className="panel-bottom"><span>Sample queue · 8 illustrative requests</span><button onClick={() => setPage('Approvals')}>Open approval centre <ArrowUpRight size={14} /></button></div></section>
          <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Example audit events</p></div><Clock3 size={17} /></div><div className="timeline">{events.map((item) => { const Icon = item.icon; return <div className="timeline-item" key={item.title}><div className="timeline-icon"><Icon size={16} /></div><div className="timeline-copy"><strong>{item.title}</strong><span>{item.detail}</span><small>{item.time}</small></div></div>; })}</div><button className="activity-link" onClick={() => setPage('Reports')}>View activity log <ArrowUpRight size={14} /></button></section></div>
      </> : <section className="panel section-placeholder"><div className="placeholder-icon"><Activity size={24} /></div><h2>{page}</h2><p>This page is a scaffold. Each module will be connected to the authenticated API and verified persistent data as its vertical slice is built.</p><div className="placeholder-grid"><div><ShieldCheck size={18} /><strong>Scoped access</strong><span>Department and assignment access must be checked server-side.</span></div><div><ClipboardCheck size={18} /><strong>Real workflows</strong><span>Transitions, approvals and validation belong to the API.</span></div><div><Activity size={18} /><strong>Audited changes</strong><span>Important actions will be recorded in the audit trail.</span></div></div></section>}
      <footer className="page-footer"><span>ASTRA+ CAMPUS OPERATIONS</span><span>Internal staff workspace</span><span>Demo build · Sample data only</span></footer></div></main>
  </div>;
}
