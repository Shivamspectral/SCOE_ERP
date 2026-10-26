# Principal dashboard update

- Dashboard reorganized around principal-level KPIs, academic monitoring, approvals, institutional alerts and executive navigation.
- Removed seeded sample departments, students, attendance, marks, workflows, notices, documents and audit events. Demo login identities remain available for UI walkthroughs.
- Added empty integration landing pages for Students, Admissions, Fees & Finance, Placements, and Facilities & Assets. They show no fabricated data and are ready for table/RLS integration.
- When both Supabase credentials are configured, the app uses Supabase by default. When neither credential is configured, it automatically falls back to demo mode so the prototype can run before Supabase is connected. Set `NEXT_PUBLIC_DEMO_MODE=true` to force demo mode even when credentials are present.
- Removed `supabase/migrations/` SQL files as requested. Existing project schema must be applied/managed separately when you connect your Supabase project.

Demo login password: `Demo@1234`
- `principal@astra.demo`
- `admin@astra.demo`
- `coordinator@astra.demo`
- `hod.cse@astra.demo`
- `faculty@astra.demo`
- `staff@astra.demo`
- `pending@astra.demo`

For live Supabase mode, configure `.env.local` from `.env.example`, then connect your existing tables and RLS policies. The new module page table names are `admission_applications`, `fee_payments`, `placement_records`, and `maintenance_requests`; adjust names to your eventual schema if needed.
