import 'server-only'

import { cookies } from 'next/headers'
import { DEMO_COOKIE, DEMO_INSTITUTION_ID, demoAccounts, demoId } from '@/lib/demo/accounts'

/* -------------------------------------------------------------------------- */
/*  In-memory stand-in for the Supabase client (demo mode only).               */
/*  Supports exactly the query surface this app uses. Data lives in server     */
/*  memory and resets whenever the dev server restarts.                        */
/* -------------------------------------------------------------------------- */

type Row = Record<string, any>
type DbError = { message: string; code?: string }
type Result = { data: any; error: DbError | null; count: number | null }
type Store = Record<string, Row[]>

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

function seed(): Store {
  // Demo accounts are retained for UI walkthroughs. No students, attendance,
  // departments, workflows, notices, finance or academic sample records are seeded.
  const inst = DEMO_INSTITUTION_ID
  const profiles = demoAccounts.map((account) => ({
    user_id: account.id,
    institution_id: inst,
    full_name: account.name,
    title: account.label,
    phone: null,
    department_id: null,
    status: account.email === 'pending@astra.demo' ? 'pending' : 'active',
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }))
  const roleByEmail: Record<string, string> = {
    'principal@astra.demo': 'principal',
    'admin@astra.demo': 'administrator',
    'coordinator@astra.demo': 'coordinator',
    'hod.cse@astra.demo': 'hod',
    'faculty@astra.demo': 'faculty',
    'staff@astra.demo': 'staff',
  }
  const role_assignments = demoAccounts
    .filter((account) => roleByEmail[account.email])
    .map((account, index) => ({
      id: demoId(5, index + 1), institution_id: inst, user_id: account.id,
      role: roleByEmail[account.email], department_id: null, responsibility_id: null,
      status: 'active', assigned_by: demoAccounts[0].id,
      created_at: new Date(0).toISOString(), ended_at: null,
    }))
  return {
    institutions: [], departments: [], profiles, responsibilities: [], role_assignments,
    workflow_requests: [], workflow_steps: [], audit_logs: [], notifications: [],
    syllabus_progress: [], timetable_entries: [], academic_classes: [], academic_subjects: [],
    academic_students: [], attendance_sessions: [], attendance_records: [], attendance_settings: [],
    circulars: [], circular_acknowledgements: [], documents: [], marks_records: [],
    assignment_records: [], assignment_submissions: [], faculty_workspace_records: [],
    faculty_study_plan_items: [], faculty_lecture_executions: [], hod_workspace_records: [],
    workspace_workflow_events: [],
  }
}

const g = globalThis as unknown as { __astraDemoDb?: Store }
function store(): Store {
  return (g.__astraDemoDb ??= seed())
}

/* ------------------------------ helpers ---------------------------------- */

const clone = <T,>(v: T): T => (v == null ? v : (JSON.parse(JSON.stringify(v)) as T))
const newId = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const err = (message: string, code?: string): DbError => ({ message, code })
const lower = (v: unknown) => String(v ?? '').toLowerCase()

function rolesOf(userId: string) {
  return store().role_assignments.filter((r) => r.user_id === userId && r.status === 'active')
}
const hasRole = (userId: string, accepted: string[]) => rolesOf(userId).some((r) => accepted.includes(r.role))
const isAdmin = (userId: string) => hasRole(userId, ['principal', 'administrator'])
const isActive = (userId: string) => store().profiles.some((p) => p.user_id === userId && p.status === 'active')

