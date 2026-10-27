# Rebuild runbook

## Apps
- Existing Next.js app remains at repository root for rollback while the Vite/NestJS replacement is built under apps/.
- New frontend: apps/web (React + Vite, Orbita Max source and styling).
- New API: apps/api (NestJS REST API, prefix /api/v1).
- Existing Supabase migrations remain the source of truth for database structure and RLS.

## Local demo preview
1. Open a terminal in apps/web.
2. Run pnpm install, then pnpm dev.
3. Open the Vite URL shown in the terminal.
4. Choose one of the demo accounts on the login screen. Shared demo password: Demo@1234.
5. Demo buttons exist only in Vite development mode. They switch the UI role and load illustrative local data; they do not create an authenticated server session or access live college data.

The existing Next.js demo login endpoint is separately restricted to explicit demo mode or deployments without Supabase configured. Do not enable demo mode against production institutional data.

## API local setup
1. In apps/api, copy .env.example to .env.
2. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and WEB_ORIGIN=http://localhost:5173.
3. Run pnpm install and pnpm dev.
4. Liveness: GET /api/v1/health. Readiness currently reports database integration as not configured until the live connection is verified.
5. OpenAPI docs: /api/v1/docs.

## Implemented API surface (initial vertical slices)
- GET /api/v1/auth/me — authenticated identity, profile and persisted role assignments.
- GET /api/v1/departments — RLS-scoped departments.
- GET /api/v1/users and GET/PATCH/DELETE /api/v1/users/:id — staff directory, role/status updates through manage_member RPC, and suspension.
- GET/POST /api/v1/workflows and POST /api/v1/workflows/:id/decision — workflow queue and database approval RPCs.
- GET/PATCH /api/v1/notifications — caller-scoped inbox and read markers.
- GET/POST /api/v1/circulars and POST /api/v1/circulars/:id/publish — circular drafts and publication.
- GET/POST /api/v1/attendance/sessions and POST /api/v1/attendance/sessions/:id/records — scoped session and validated bulk attendance records.

All data endpoints require a Supabase bearer token and forward it to PostgREST so database RLS is enforced. The API has not yet been verified against the live institutional project; use an isolated Supabase project and test accounts first.

## Deployment
Do not switch Vercel production root to apps/web or point the API at production until CI passes, API/auth/data integration tests pass, the current schema and RLS have been tested with each staff role, and a rollback plan is approved. The new apps are intentionally independent of the existing root package/lockfile until deployment migration is planned.
