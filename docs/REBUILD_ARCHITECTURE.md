# Astra+ Campus ERP — Rebuild Architecture

## Product boundary
Astra+ is an internal college operations ERP for institutional leadership, academic coordinators, department heads, faculty, administrative staff, and approved system operators. Students and parents are explicitly out of scope for this portal.

## Architecture decisions
- Web: React, Vite, TypeScript, React Router, TanStack Query, Lucide, and an accessible component/design system.
- API: NestJS modular monolith, TypeScript, REST under `/api/v1`, OpenAPI documentation, DTO validation, structured logs, health/readiness endpoints.
- Identity: Supabase Auth for identity and password lifecycle. The API verifies the access token and resolves application membership/role from persisted institutional records. Frontend-selected roles are never authoritative.
- Data: PostgreSQL (current Supabase project is the preferred starting point after schema and RLS audit). Migrations are versioned, reviewed, repeatable, and never edit an already-applied migration.
- Data access: use Prisma after introspecting and reconciling the existing schema; don't generate a second competing schema or apply destructive migrations before the existing database is mapped.
- Files: private object storage with short-lived signed URLs, MIME/size validation, and metadata in PostgreSQL.
- Background work: a durable queue only for work that benefits from retries (scheduled notifications, exports, report generation); don't put queue infrastructure in the critical path before needed.
- Deployment: static Vite web app and a separately deployed NestJS API, with managed PostgreSQL/Auth. Configure CORS, health checks, backups, logs, and environment secrets for each environment.

## Backend module boundaries
1. Identity & access: members, invitations, account activation, sessions, role grants, permission policies, department scope.
2. Institution: institution profile, academic years, semesters, departments, programs, cohorts, sections, rooms, subjects.
3. People: employee directory, faculty profiles, staff profiles, employment/designation metadata.
4. Academic operations: teaching assignments, class timetable, room booking, syllabus coverage, academic calendar.
5. Attendance: class sessions, attendance records, correction requests, approval trail, attendance summaries.
6. Examinations: exam schedules, assessment components, marks entry, moderation, publication approvals, result snapshots.
7. Workflows: configurable request types, submission, sequential approvals, return/re-submit, delegation, comments, SLA timestamps.
8. HR & leave: leave balances/policies, requests, attendance/availability where required, approvals.
9. Circulars & communications: drafts, review, publishing, acknowledgement tracking, internal announcements.
10. Documents: metadata, private files, versioning, retention and access logs.
11. Facilities & resources: room/lab inventory, maintenance requests, equipment checkout.
12. Finance/procurement (scope-controlled): budget requests, purchase requisitions, vendor/asset references; no payment gateway or accounting claims until requirements are confirmed.
13. Reports: role-scoped exports, operational dashboards, saved report definitions.
14. Notifications: in-app inbox and email provider adapter, delivery status, retries.
15. Audit & compliance: append-only activity records, security events, export/access logs.
16. System administration: feature flags, settings, import/export jobs, health and operational status.

## Authorization model
- RBAC for baseline actions plus policy checks for resource ownership, institution, department, assigned class/subject, and workflow state.
- Deny by default. Every protected controller route must declare its access policy.
- Check permissions in services as well as route guards for sensitive records and state transitions.
- Never trust role, department, user ID, approval status, or institution ID supplied by the browser.
- Keep high-risk changes auditable and transactional. Enforce unique keys, foreign keys, check constraints, and indexes in PostgreSQL.
- Use Supabase RLS as defense in depth where the runtime database connection model supports it. If a privileged database role bypasses RLS, the API must enforce equivalent policies and that exception must be documented.

## Production quality gates
- Unit tests for permission policies and domain services.
- API integration tests against an isolated test database.
- E2E tests for sign-in, account activation, approval chains, attendance correction, marks publication, and denied cross-department access.
- Migration dry-run/backup plan before applying schema changes.
- No demo credentials, sample people, or seeded fake data in production.
- Structured logs with request IDs; redact tokens, passwords, marks, personal details, and file contents.
- Error responses have stable codes and never leak stack traces or secrets.
- CI checks lint, typecheck, tests, and builds before release.
- Accessibility, responsive behavior, loading/empty/error states, and keyboard navigation are release criteria.

## Migration strategy
1. Keep the current production branch/deployment untouched.
2. Inventory every existing Supabase migration, table, RLS policy, function, trigger, API route, and frontend feature.
3. Compare Orbita Max's screens and workflows with the existing ERP's real data contracts.
4. Implement the new web and API on a separate branch.
5. Baseline/introspect the existing schema before adding Prisma models or new migrations.
6. Migrate one vertical slice at a time; verify real persistence, authorization, audit events, and regression tests.
7. Deploy to staging and test with representative staff accounts and synthetic data.
8. Cut over only with rollback instructions, backups, and verified environment configuration.

## Important commercial boundary
This repository can deliver the software foundation and workflows, but a production deployment still requires college-approved policies, a verified roster/department structure, authorized email/domain setup, data migration sign-off, backups, and an agreed support/hosting plan. Never claim compliance certification or production readiness before the relevant review and tests are completed.
