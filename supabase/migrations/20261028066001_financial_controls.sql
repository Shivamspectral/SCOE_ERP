-- Budget controls, vendor master and employee expense claims.
create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  fiscal_year text not null,
  budget_code text not null,
  title text not null,
  department_id uuid references public.departments(id) on delete set null,
  allocated_amount numeric(14,2) not null check (allocated_amount >= 0),
  currency char(3) not null default 'INR',
  status text not null default 'draft' check (status in ('draft','submitted','approved','locked','closed')),
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, fiscal_year, budget_code)
);

create table if not exists public.vendor_registry (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  vendor_code text not null,
  legal_name text not null,
  gstin text,
  vendor_type text not null default 'goods' check (vendor_type in ('goods','services','works','consultancy','other')),
  contact_name text,
  contact_email text,
  contact_phone text,
  address jsonb not null default '{}'::jsonb,
  payment_terms text,
  status text not null default 'pending_review' check (status in ('pending_review','approved','suspended','blacklisted')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, vendor_code),
  unique (institution_id, legal_name)
);

create table if not exists public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  claim_number text not null,
  employee_id uuid not null references public.hr_employees(id) on delete restrict,
  expense_category text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'INR',
  incurred_on date not null,
  description text not null,
  receipt_document_id uuid references public.documents(id) on delete set null,
  status text not null default 'submitted' check (status in ('draft','submitted','approved','rejected','paid','cancelled')),
  submitted_by uuid not null default auth.uid(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  paid_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, claim_number)
);

create index if not exists finance_budgets_year_idx on public.finance_budgets(institution_id, fiscal_year, status);
create index if not exists vendor_registry_status_idx on public.vendor_registry(institution_id, status, legal_name);
create index if not exists expense_claims_employee_status_idx on public.expense_claims(institution_id, employee_id, status, incurred_on desc);

do $$
declare t text;
begin
  foreach t in array array['finance_budgets','vendor_registry','expense_claims'] loop
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function app_private.audit_row_change(%L)', t, t, t);
  end loop;
end $$;

create policy finance_budgets_select on public.finance_budgets for select to authenticated
using (institution_id = (select app_private.current_institution()));
create policy finance_budgets_insert on public.finance_budgets for insert to authenticated
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','finance'])));
create policy finance_budgets_update on public.finance_budgets for update to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','finance'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','finance'])));
create policy finance_budgets_delete on public.finance_budgets for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create policy vendor_registry_select on public.vendor_registry for select to authenticated
using (institution_id = (select app_private.current_institution()));
create policy vendor_registry_insert on public.vendor_registry for insert to authenticated
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','staff','finance'])));
create policy vendor_registry_update on public.vendor_registry for update to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','finance'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','finance'])));
create policy vendor_registry_delete on public.vendor_registry for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create policy expense_claims_select on public.expense_claims for select to authenticated
using (institution_id = (select app_private.current_institution())
  and (submitted_by = (select auth.uid()) or (select app_private.has_role(array['principal','administrator','coordinator','hr','finance']))));
create policy expense_claims_insert on public.expense_claims for insert to authenticated
with check (institution_id = (select app_private.current_institution())
  and submitted_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff','hr','finance'])));
create policy expense_claims_update on public.expense_claims for update to authenticated
using (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hr','finance'])))
with check (institution_id = (select app_private.current_institution())
  and (select app_private.has_role(array['principal','administrator','coordinator','hr','finance'])));
create policy expense_claims_delete on public.expense_claims for delete to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.is_admin()));

create or replace function app_private.guard_expense_claim_institution()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare employee_institution uuid;
begin
  select institution_id into employee_institution from public.hr_employees where id = new.employee_id;
  if employee_institution is null or employee_institution <> new.institution_id then
    raise exception 'Expense employee must belong to the same institution' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger expense_claim_institution_guard before insert or update on public.expense_claims
for each row execute function app_private.guard_expense_claim_institution();
revoke all on function app_private.guard_expense_claim_institution() from public, anon, authenticated;
