-- 010: Switch authentication from Supabase Auth to Clerk.
-- Supabase stays as the DATABASE only; user identity now comes from Clerk
-- (user ids look like `user_2abcDef9…`). All user-id columns become text,
-- the FK to Supabase's auth.users is removed, and profile creation moves
-- from a database trigger into the app (lib/supabase/server.ts).
--
-- Run once in the Supabase SQL Editor after 001–009.
-- Existing Supabase-auth users cannot sign in anymore (their auth lives in
-- Supabase Auth, which is now bypassed); new users sign up through Clerk.

begin;

-- 1) Remove the Supabase trigger that auto-created profiles on signup.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2) Drop every foreign key referencing profiles(id) or auth.users(id),
--    so the column types can be changed.
do $$
declare r record;
begin
  for r in
    select conname, conrelid::regclass as tbl
    from pg_constraint
    where contype = 'f'
      and confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
  loop
    execute format('alter table %s drop constraint if exists %I', r.tbl, r.conname);
  end loop;
end $$;

-- 3) profiles.id becomes the Clerk user id.
alter table public.profiles alter column id type text;

-- 4) Every column that stores a user id becomes text.
alter table public.projects            alter column founder_id type text;
alter table public.applications        alter column student_id type text;
alter table public.connections         alter column requester_id type text;
alter table public.connections         alter column recipient_id type text;
alter table public.messages            alter column sender_id type text;
alter table public.messages            alter column recipient_id type text;
alter table public.milestones          alter column assigned_to type text;
alter table public.bookmarks           alter column user_id type text;
alter table public.bookmarks           alter column profile_id type text;
alter table public.notifications       alter column user_id type text;
alter table public.reviews             alter column reviewer_id type text;
alter table public.reviews             alter column reviewee_id type text;
alter table public.endorsements        alter column giver_id type text;
alter table public.endorsements        alter column receiver_id type text;
alter table public.team_members        alter column user_id type text;
alter table public.meetings            alter column organizer_id type text;
alter table public.meeting_attendees   alter column user_id type text;
alter table public.analytics_events    alter column user_id type text;
alter table public.cofounder_profiles  alter column user_id type text;
alter table public.match_actions       alter column user_id type text;
alter table public.match_actions       alter column target_user_id type text;
alter table public.team_tasks          alter column assignee_id type text;
alter table public.team_tasks          alter column created_by type text;
alter table public.message_reactions   alter column user_id type text;
alter table public.user_badges         alter column receiver_id type text;
alter table public.user_badges         alter column awarded_by type text;
alter table public.certificates        alter column receiver_id type text;
alter table public.certificates        alter column issued_by type text;
alter table public.user_blocks         alter column blocker_id type text;
alter table public.user_blocks         alter column blocked_id type text;
alter table public.reports             alter column reporter_id type text;
alter table public.reports             alter column reported_user_id type text;
alter table public.marketplace_services alter column provider_id type text;
alter table public.community_events    alter column host_id type text;
alter table public.event_attendees     alter column user_id type text;
alter table public.university_members  alter column user_id type text;

