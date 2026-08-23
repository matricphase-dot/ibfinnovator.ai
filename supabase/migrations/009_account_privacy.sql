-- GDPR / India DPDP account deletion function
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path=public,auth as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 delete from auth.users where id=uid;
end;$$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
