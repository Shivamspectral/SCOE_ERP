Astra+ Campus ERP — Principal dashboard update

The ZIP contents belong directly in the project root; there is no extra wrapper folder.

Demo mode (UI walkthrough only):
- Set NEXT_PUBLIC_DEMO_MODE=true in .env.local.
- Password for the listed demo accounts: Demo@1234
- principal@astra.demo / admin@astra.demo / coordinator@astra.demo / hod.cse@astra.demo / faculty@astra.demo / staff@astra.demo / pending@astra.demo
- Demo login identities remain, but institutional sample records have been removed. Attendance and Faculty/HOD actions are session-only until connected to Supabase.

Live Supabase mode:
- Set NEXT_PUBLIC_DEMO_MODE=false.
- Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
- Connect tables and RLS policies for the existing academic/workflow modules.
- The new module pages anticipate admission_applications, fee_payments, placement_records and maintenance_requests; change those names if your schema differs.

The supabase/migrations folder has been removed as requested. Schema creation and migrations should be managed separately.
