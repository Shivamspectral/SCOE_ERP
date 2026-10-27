# Astra+ Campus ERP

A college staff ERP for principals, administrators, coordinators, HODs, faculty and non-teaching staff. Students and parents do not sign in. The Orbita Max React interface is the visual foundation; the application is moving to a Vite SPA and a separately deployed NestJS API.

## Architecture

- **Frontend:** React 19 + Vite 8, Orbita Max React/JSX screens, Tailwind CSS, Lucide, TanStack Query.
- **API:** NestJS 11 + TypeScript, versioned REST endpoints, DTO validation, Helmet, CORS allow-list, rate limiting and OpenAPI docs.
- **Auth/data:** Supabase Auth + PostgreSQL, institution-scoped tables and Row Level Security (RLS). The API verifies Supabase access tokens and forwards the caller's JWT to normal data queries. A server-only service-role key is optional and used only for administrator-authorized staff invitation emails.
- **Hosting target:** Vercel for the static frontend, Render (or another Node host) for the API, Supabase for auth and PostgreSQL.

## Implemented foundation

- Supabase bearer-token verification and identity/role lookup.
- Department directory.
- Staff directory with role/status/department updates through the database's `manage_member` function.
- Workflow request queue and approval decisions through `submit_workflow` and `decide_workflow`.
- Circular list, draft creation and role-checked publishing.
- Attendance session creation, complete-roster submission, scoped HOD/leadership review, correction feedback, and database-enforced status transitions.
- Privacy-conscious audit triggers for staff, department, student, attendance, marks, workflow, circular and document changes, with a role-scoped audit-log API.
- Per-user notifications and mark-read actions.
- Core schema and RLS migrations plus academic workspace tables.
- CI build/typecheck checks, API DTO regression tests, and database migration validation.

**Production readiness note:** this is an actively developed ERP foundation, not yet a verified production-ready ₹3 lakh delivery. Some Orbita Max screens still use synthetic local data or UI-only actions; several modules still need dedicated API endpoints, automated integration/security tests, and end-to-end validation against a real Supabase project before real college records are used. Demo data must never be represented as institutional data.

## Live-data boundaries

Authenticated sessions are restricted to routes backed by institutional API calls: dashboard summary, timetable, attendance, marks, published circulars, notifications, profile, academics, classes, departments, staff and student directories, approvals/workflows, document metadata, and audit logs. Live data is never silently replaced with sample fixtures when these requests fail.

The following remain unavailable until their API, persistence, permissions, and acceptance tests are implemented: binary document upload/download; official exam schedules, result cards and hall tickets; report generation/file delivery; grievance tickets; event registrations; placement applications; library reservations; hostel and transport operations; club/sports/alumni services; persistent task and mentoring records; notification subscriptions/delivery; and saved notification preferences. These routes are blocked or show an explicit unavailable state for authenticated sessions. A successful workflow request means only that the request was recorded for review; it does not imply that an external action (SMS, email, gate pass, official PDF or university upload) occurred.

## Local development

Requirements: Node.js 22.12+ and pnpm 12.3.4.

1. Install workspace dependencies:
   ```bash
   pnpm install
   ```
2. Create environment files:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```
3. Set real Supabase project values in both files. In `apps/api/.env`, set `WEB_ORIGIN=http://localhost:5173`. The frontend needs the same Supabase project URL and publishable/anon key.
4. Run in separate terminals:
   ```bash
   pnpm dev:api
   pnpm dev
   ```
5. API health: `http://localhost:4000/api/v1/health`. OpenAPI docs: `http://localhost:4000/api/v1/docs`.

## Demo previews

The login page includes synthetic role previews for Principal, Administrator, Coordinator, HOD, Faculty, Staff and a pending account. They only switch the local UI into sample-data mode; they do **not** create a Supabase session, grant API access, or authenticate as a real employee. Previews are enabled automatically in development and disabled by default in production; set `VITE_ENABLE_DEMO_ACCOUNTS=true` only when intentionally exposing sample-data previews on a production deployment. Never add real credentials to the demo list.

## Database

The SQL migrations in `supabase/migrations` define the schema, role helpers, workflow functions, auth bootstrap, RLS and academic workspace tables. Use a dedicated non-production Supabase project for development and validate migrations before applying them to the college's production database.

```bash
supabase start
supabase db reset
supabase db push
```

Never edit an already-applied migration; add a new migration instead.

## Deployment

### Frontend (Vercel)

`vercel.json` configures a static Vite deployment. Configure these build environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
- `VITE_API_BASE_URL` — deployed NestJS API origin, e.g. `https://your-api-host.example`
- Optional: `VITE_ENABLE_DEMO_ACCOUNTS=true` only if you intentionally want production sample previews; unset/false keeps them hidden.

### API (Render)

`render.yaml` describes the NestJS service. Supply these private environment variables in Render:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `WEB_ORIGIN` — exact deployed Vercel origin, with no path. Multiple comma-separated origins are supported.
- Optional `SUPABASE_SERVICE_ROLE_KEY` — required only if staff invitations should send Supabase Auth invite emails. Keep it server-side, never in frontend/Vercel `VITE_*` variables.

The API must use the same Supabase project as the frontend. Keep service-role keys, database passwords and other secrets out of Git and out of `VITE_*` variables.

## Production checklist

- Confirm the Supabase project and migrate its schema in a staging environment.
- Test every role with real staff accounts and prove cross-department/cross-institution access is denied.
- Add missing feature APIs and replace UI-only actions with persisted workflows.
- Add audit-log verification, storage policies, email delivery, backups/restore tests, monitoring and incident response.
- Run automated API, RLS, accessibility, mobile and end-to-end tests.
- Configure a real domain, SMTP, environment secrets and recovery procedures.
- Have the college approve data ownership, retention, support, security and handover terms.

The previous Next.js application remains in the repository as migration/reference code. The active Vercel configuration targets the Vite frontend.
