# Astra+ Campus API

NestJS API scaffold with global DTO validation, Helmet, CORS allow-list, rate limiting, environment validation, token verification guard, and health/readiness endpoints.

Readiness intentionally reports the database as not configured until the existing Supabase schema and connection strategy have been audited. The auth guard establishes identity only; domain roles and department scope still require trusted DB-backed authorization.
