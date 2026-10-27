# Astra+ Campus ERP — Target Architecture

## Product boundary
Internal college operations ERP for principal/vice-principal, administrators, coordinators, HODs, faculty, and non-teaching staff. Student and parent portals are out of scope.

## Architecture
- Frontend: React + Vite + TypeScript, React Router, TanStack Query, Lucide, accessible design system. Orbita Max is the visual reference; preserve its typography, spacing, navigation patterns, cards, and page identity while replacing fake data with API-backed workflows.
- Backend: NestJS modular monolith, TypeScript, REST under `/api/v1`, OpenAPI, DTO validation, authorization guards/policies, structured logs, health/readiness checks, rate limiting.
- Identity: existing Supabase Auth where appropriate. API verifies bearer tokens and resolves app membership/role/scope from trusted persisted records. A frontend role picker is never authorization.
- Data: existing Supabase PostgreSQL is the preferred starting point after schema/RLS/migration audit. Introspect before adding Prisma models or migrations; do not create competing or destructive schemas.
- Files: private object storage, signed URLs, file type/size checks, and DB metadata.
- Jobs: durable queue only for retryable exports, scheduled notifications, and report generation when required.
- Deployment: static Vite frontend + separately hosted NestJS API + managed PostgreSQL/Auth. Staging first; retain rollback path for production.

## Modules
1. Identity, staff memberships, invitations, roles and scoped permissions.
2. Institution settings, academic years/terms, departments, programs, cohorts, sections, rooms and subjects.
3. Staff directory, designations and department membership.
4. Academic calendar, timetable, room booking, teaching assignments and syllabus coverage.
5. Attendance sessions, class rosters, attendance records, correction requests and approvals.
6. Exams, assessment components, marks entry, moderation, publication approval and result snapshots.
7. Configurable workflows, approval chains, delegation, comments, attachments and SLA timestamps.
8. Staff leave, availability and duty requests (policies confirmed by college).
9. Circulars, internal announcements and acknowledgements.
10. Documents with private storage, versions, retention and access history.
11. Facilities, inventory, labs, maintenance and resource booking.
12. Procurement/budget requests if required; don't imply full accounting or payment processing until scoped.
13. Role-scoped reports, exports and operational dashboards.
14. In-app notifications and email provider adapter with delivery tracking.
15. Append-only audit trail and security events.
16. System administration, imports, settings and operational health.

## Authorization rules
- RBAC plus institution, department, assignment, resource ownership and workflow-state policies.
- Deny by default. Every protected endpoint declares and tests its permission requirements.
- Enforce policies in the API/service layer and database constraints; hide/disable UI actions only as a usability layer.
- Never trust browser-supplied role, department, approver, institution ID or status.
- RLS is defense in depth where supported by the connection model. If a privileged DB role bypasses RLS, equivalent API policies are mandatory and documented.
- Sensitive mutations and their audit events should be transactional.

## Quality gates
- Unit tests for domain rules and authorization; API integration tests against isolated DB; E2E tests for login, department isolation, approvals, attendance corrections and marks publication.
- Versioned, reviewed migrations with backup/rollback plans.
- No fake people, demo credentials or sample records in production.
- Redact credentials, tokens, marks and personal data from logs.
- Pagination, stable filtering, validated inputs, consistent error codes, accessible keyboard behavior, and designed loading/empty/error/denied states.
- CI: lint, typecheck, tests and build before release.

## Migration plan
1. Preserve current app and demo sign-ins while auditing all current routes, Supabase migrations, tables, triggers, functions, RLS policies, environment variables, and Orbita Max UI.
2. Map existing data contracts and roles before changing persistence.
3. Implement one vertical slice at a time with tests and real DB persistence.
4. Use synthetic data only in isolated demo/test environments.
5. Stage with role-specific test accounts; validate backup, recovery, imports and permissions.
6. Cut over only after acceptance testing and rollback instructions are ready.

## Commercial handover
A reliable deployment also needs college-approved policies, roster/department sign-off, email/domain setup, data migration approval, backups, operational ownership, hosting costs, and an agreed support/SLA plan. Do not claim certifications or production readiness before review and tests.