/** Emulates the row-level-security read rules closely enough for a demo. */
function visible(table: string, userId: string | null): Row[] {
  const rows = (store()[table] ?? []) as Row[]
  if (!userId) return []
  if (table === 'notifications') return rows.filter((r) => r.recipient_id === userId)
  if (table === 'circular_acknowledgements') return rows.filter((r) => r.user_id === userId || isAdmin(userId))
  const wide = hasRole(userId, ['principal', 'administrator']) || rolesOf(userId).some((r) => r.role === 'coordinator' && r.department_id === null)
  if (table === 'audit_logs') return wide ? rows : rows.filter((r) => r.actor_id === userId)
  if (table === 'workflow_requests') {
    if (wide) return rows
    const headed = rolesOf(userId).filter((r) => r.role === 'hod').map((r) => r.department_id)
    return rows.filter((r) => r.requester_id === userId || r.owner_id === userId || (r.department_id && headed.includes(r.department_id)) ||
      store().workflow_steps.some((s) => s.workflow_id === r.id && s.approver_id === userId))
  }
  if (table === 'circulars') return rows.filter((r) => r.status === 'published' || r.author_id === userId || wide)
  if (['academic_classes','academic_subjects','academic_students'].includes(table)) {
    const allowedDepartments = rolesOf(userId).filter((r) => r.department_id).map((r) => r.department_id)
    return rows.filter((r) => wide || allowedDepartments.includes(r.department_id))
  }
  if (table === 'attendance_sessions') {
    const allowedDepartments = rolesOf(userId).filter((r) => r.department_id).map((r) => r.department_id)
    return rows.filter((r) => wide || r.faculty_user_id === userId || allowedDepartments.includes(r.department_id))
  }
  if (table === 'attendance_records') {
    const allowedDepartments = rolesOf(userId).filter((r) => r.department_id).map((r) => r.department_id)
    return rows.filter((r) => wide || r.recorded_by === userId || allowedDepartments.includes(r.department_id))
  }
  return rows
}

function compare(a: any, b: any) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a < b ? -1 : a > b ? 1 : 0
}

function notify(inst: string, recipient: string | null, title: string, body: string | null, kind: string, href: string | null) {
  if (!recipient) return
  store().notifications.push({ id: newId(), institution_id: inst, recipient_id: recipient, title, body, kind, href, read_at: null, created_at: now() })
}
function audit(inst: string, actor: string, action: string, entityType: string, entityId: string | null, related: string | null, metadata: Row = {}) {
  store().audit_logs.push({ id: newId(), institution_id: inst, actor_id: actor, action, entity_type: entityType, entity_id: entityId, related_workflow_id: related, metadata, created_at: now() })
}

/* --------------------------- insert / defaults --------------------------- */

const defaults: Record<string, () => Row> = {
  departments: () => ({ status: 'active', hod_user_id: null, description: null }),
  syllabus_progress: () => ({ review_status: 'draft', planned_hours: 0, completed_hours: 0 }),
  timetable_entries: () => ({ status: 'active', room: null }),
  circulars: () => ({ status: 'draft', audience: 'all', category: 'general', acknowledge_by: null, publish_at: null }),
  documents: () => ({ status: 'draft', version: 1, expires_at: null, category: 'general' }),
  circular_acknowledgements: () => ({ acknowledged_at: now() }),
}

