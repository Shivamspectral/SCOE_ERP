-- Staff-operated fee billing ledger. Payments are internal ledger entries; no payment gateway is implied.
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  academic_year text not null check (length(trim(academic_year)) between 4 and 20),
  name text not null check (length(trim(name)) between 1 and 160),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'INR',
  status text not null default 'active' check (status in ('active','archived')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fee_structures_scope_idx on public.fee_structures(institution_id, academic_year, status);
create table if not exists public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.academic_students(id),
  fee_structure_id uuid references public.fee_structures(id) on delete set null,
  invoice_number text not null,
  description text not null check (length(trim(description)) between 1 and 240),
  amount_due numeric(12,2) not null check (amount_due > 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0 and amount_paid <= amount_due),
  currency char(3) not null default 'INR',
  due_at date not null,
  status text not null default 'unpaid' check (status in ('unpaid','partially_paid','paid','waived','cancelled')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, invoice_number)
);
create index if not exists fee_invoices_student_idx on public.fee_invoices(institution_id, student_id, status);
create index if not exists fee_invoices_due_idx on public.fee_invoices(institution_id, due_at) where status in ('unpaid','partially_paid');
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  invoice_id uuid not null references public.fee_invoices(id),
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'INR',
  method text not null check (method in ('cash','bank_transfer','upi_reference','cheque','other')),
  reference text,
  received_at timestamptz not null default now(),
  received_by uuid not null default auth.uid(),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists fee_payments_invoice_idx on public.fee_payments(institution_id, invoice_id, received_at desc);

alter table public.fee_structures enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.fee_payments enable row level security;
create policy fee_structures_read on public.fee_structures for select to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','staff'])));
create policy fee_structures_write on public.fee_structures for all to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])));
create policy fee_invoices_read on public.fee_invoices for select to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','staff'])));
create policy fee_invoices_write on public.fee_invoices for all to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])));
create policy fee_payments_read on public.fee_payments for select to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','staff'])));
create policy fee_payments_insert on public.fee_payments for insert to authenticated
with check (institution_id = (select app_private.current_institution()) and received_by = (select auth.uid()) and (select app_private.has_role(array['principal','administrator','coordinator'])));
grant select, insert, update, delete on public.fee_structures, public.fee_invoices to authenticated;
grant select, insert on public.fee_payments to authenticated;
revoke all on public.fee_structures, public.fee_invoices, public.fee_payments from anon;

create or replace function app_private.fee_payment_guard()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare
  v_invoice public.fee_invoices%rowtype;
begin
  select * into v_invoice from public.fee_invoices where id = new.invoice_id and institution_id = new.institution_id for update;
  if not found or v_invoice.status in ('waived','cancelled') then
    raise exception 'Invoice is unavailable for payment' using errcode = '23514';
  end if;
  if new.currency <> v_invoice.currency then
    raise exception 'Payment currency must match invoice currency' using errcode = '23514';
  end if;
  if new.amount > (v_invoice.amount_due - v_invoice.amount_paid) then
    raise exception 'Payment exceeds outstanding balance' using errcode = '23514';
  end if;
  update public.fee_invoices
    set amount_paid = amount_paid + new.amount,
        status = case when amount_paid + new.amount >= amount_due then 'paid' else 'partially_paid' end,
        updated_at = now()
    where id = new.invoice_id and institution_id = new.institution_id;
  return new;
end;
$function$;
drop trigger if exists fee_payment_guard_trigger on public.fee_payments;
create trigger fee_payment_guard_trigger before insert on public.fee_payments
for each row execute function app_private.fee_payment_guard();

create or replace function app_private.fee_payment_immutable()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  raise exception 'Fee payment ledger entries are immutable; record an adjustment through an authorized process' using errcode = '42501';
end;
$function$;
drop trigger if exists fee_payment_immutable_trigger on public.fee_payments;
create trigger fee_payment_immutable_trigger before update or delete on public.fee_payments
for each row execute function app_private.fee_payment_immutable();
drop trigger if exists audit_fee_structures on public.fee_structures;
create trigger audit_fee_structures after insert or update on public.fee_structures for each row execute function app_private.audit_row_change('fee_structure');
drop trigger if exists audit_fee_invoices on public.fee_invoices;
create trigger audit_fee_invoices after insert or update on public.fee_invoices for each row execute function app_private.audit_row_change('fee_invoice');
drop trigger if exists audit_fee_payments on public.fee_payments;
create trigger audit_fee_payments after insert on public.fee_payments for each row execute function app_private.audit_row_change('fee_payment');
