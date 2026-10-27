# Data model plan — pending schema audit

This is a domain inventory, not an applied schema. Inspect all existing migrations, triggers, grants, security-definer functions, RLS policies and live table structure before changing the database.

## Core domains
Institution; academic year/term; department/program/cohort/section; room/lab; subject; auth identity mapping; staff profile; designation; membership/role grant; invitation; teaching assignment; timetable slot; class session; attendance record/correction request; assessment/component; marks sheet/entry; moderation decision/publication; workflow type/instance/step/approver/delegation; circular/acknowledgement; notification/delivery attempt; document/version/private object key/access event; leave policy/balance/request; duty/task; asset/maintenance request; audit event; import job; report/export job; system setting.

## Invariants to enforce
- Institution-owned rows have institution foreign keys.
- Department/class/subject scope uses foreign keys, not free-text names.
- Attendance is unique per session and roster member.
- Marks are unique per assessment component and cannot publish while invalid/incomplete.
- Timetable checks prevent room/cohort/assigned-staff clashes.
- Workflow decisions require the current assigned approver and valid state.
- Audit entries identify actor, action, target, timestamp and request ID, with sensitive fields redacted.
- Use archival states where history matters; avoid indiscriminate soft deletion.
- Store UTC instants and the institution's explicit timezone for scheduled events.

## Schema workflow
1. Inspect and map existing Supabase schema and RLS.
2. Introspect a non-production database.
3. Document compatibility, gaps and migration dependencies.
4. Define Prisma models/migrations only after mapping the existing schema.
5. Test constraints and tenant/department isolation.
6. Review backup and rollback plan before production migrations.