function insertRow(table: string, input: Row): { row?: Row; error?: DbError } {
  const s = store()
  const row: Row = { id: newId(), ...(defaults[table]?.() ?? {}), ...input }
  if (['departments', 'syllabus_progress', 'timetable_entries', 'circulars', 'documents'].includes(table)) {
    row.created_at = now()
    row.updated_at = now()
  }
  const rows = (s[table] ??= []) as Row[]

  if (table === 'departments') {
    if (rows.some((d) => d.institution_id === row.institution_id && (d.code === row.code || lower(d.name) === lower(row.name)))) return { error: err('duplicate department', '23505') }
  }
  if (table === 'syllabus_progress') {
    if (row.completed_hours > row.planned_hours) return { error: err('hours exceed plan', '23514') }
    if (rows.some((r) => r.department_id === row.department_id && r.faculty_id === row.faculty_id && lower(r.subject) === lower(row.subject) && lower(r.unit) === lower(row.unit))) return { error: err('duplicate progress', '23505') }
  }
  if (table === 'circular_acknowledgements') {
    if (rows.some((r) => r.circular_id === row.circular_id && r.user_id === row.user_id)) return { error: err('duplicate acknowledgement', '23505') }
  }
  if (table === 'timetable_entries') {
    const overlaps = (r: Row) => r.status === 'active' && r.day_of_week === row.day_of_week && r.starts_at < row.ends_at && row.starts_at < r.ends_at
    const clash = rows.some((r) => overlaps(r) && ((row.room && lower(r.room) === lower(row.room)) || (r.department_id === row.department_id && lower(r.cohort) === lower(row.cohort))))
    if (clash) return { error: err('timetable clash', '23P01') }
    // Postgres time columns come back as HH:MM:SS
    if (/^\d\d:\d\d$/.test(row.starts_at)) row.starts_at += ':00'
    if (/^\d\d:\d\d$/.test(row.ends_at)) row.ends_at += ':00'
  }
  rows.push(row)
  return { row }
}

/* ------------------------------- RPCs ------------------------------------ */