-- 5) Re-create the foreign keys so account deletion still cascades
--    (the app's DELETE /api/account relies on profiles → cascade).
alter table public.projects            add constraint projects_founder_fk        foreign key (founder_id)      references public.profiles(id) on delete cascade;
alter table public.applications        add constraint applications_student_fk   foreign key (student_id)     references public.profiles(id) on delete cascade;
alter table public.connections         add constraint connections_requester_fk  foreign key (requester_id)   references public.profiles(id) on delete cascade;
alter table public.connections         add constraint connections_recipient_fk  foreign key (recipient_id)   references public.profiles(id) on delete cascade;
alter table public.messages            add constraint messages_sender_fk        foreign key (sender_id)      references public.profiles(id) on delete cascade;
alter table public.messages            add constraint messages_recipient_fk     foreign key (recipient_id)   references public.profiles(id) on delete set null;
alter table public.milestones          add constraint milestones_assignee_fk    foreign key (assigned_to)    references public.profiles(id) on delete set null;
alter table public.bookmarks           add constraint bookmarks_user_fk         foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.bookmarks           add constraint bookmarks_profile_fk      foreign key (profile_id)     references public.profiles(id) on delete cascade;
alter table public.notifications       add constraint notifications_user_fk     foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.reviews             add constraint reviews_reviewer_fk       foreign key (reviewer_id)    references public.profiles(id) on delete cascade;
alter table public.reviews             add constraint reviews_reviewee_fk       foreign key (reviewee_id)    references public.profiles(id) on delete cascade;
alter table public.endorsements        add constraint endorsements_giver_fk     foreign key (giver_id)       references public.profiles(id) on delete cascade;
alter table public.endorsements        add constraint endorsements_receiver_fk  foreign key (receiver_id)    references public.profiles(id) on delete cascade;
alter table public.team_members        add constraint team_members_user_fk      foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.meetings            add constraint meetings_organizer_fk     foreign key (organizer_id)   references public.profiles(id) on delete cascade;
alter table public.meeting_attendees   add constraint meeting_attendees_user_fk foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.analytics_events    add constraint analytics_user_fk         foreign key (user_id)        references public.profiles(id) on delete set null;
alter table public.cofounder_profiles  add constraint cofounder_profiles_user_fk foreign key (user_id)      references public.profiles(id) on delete cascade;
alter table public.match_actions       add constraint match_actions_user_fk     foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.match_actions       add constraint match_actions_target_fk   foreign key (target_user_id) references public.profiles(id) on delete cascade;
alter table public.team_tasks          add constraint team_tasks_assignee_fk    foreign key (assignee_id)    references public.profiles(id) on delete set null;
alter table public.team_tasks          add constraint team_tasks_creator_fk     foreign key (created_by)     references public.profiles(id);
alter table public.message_reactions   add constraint reactions_user_fk         foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.user_badges         add constraint badges_receiver_fk        foreign key (receiver_id)    references public.profiles(id) on delete cascade;
alter table public.user_badges         add constraint badges_awarder_fk         foreign key (awarded_by)     references public.profiles(id);
alter table public.certificates        add constraint certificates_receiver_fk  foreign key (receiver_id)    references public.profiles(id) on delete cascade;
alter table public.certificates        add constraint certificates_issuer_fk    foreign key (issued_by)     references public.profiles(id);
alter table public.user_blocks         add constraint blocks_blocker_fk         foreign key (blocker_id)     references public.profiles(id) on delete cascade;
alter table public.user_blocks         add constraint blocks_blocked_fk         foreign key (blocked_id)     references public.profiles(id) on delete cascade;
alter table public.reports             add constraint reports_reporter_fk       foreign key (reporter_id)    references public.profiles(id);
alter table public.reports             add constraint reports_reported_fk       foreign key (reported_user_id) references public.profiles(id);
alter table public.marketplace_services add constraint marketplace_provider_fk  foreign key (provider_id)    references public.profiles(id) on delete cascade;
alter table public.community_events    add constraint events_host_fk            foreign key (host_id)        references public.profiles(id);
alter table public.event_attendees     add constraint event_attendees_user_fk   foreign key (user_id)        references public.profiles(id) on delete cascade;
alter table public.university_members  add constraint university_members_fk     foreign key (user_id)        references public.profiles(id) on delete cascade;

-- 6) Account deletion helper: takes the (Clerk) user id as an argument now,
--    because auth.uid() is always null without Supabase Auth sessions.
--    The app deletes via service role: delete from profiles where id = …
--    (cascades) plus a Clerk Backend API call to remove the auth account.
create or replace function public.delete_own_account(uid text)
returns void language plpgsql security definer set search_path=public as $$
begin
  delete from public.profiles where id = uid;
end;$$;
revoke all on function public.delete_own_account(text) from public;

-- 7) Row Level Security note:
--    The existing RLS policies reference auth.uid(), which only exists for
--    Supabase Auth sessions. The app now talks to Supabase exclusively with
--    the service-role key (server side only), which bypasses RLS entirely;
--    authorization is enforced in the API routes. The policies are left in
--    place harmlessly — they simply never match.

commit;
