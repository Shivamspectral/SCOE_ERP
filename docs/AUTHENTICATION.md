# Authentication and authorization

This document describes the current authentication boundary in the repository. It is not a claim that every route or browser screen has passed end-to-end security testing.

## Components

- **Supabase Auth** owns sign-in and issues access tokens.
- **React/Vite frontend** signs in through the Supabase client. Demo previews are local sample-data mode only; they are not credentials and must never be sent to protected APIs as an authenticated user.
- **NestJS `SupabaseAuthGuard`** in `apps/api/src/auth/supabase-auth.guard.ts` reads the `Authorization: Bearer <token>` header and validates the token with `supabase.auth.getUser(token)`. Missing, invalid, or expired tokens produce HTTP 401.
- **`AuthController.getMe()`** in `apps/api/src/auth/auth.controller.ts` loads the caller's profile and active role assignments using the request-scoped Supabase client.
- **`SupabaseRequestClient`** in `apps/api/src/database/supabase-request-client.service.ts` forwards the verified caller's JWT as the database Authorization header. This is important: ordinary data queries should continue to be constrained by PostgreSQL RLS and `auth.uid()`.
- **PostgreSQL RLS and database functions** enforce data scope and domain transitions. A valid token proves identity; it does not by itself prove that the user is an active staff member or is allowed to perform a particular action.
- **Optional service-role key** is configured only on the API server for the staff-invitation email flow. Never expose it through a `VITE_*` variable or use it for ordinary caller-scoped queries.

## Request flow

1. A staff member signs in with Supabase Auth in the frontend.
2. The frontend receives a Supabase session and access token.
3. A protected API request sends `Authorization: Bearer <access_token>`.
4. `SupabaseAuthGuard` validates the token with Supabase and attaches the verified user ID, email, and token to the request.
5. The route uses `SupabaseRequestClient.forRequest(request)` to make caller-scoped database queries. The caller's JWT is forwarded, so RLS policies can evaluate the authenticated user.
6. `GET /api/v1/auth/me` returns the identity, profile, active role assignments, primary role, and profile access status. The profile/role rows are read from the database rather than trusted from browser-supplied role values.
7. The endpoint's route guards, database function checks, and RLS policies must separately enforce the specific staff role, institution, department, and record permissions for each operation.

## Credentials, sessions, and tokens

- Passwords should be submitted only to Supabase Auth over HTTPS; the ERP should not store plaintext passwords in application tables or logs.
- Access tokens are bearer credentials. Do not log them, put them in URLs, or commit them to source control.
- The API validates the presented access token on protected requests; expired tokens should fail with 401 and the frontend should restore/refresh its Supabase session according to the Supabase client session lifecycle before retrying a request.
- The API's request-scoped Supabase clients disable their own persisted session and token refresh. They use the request token only; they do not create an independent logged-in API session.
- A successful `/auth/me` response is not a substitute for checking the profile's active status and role permissions before granting access to staff-only screens and endpoints.

## Demo mode and institutional data

Demo role previews are synthetic frontend state for presentation/testing. They must not create Supabase sessions, call protected endpoints as a fake staff member, or read/write institutional records. Keep demo data visibly labelled and isolated from real institution data. Disable previews in a real deployment with `VITE_ENABLE_DEMO_ACCOUNTS=false`.

## Current verification boundary

The code paths above were inspected in `main`. This document does not assert that session restoration, every route's guard coverage, every RLS policy, or a live Supabase login has been exercised end-to-end. Before production use, add/execute tests for:

- missing, malformed, expired, and valid bearer tokens;
- inactive or missing staff profiles and users with no active role assignment;
- each role's allowed and denied API operations;
- cross-institution and cross-department access;
- demo mode never reaching protected API routes;
- browser reload/session restoration and sign-out;
- RLS policies and security-definer function authorization against a disposable Supabase project.
