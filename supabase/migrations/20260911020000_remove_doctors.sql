-- HealNest Bharat — remove doctors.
--
-- Doctors are no longer offered. Deletes doctor profiles and everything tied to them, the doctor category, and the
-- columns only doctors used (practice profile, online fees, online slots and consultation modes).
-- Safe to run on a database that never had doctors.

begin;

-- Doctor bookings and their visit addresses. Quotes, line items and status events cascade from the bookings.
with removed as (
  delete from public.bookings
  where category = 'doctor'
     or provider_id in (select id from public.provider_profiles where category = 'doctor')
  returning address_id
)
delete from public.addresses where id in (select address_id from removed);

-- Doctor profiles (services, slots, reviews and verification applications cascade), then their accounts.
with removed as (
  delete from public.provider_profiles where category = 'doctor' returning user_id
)
delete from public.app_users where id in (select user_id from removed);

delete from public.verification_applications where category = 'doctor';
delete from public.categories where id = 'doctor';

alter table public.provider_profiles  drop column if exists practice;
alter table public.services           drop column if exists online_price_minor;
alter table public.availability_slots drop column if exists mode;
alter table public.bookings           drop column if exists consult_mode;

commit;
