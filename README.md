# Astra+ Campus

Workflow-first college management system built around the real hierarchy of a college:
Principal → Coordinators → HODs → Faculty. Next.js 16 (App Router) + Supabase (Postgres, Auth, RLS).

The product spec is in `docs/ASTRA_PLUS_CAMPUS_SPEC.docx`.

## What's in the box

| Area | Status |
| --- | --- |
| Auth (email + password, email confirmation, admin approval of new members) | done |
| Departments, people & role management | done |
| Requests / approvals (sequential approval chain, notifications, audit trail) | done |
| Circulars with acknowledgements | done |
| Timetable (room and cohort clash prevention in the database) | done |
| Syllabus progress | done |
| Document register (metadata only, no file storage yet) | done |
| Attendance, examination modules | workflow category only, no dedicated screens yet |

## Local development

Requirements: Node 20.9+, pnpm 12, Docker (for the local Supabase stack), Supabase CLI.

```bash
pnpm install
supabase start            # starts Postgres/Auth/Studio and applies supabase/migrations
cp .env.example .env.local   # fill in the URL and publishable key printed by `supabase start`
pnpm dev
```

Local confirmation emails land in Inbucket at http://localhost:54324.

Useful commands: `pnpm typecheck`, `pnpm build`, `supabase db reset` (rebuild the DB from migrations),
`supabase migration new <name>` (add a migration).

## Production setup

1. **Create a Supabase project**, then link and push the schema:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
2. **Auth settings** (Dashboard → Authentication):
   - Providers → Email: enable, keep *Confirm email* ON (the first-user bootstrap only runs after confirmation).
   - URL Configuration: Site URL = your app origin; add `<origin>/auth/callback` to Redirect URLs.
   - Password policy: minimum 8 characters (the UI enforces 8; raise it here if you want stricter rules).
   - Configure a real SMTP provider. The built-in mailer is rate-limited and meant for testing.
3. **Environment variables** (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. No service-role key is used or needed.
4. **Deploy** to Vercel (zero config) or build the Docker image:
   ```bash
   docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
     --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
     --build-arg NEXT_PUBLIC_SITE_URL=https://campus.example.edu \
     -t astra-campus .
   docker run -p 3000:3000 astra-campus
   ```
   Health check: `GET /api/health`.
5. **Bootstrap**: the first person to sign up *and confirm their email* creates the institution and becomes
   its principal. Do this yourself immediately after the first deploy. Everyone after that joins as `pending`
   and appears on the People page for an administrator to activate and assign a role.

## How access works

- Roles: `principal`, `administrator`, `coordinator`, `hod`, `faculty`, `staff`. A role may be campus-wide
  (no department) or scoped to a department.
- Every table has row level security. The browser only gets the columns/operations granted in
  `supabase/migrations/*_rls_and_grants.sql`. Workflow, role, audit and notification writes happen only
  through `SECURITY DEFINER` functions (`submit_workflow`, `decide_workflow`, `manage_member`).
- Approval routing (`submit_workflow`): department head first, then principal (or an administrator).
  Routine work (task, leave, syllabus, timetable, attendance) stops at the department head when one exists.
  The principal's own requests are auto-approved. Only people who manage others can pick explicit approvers.
- Only the principal can create or change administrators; the principal's own access can't be changed in-app.
- `audit_logs` is append-only, enforced by a trigger.

## Migrations

| File | Purpose |
| --- | --- |
| `…01_core_schema.sql` | tables, constraints, indexes, timetable clash constraints |
| `…02_security_helpers.sql` | role helpers, audit + notification plumbing, circular publish triggers |
| `…03_workflow_functions.sql` | `submit_workflow`, `decide_workflow`, `manage_member` |
| `…04_auth_bootstrap.sql` | profile creation on email confirmation, first-user bootstrap |
| `…05_rls_and_grants.sql` | RLS policies and explicit grants |

Never edit an applied migration; add a new one.

## Known limitations

- A request that an approver *returns* ends in status `returned`; there is no resubmit screen yet.
- Documents are metadata only. File upload (Supabase Storage) is not implemented.
- The CSP allows inline scripts (`'unsafe-inline'`), which Next.js needs unless every page is nonce-rendered.
- Single institution per deployment (the schema carries `institution_id` everywhere to make multi-tenancy
  possible later, but the bootstrap logic assumes one).
