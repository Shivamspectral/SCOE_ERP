-- Circulation rows are immutable except for staff notes and a one-way return transition.
create or replace function app_private.library_loan_guard()
returns trigger language plpgsql security definer set search_path = ''
as $
declare
  v_book public.library_books%rowtype;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'issued' or new.returned_at is not null or new.returned_by is not null then
      raise exception 'New library loans must start in issued state' using errcode = '23514';
    end if;
    if new.due_at <= new.issued_at then
      raise exception 'Due date must be after issue date' using errcode = '23514';
    end if;
    if not exists (select 1 from public.academic_students s where s.id = new.student_id and s.institution_id = new.institution_id and s.status = 'active') then
      raise exception 'Student record is not active in this institution' using errcode = '23514';
    end if;
    if not exists (select 1 from public.library_books b where b.id = new.book_id and b.institution_id = new.institution_id and b.status = 'active') then
      raise exception 'Book is not active in this institution' using errcode = '23514';
    end if;
    select * into v_book from public.library_books where id = new.book_id and institution_id = new.institution_id for update;
    if not found or v_book.available_copies < 1 then
      raise exception 'No copies are currently available' using errcode = '23514';
    end if;
    update public.library_books set available_copies = available_copies - 1, updated_at = now()
    where id = new.book_id and institution_id = new.institution_id;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.institution_id is distinct from old.institution_id
    or new.book_id is distinct from old.book_id
    or new.student_id is distinct from old.student_id
    or new.issued_by is distinct from old.issued_by
    or new.issued_at is distinct from old.issued_at
    or new.due_at is distinct from old.due_at then
    raise exception 'Issued loan identity and dates cannot be edited' using errcode = '23514';
  end if;

  if old.status = 'issued' and new.status = 'returned' then
    update public.library_books set available_copies = least(total_copies, available_copies + 1), updated_at = now()
    where id = old.book_id and institution_id = old.institution_id;
    new.returned_at := coalesce(new.returned_at, now());
    new.returned_by := coalesce(new.returned_by, auth.uid());
  elsif new.status is distinct from old.status
    or new.returned_at is distinct from old.returned_at
    or new.returned_by is distinct from old.returned_by then
    raise exception 'Only issued loans may transition to returned' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
