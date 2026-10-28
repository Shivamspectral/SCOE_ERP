# ERP modules and acceptance criteria

## Staff roles
Principal; vice-principal; ERP administrator; coordinator; HOD; faculty; non-teaching staff; optional explicitly scoped auditor. No student or parent accounts/routes.

## Delivery phases
### Foundation
Identity and membership; role/department scope; academic year/terms; departments/programs/sections/subjects; staff directory; settings; audit trail; notification inbox; import dry-run; health checks.

### Academic operations
Teaching assignments; timetable and conflict detection; rooms/labs; academic calendar; syllabus planning and coverage; class/session setup.

### Attendance
Class sessions and assigned rosters; configurable present/absent/late statuses; bulk marking; save/submit; correction request and approval; audit history; scoped summaries.

### Examinations
Assessments/components and weights; marks entry; draft/submitted/returned/approved/published states; moderation; change history; locking and exports. Publication must be explicit and permission checked.

### Requests and administration
Configurable request types, approver chains, delegation, notes, attachments, return/resubmit, cancellation, SLA timestamps, notification and audit history.

### Communications and staff services
Circular draft/review/publish; acknowledgement roster; private document storage/versioning; leave and duty requests according to approved policy; assets and maintenance.

### Reporting
Role-scoped dashboards and filtered CSV/XLSX/PDF exports. Scheduled reports only after durable job delivery is configured.

## Acceptance criteria for every workflow
1. Data is restricted to the user's institution and assigned scope.
2. Invalid state transitions are rejected by the API.
3. Important mutations create an audit event, preferably in the same transaction.
4. Retries do not duplicate writes.
5. Lists support pagination, stable sorting and filters.
6. Errors are actionable without leaking internals.
7. Loading, empty, error, success and permission-denied states exist.
8. Tests cover both allowed and denied paths.

## Import safety
Dry-run preview, row-level validation, duplicate detection, downloadable error report and authorized sign-off. Never import raw passwords. Prefer stable institutional identifiers over email as permanent IDs. Log actor/time/job without dumping sensitive row data.

## Full product scope

See [`MASTER_ERP_MODULE_ROADMAP.md`](./MASTER_ERP_MODULE_ROADMAP.md) for the full 57-area staff-only college ERP inventory, implementation phases, production acceptance gate and decisions required before sensitive modules go live. This catalogue is a target roadmap, not a claim that all modules are already implemented.
