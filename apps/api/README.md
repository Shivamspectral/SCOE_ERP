# Astra+ Campus API

NestJS REST API with global request validation, Helmet, a CORS allow-list, rate limiting, environment validation, Supabase bearer-token verification, OpenAPI docs, and modular staff/academic operations endpoints.

## Local run
```sh
cd apps/api
cp .env.example .env
pnpm install
pnpm dev
```

Required environment: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, WEB_ORIGIN, PORT. Never commit private keys or database passwords.

## Data security
Every business request verifies the caller's Supabase token and forwards that same JWT to Supabase PostgREST. Existing PostgreSQL RLS and security-definer workflow functions remain authoritative for record scope and transitions. Ordinary requests must not use a service-role client.

## Current API
- GET /api/v1/health and /api/v1/health/ready
- GET /api/v1/auth/me
- GET /api/v1/dashboard/summary
- GET /api/v1/departments
- GET /api/v1/users, GET/PATCH/DELETE /api/v1/users/:id
- GET/POST /api/v1/workflows, POST /api/v1/workflows/:id/decision
- GET/PATCH /api/v1/notifications
- GET/POST /api/v1/circulars, POST /api/v1/circulars/:id/publish
- GET/POST /api/v1/attendance/sessions, POST /api/v1/attendance/sessions/:id/records
- OpenAPI UI at /api/v1/docs

The API build is verified by GitHub Actions. Database integration and role-by-role authorization still need to be tested against an isolated Supabase project before any production cutover.
