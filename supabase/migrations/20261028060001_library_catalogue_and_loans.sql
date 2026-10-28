-- Staff-operated library catalogue and circulation. No student/parent login is introduced.
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  isbn text,
  title text not null check (length(trim(title)) between 1 and 240),
  author text not null check (length(trim(author)) between 1 and 180),
  category text not null default 'General' check (length(trim(category)) between 1 and 80),
  publisher text,
  publication_year integer check (publication_year is null or publication_year between 1400 and 2200),
  total_copies integer not null default 1 check (total_copies >= 0),
  available_copies integer not null default 1 check (available_copies >= 0 and available_copies <= total_copies),
  shelf_location text,
  status text not null default 'active' check (status in ('active','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, isbn)
);
create index if not exists library_books_search_idx on public.library_books(institution_id, status, title);
create table if not exists public.library_loans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  book_id uuid not null references public.library_books(id),
  student_id uuid not null references public.academic_students(id),
  issued_by uuid not null default auth.uid(),
  returned_by uuid,
  issued_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  status text not null default 'issued' check (status in ('issued','returned','lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_at > issued_at),
  check ((status = 'returned') = (returned_at is not null))
);
create index if not exists library_loans_student_idx on public.library_loans(institution_id, student_id, status);
create index if not exists library_loans_due_idx on public.library_loans(institution_id, due_at) where status = 'issued';

alter table public.library_books enable row level security;
alter table public.library_loans enable row level security;
create policy library_books_read on public.library_books for select to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff'])));
create policy library_books_write on public.library_books for all to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])));
create policy library_loans_read on public.library_loans for select to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator','hod','faculty','staff'])));
create policy library_loans_write on public.library_loans for all to authenticated
using (institution_id = (select app_private.current_institution()) and (select app_private.has_role(array['principal','administrator','coordinator'])))
with check (
  institution_id = (select app_private.current_institution())
  and issued_by = (select auth.uid())
  and (select app_private.has_role(array['principal','administrator','coordinator']))
  and exists (select 1 from public.library_books b where b.id = book_id and b.institution_id = library_loans.institution_id and b.status = 'active')
  and exists (select 1 from public.academic_students s where s.id = student_id and s.institution_id = library_loans.institution_id and s.status = 'active')
);
grant select, insert, update, delete on public.library_books, public.library_loans to authenticated;
revoke all on public.library_books, public.library_loans from anon;

create or replace function app_private.library_loan_guard()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_book public.library_books%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_book from public.library_books where id = new.book_id and institution_id = new.institution_id for update;
    if not found or v_book.status <> 'active' then
      raise exception 'Book is not available in this institution' using errcode = '23514';
    end if;
    if v_book.available_copies < 1 then
      raise exception 'No copies are currently available' using errcode = '23514';
    end if;
    update public.library_books set available_copies = available_copies - 1, updated_at = now() where id = new.book_id;
    return new;
  end if;
  if old.status = 'issued' and new.status = 'returned' then
    update public.library_books set available_copies = least(total_copies, available_copies + 1), updated_at = now()
    where id = old.book_id and institution_id = old.institution_id;
    new.returned_at := coalesce(new.returned_at, now());
    new.returned_by := coalesce(new.returned_by, auth.uid());
  elsif old.status <> new.status then
    raise exception 'Only issued loans can be marked returned' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists library_loan_guard_trigger on public.library_loans;
create trigger library_loan_guard_trigger before insert or update on public.library_loans
for each row execute function app_private.library_loan_guard();

drop trigger if exists audit_library_books on public.library_books;
create trigger audit_library_books after insert or update on public.library_books
for each row execute function app_private.audit_row_change('library_book');
drop trigger if exists audit_library_loans on public.library_loans;
create trigger audit_library_loans after insert or update on public.library_loans
for each row execute function app_private.audit_row_change('library_loan');
