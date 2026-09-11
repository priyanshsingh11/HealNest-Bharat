-- HealNest Bharat — caretaker verification and reviews.
--
--   * profile photos
--   * time slots with a capacity and a booked count
--   * star ratings for individual aspects, and one review per booking
--   * verification applications reviewed by admins
--
-- Then re-run `npm run db:seed` to add sample verification applications.

alter table public.provider_profiles
  add column if not exists photo_url text;

alter table public.availability_slots
  add column if not exists capacity     integer not null default 1 check (capacity between 1 and 50),
  add column if not exists booked_count integer not null default 0 check (booked_count >= 0);

-- Slots booked before this migration held exactly one booking.
update public.availability_slots set booked_count = 1 where status = 'booked' and booked_count = 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'availability_slots_booked_within_capacity') then
    alter table public.availability_slots
      add constraint availability_slots_booked_within_capacity check (booked_count <= capacity);
  end if;
end $$;

alter table public.reviews
  add column if not exists aspects         jsonb not null default '{}'::jsonb,
  add column if not exists would_recommend boolean;

-- One review per completed booking.
create unique index if not exists reviews_booking_unique on public.reviews (booking_id) where booking_id is not null;

create table if not exists public.verification_applications (
  id            text primary key,
  provider_id   text not null references public.provider_profiles (id) on delete cascade,
  category      text not null references public.categories (id),
  status        text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'superseded')),
  -- Identity, contact, qualifications and registration. Only the last 4 characters of a government ID are stored.
  details       jsonb not null,
  -- File metadata only; connect Supabase Storage before accepting real documents.
  documents     jsonb not null default '[]'::jsonb,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewer_note text not null default ''
);
create index if not exists verification_applications_provider_idx on public.verification_applications (provider_id, submitted_at desc);
create index if not exists verification_applications_status_idx on public.verification_applications (status, submitted_at desc);

alter table public.verification_applications enable row level security;