function rpc(name: string, args: Row, uid: string | null): { error: DbError | null; data: any } {
  const s = store()
  if (!uid) return { data: null, error: err('Not authenticated', '28000') }
  const me = s.profiles.find((p) => p.user_id === uid && p.status === 'active')
  if (!me) return { data: null, error: err('Campus access is not active', '42501') }
  const inst = me.institution_id as string

  if (name === 'submit_workflow') {
    const title = String(args.p_title ?? '').trim()
    if (title.length < 3 || title.length > 160) return { data: null, error: err('Title must be 3 to 160 characters', '22023') }
    const deptId: string | null = args.p_department_id ?? null
    if (deptId && !s.departments.some((d) => d.id === deptId && d.status === 'active')) return { data: null, error: err('Unknown department', '22023') }

    const isTop = hasRole(uid, ['principal'])
    const chain: { id: string; label: string }[] = []
    const explicit: string[] = args.p_approver_ids ?? []
    if (explicit.length) {
      if (!hasRole(uid, ['principal', 'administrator', 'coordinator', 'hod'])) return { data: null, error: err('You cannot choose approvers', '42501') }
      explicit.forEach((id, i) => chain.push({ id, label: `Approval step ${i + 1}` }))
    } else {
      let hod: string | null = null
      if (deptId) {
        const dept = s.departments.find((d) => d.id === deptId)
        if (dept?.hod_user_id && dept.hod_user_id !== uid && isActive(dept.hod_user_id)) hod = dept.hod_user_id
        if (!hod) hod = s.role_assignments.find((r) => r.role === 'hod' && r.status === 'active' && r.department_id === deptId && r.user_id !== uid && isActive(r.user_id))?.user_id ?? null
      }
      let top: { id: string; label: string } | null = null
      const principal = s.role_assignments.find((r) => r.role === 'principal' && r.status === 'active' && r.user_id !== uid && isActive(r.user_id))
      if (principal) top = { id: principal.user_id, label: 'Principal approval' }
      else {
        const adm = s.role_assignments.find((r) => r.role === 'administrator' && r.status === 'active' && r.user_id !== uid && isActive(r.user_id))
        if (adm) top = { id: adm.user_id, label: 'Administrator approval' }
      }
      if (hod) chain.push({ id: hod, label: 'Department head review' })
      if (top && !(hod && ['task', 'leave', 'syllabus', 'timetable', 'attendance'].includes(args.p_module))) chain.push(top)
    }

    const status = chain.length === 0 && isTop ? 'approved' : 'pending'
    const seq = Math.max(0, ...s.workflow_requests.map((r) => Number(String(r.request_key).split('-').pop()) || 0)) + 1
    const key = `AST-${new Date().getUTCFullYear()}-${String(seq).padStart(5, '0')}`
    const id = newId()
    s.workflow_requests.push({
      id, institution_id: inst, request_key: key, module: args.p_module, title, description: String(args.p_description ?? '').trim() || null,
      priority: args.p_priority ?? 'normal', status, department_id: deptId, requester_id: uid, owner_id: args.p_owner_id ?? uid, due_at: args.p_due_at ?? null,
      payload: args.p_payload ?? {}, completed_at: status === 'approved' ? now() : null, created_at: now(), updated_at: now(),
    })
    chain.forEach((c, i) => s.workflow_steps.push({
      id: newId(), workflow_id: id, institution_id: inst, step_order: i + 1, label: c.label, approver_id: c.id,
      status: i === 0 ? 'pending' : 'waiting', comment: null, decided_at: null, created_at: now(),
    }))
    if (chain.length) notify(inst, chain[0].id, `Approval requested: ${title}`, `${key} is waiting for your review.`, 'approval', '/approvals')
    else if (status === 'pending') {
      new Set(s.role_assignments.filter((r) => r.status === 'active' && ['principal', 'administrator'].includes(r.role)).map((r) => r.user_id as string))
        .forEach((u) => notify(inst, u, `Request needs an approver: ${title.slice(0, 150)}`, `${key} was submitted but no approver is assigned.`, 'workflow', '/workflows'))
    }
    audit(inst, uid, 'workflow_submitted', 'workflow_request', id, id, { module: args.p_module, request_key: key, status, steps: chain.length })
    return { data: id, error: null }
  }

  if (name === 'decide_workflow') {
    const decision: string = args.p_decision
    const comment = String(args.p_comment ?? '').trim() || null
    if (!['approve', 'return', 'reject'].includes(decision)) return { data: null, error: err('Invalid decision', '22023') }
    if (decision !== 'approve' && !comment) return { data: null, error: err('A comment is required', '22023') }
    const req = s.workflow_requests.find((r) => r.id === args.p_workflow_id)
    if (!req || req.status !== 'pending') return { data: null, error: err('This request is no longer awaiting a decision', 'P0002') }
    const stepRow = s.workflow_steps.find((x) => x.workflow_id === req.id && x.approver_id === uid && x.status === 'pending')
    if (!stepRow) return { data: null, error: err('No pending approval for this user', '42501') }

    const outcome = decision === 'approve' ? 'approved' : decision === 'return' ? 'returned' : 'rejected'
    Object.assign(stepRow, { status: outcome, comment, decided_at: now() })
    if (decision === 'approve') {
      const next = s.workflow_steps.filter((x) => x.workflow_id === req.id && x.status === 'waiting').sort((a, b) => a.step_order - b.step_order)[0]
      if (next) {
        next.status = 'pending'
        notify(req.institution_id, next.approver_id, `Approval requested: ${req.title}`, `${req.request_key} is waiting for your review.`, 'approval', '/approvals')
      } else {
        Object.assign(req, { status: 'approved', completed_at: now(), updated_at: now() })
        notify(req.institution_id, req.requester_id, `Request approved: ${req.title}`, `${req.request_key} has been fully approved.`, 'workflow', '/workflows')
      }
    } else {
      s.workflow_steps.filter((x) => x.workflow_id === req.id && x.status === 'waiting').forEach((x) => (x.status = 'skipped'))
      Object.assign(req, { status: outcome, completed_at: decision === 'reject' ? now() : null, updated_at: now() })
      notify(req.institution_id, req.requester_id, `${decision === 'return' ? 'Request returned' : 'Request rejected'}: ${req.title}`, comment ?? req.request_key, 'workflow', '/workflows')
    }
    audit(req.institution_id, uid, `workflow_${outcome}`, 'workflow_step', stepRow.id, req.id, { step_order: stepRow.step_order, decision })
    return { data: null, error: null }
  }

  if (name === 'manage_member') {
    if (!isAdmin(uid)) return { data: null, error: err('Administrator access required', '42501') }
    const { p_user_id: target, p_status: status, p_role: role } = args
    const deptId: string | null = args.p_department_id ?? null
    if (target === uid) return { data: null, error: err('You cannot change your own access', '42501') }
    if (!['pending', 'active', 'suspended'].includes(status)) return { data: null, error: err('Invalid status', '22023') }
    if (!['administrator', 'coordinator', 'hod', 'faculty', 'staff'].includes(role)) return { data: null, error: err('Invalid role', '22023') }
    if (role === 'hod' && !deptId) return { data: null, error: err('A department head needs a department', '22023') }
    const prof = s.profiles.find((p) => p.user_id === target)
    if (!prof) return { data: null, error: err('Unknown member', 'P0002') }
    if (deptId && !s.departments.some((d) => d.id === deptId && d.status === 'active')) return { data: null, error: err('Unknown department', '22023') }
    const callerTop = hasRole(uid, ['principal'])
    if (hasRole(target, ['principal'])) return { data: null, error: err("The principal's access cannot be changed here", '42501') }
    if ((hasRole(target, ['administrator']) || role === 'administrator') && !callerTop) return { data: null, error: err('Only the principal can manage administrators', '42501') }

    const oldStatus = prof.status
    Object.assign(prof, { status, department_id: deptId, updated_at: now() })
    s.role_assignments.filter((r) => r.user_id === target && r.status === 'active' && r.responsibility_id == null).forEach((r) => Object.assign(r, { status: 'revoked', ended_at: now() }))
    s.role_assignments.push({ id: newId(), institution_id: inst, user_id: target, role, department_id: deptId, responsibility_id: null, status: 'active', assigned_by: uid, created_at: now(), ended_at: null })
    s.departments.filter((d) => d.hod_user_id === target && (role !== 'hod' || d.id !== deptId)).forEach((d) => (d.hod_user_id = null))
    if (role === 'hod') {
      s.role_assignments.filter((r) => r.role === 'hod' && r.status === 'active' && r.department_id === deptId && r.user_id !== target).forEach((r) => {
        Object.assign(r, { status: 'revoked', ended_at: now() })
        s.role_assignments.push({ id: newId(), institution_id: inst, user_id: r.user_id, role: 'faculty', department_id: deptId, responsibility_id: null, status: 'active', assigned_by: uid, created_at: now(), ended_at: null })
      })
      const dept = s.departments.find((d) => d.id === deptId)
      if (dept) dept.hod_user_id = target
    }
    if (oldStatus !== status) {
      notify(inst, target, status === 'active' ? 'Your campus access is active' : status === 'suspended' ? 'Your campus access was paused' : 'Your campus access is under review', null, 'access', status === 'active' ? '/dashboard' : null)
    }
    audit(inst, uid, 'member_access_updated', 'profile', target, null, { status, role, department_id: deptId })
    return { data: null, error: null }
  }

  return { data: null, error: err(`Unknown function ${name}`, '42883') }
}

