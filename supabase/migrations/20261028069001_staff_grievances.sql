-- Confidential staff grievance and workplace concern management.
create table if not exists public.staff_grievances (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  case_number text not null,
  category text not null check (category in ('workplace','workload','payroll','facilities','conduct','harassment','safety','other')),
  subject text not null,
  description text not null,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  is_anonymous boolean not null default false,
  status text not null default 'submitted' check (status in ('submitted','assigned','investigating','resolved','closed','reopened','withdrawn')),
  assigned_to uuid,
  resolution_note text,
  resolved_at timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, case_number)
);
create index if not exists staff_grievances_queue_idx on public.staff_grievances(institution_id, status, priority, created_at desc);

create trigger staff_grievances_touch_updated_at before update on public.staff_grievances
for each row execute function app_private.touch_updated_at();
create trigger staff_grievances_audit after insert or update or delete on public.staff_grievances
for each row execute function app_private.audit_row_change('staff_grievances');

alter table public.staff_grievances enable row level security;
grant select, insert, update, delete on public.staff_grievances to authenticated;
create policy staff_grievances_select on public.staff_grievances for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (created_by = (select auth.uid()) or (select app_private.has_role(array['principal','administrator','coordinator','hr']))));
create policy staff_grievances_insert on public.staff_grievances for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and created_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff','hr'])));
create policy staff_grievances_update on public.staff_grievances for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hr'])))
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hr'])));
create policy staff_grievances_delete on public.staff_grievances for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));
