create or replace function app_private.library_touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
drop trigger if exists library_books_touch_updated_at on public.library_books;
create trigger library_books_touch_updated_at before update on public.library_books
for each row execute function app_private.library_touch_updated_at();
