# Integration notes

- Demo accounts remain available for UI walkthroughs, but the in-memory demo store no longer seeds departments, student rosters, attendance, marks, workflows, notices, documents or audit events.
- Attendance and faculty/HOD workspaces start empty. Any actions performed in these workspaces are session-only until their create/update/review actions are connected to Supabase.
- The dashboard uses existing institutional tables where available and labels missing integrations rather than inventing totals.
- New principal module pages currently expect these future table names: `admission_applications`, `fee_payments`, `placement_records`, and `maintenance_requests`. Rename the page configuration when your final schema is ready.
- Supabase migration SQL files were removed from this package as requested. Apply/manage your schema separately in your Supabase project.
- Demo sign-ins require `NEXT_PUBLIC_DEMO_MODE=true`; live Supabase mode requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
