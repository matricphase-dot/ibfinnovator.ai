-- Reputation counters and credential lookup performance.
alter table public.messages add column if not exists read_at timestamptz;
alter table public.profiles add column if not exists average_rating numeric(3,2);
alter table public.profiles add column if not exists endorsement_count int not null default 0;
create index if not exists reviews_reviewee_created_idx on public.reviews(reviewee_id,created_at desc);
create index if not exists endorsements_receiver_skill_idx on public.endorsements(receiver_id,skill);
create index if not exists user_badges_receiver_created_idx on public.user_badges(receiver_id,created_at desc);
create index if not exists certificates_receiver_created_idx on public.certificates(receiver_id,created_at desc);

create or replace function public.recompute_profile_reputation(p_profile_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.profiles set
  average_rating=(select round(avg(r.rating)::numeric,2) from public.reviews r where r.reviewee_id=p_profile_id),
  endorsement_count=(select count(*)::int from public.endorsements e where e.receiver_id=p_profile_id),
  updated_at=now()
 where id=p_profile_id;
end;$$;

create or replace function public.refresh_review_reputation() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.recompute_profile_reputation(coalesce(new.reviewee_id,old.reviewee_id));return coalesce(new,old);end;$$;
create or replace function public.refresh_endorsement_reputation() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.recompute_profile_reputation(coalesce(new.receiver_id,old.receiver_id));return coalesce(new,old);end;$$;
drop trigger if exists reviews_reputation_trigger on public.reviews;
create trigger reviews_reputation_trigger after insert or update or delete on public.reviews for each row execute function public.refresh_review_reputation();
drop trigger if exists endorsements_reputation_trigger on public.endorsements;
create trigger endorsements_reputation_trigger after insert or delete on public.endorsements for each row execute function public.refresh_endorsement_reputation();

-- Backfill existing counters.
do $$ declare p record;begin for p in select id from public.profiles loop perform public.recompute_profile_reputation(p.id);end loop;end$$;