/* ---------------------------- query builder ------------------------------ */

class Query implements PromiseLike<Result> {
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private filters: ((r: Row) => boolean)[] = []
  private orders: { col: string; asc: boolean }[] = []
  private max: number | null = null
  private head = false
  private wantCount = false
  private returning = false
  private cardinality: 'many' | 'maybe' | 'one' = 'many'
  private payload: any = null

  constructor(private table: string, private uid: string | null) {}

  select(_columns?: string, opts?: { count?: string; head?: boolean }) {
    if (this.mode === 'select') {
      this.head = !!opts?.head
      this.wantCount = !!opts?.count
    } else this.returning = true
    return this
  }
  insert(payload: Row | Row[]) { this.mode = 'insert'; this.payload = payload; return this }
  update(payload: Row) { this.mode = 'update'; this.payload = payload; return this }
  delete() { this.mode = 'delete'; return this }
  eq(col: string, v: unknown) { this.filters.push((r) => r[col] === v); return this }
  neq(col: string, v: unknown) { this.filters.push((r) => r[col] !== v); return this }
  gt(col: string, v: unknown) { this.filters.push((r) => r[col] != null && compare(r[col], v) > 0); return this }
  gte(col: string, v: unknown) { this.filters.push((r) => r[col] != null && compare(r[col], v) >= 0); return this }
  lt(col: string, v: unknown) { this.filters.push((r) => r[col] != null && compare(r[col], v) < 0); return this }
  lte(col: string, v: unknown) { this.filters.push((r) => r[col] != null && compare(r[col], v) <= 0); return this }
  in(col: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[col])); return this }
  is(col: string, v: unknown) { this.filters.push((r) => (v === null ? r[col] == null : r[col] === v)); return this }
  order(col: string, opts?: { ascending?: boolean }) { this.orders.push({ col, asc: opts?.ascending !== false }); return this }
  limit(n: number) { this.max = n; return this }
  maybeSingle() { this.cardinality = 'maybe'; return this }
  single() { this.cardinality = 'one'; return this }

  private run(): Result {
    const matches = () => visible(this.table, this.uid).filter((r) => this.filters.every((f) => f(r)))

    if (this.mode === 'insert') {
      const inserted: Row[] = []
      for (const input of Array.isArray(this.payload) ? this.payload : [this.payload]) {
        const res = insertRow(this.table, input)
        if (res.error) return { data: null, error: res.error, count: null }
        inserted.push(res.row!)
      }
      return { data: this.returning ? clone(inserted) : null, error: null, count: null }
    }

    if (this.mode === 'update') {
      const rows = matches()
      rows.forEach((r) => Object.assign(r, this.payload, 'updated_at' in r ? { updated_at: now() } : {}))
      return { data: this.returning ? clone(rows) : null, error: null, count: null }
    }

    if (this.mode === 'delete') {
      const rows = matches()
      const list = (store()[this.table] ??= []) as Row[]
      rows.forEach((r) => list.splice(list.indexOf(r), 1))
      return { data: null, error: null, count: null }
    }

    let rows = matches()
    for (const { col, asc } of [...this.orders].reverse()) rows = [...rows].sort((a, b) => (asc ? 1 : -1) * compare(a[col], b[col]))
    const count = rows.length
    if (this.max !== null) rows = rows.slice(0, this.max)
    const out = clone(rows)

    if (this.head) return { data: null, error: null, count: this.wantCount ? count : null }
    if (this.cardinality === 'many') return { data: out, error: null, count: this.wantCount ? count : null }
    if (this.cardinality === 'one' && out.length !== 1) return { data: null, error: err('Expected a single row', 'PGRST116'), count: null }
    return { data: out[0] ?? null, error: null, count: null }
  }

  then<A = Result, B = never>(onfulfilled?: ((v: Result) => A | PromiseLike<A>) | null, onrejected?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(onfulfilled, onrejected)
  }
}

/* ------------------------------ public API -------------------------------- */

export async function createDemoServerClient() {
  const jar = await cookies()
  const cookieId = jar.get(DEMO_COOKIE)?.value
  const account = demoAccounts.find((a) => a.id === cookieId) ?? null
  const uid = account?.id ?? null

  const user = account && {
    id: account.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: account.email,
    app_metadata: { provider: 'demo' },
    user_metadata: { full_name: account.name },
    created_at: hoursAgo(1000),
  }

  return {
    from: (table: string) => new Query(table, uid),
    rpc: async (name: string, args: Row = {}) => rpc(name, args, uid),
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session: user ? { user } : null }, error: null }),
      getClaims: async () => ({ data: user ? { claims: { sub: user.id, email: user.email } } : null, error: null }),
      exchangeCodeForSession: async () => ({ data: null, error: err('Email confirmation is disabled in demo mode.') }),
      signOut: async () => ({ error: null }),
    },
  }
}
