-- HealNest Bharat — Supabase Auth.
--
--   * links every app user to a Supabase Auth account (auth.users) through app_users.auth_user_id
--   * creates the app user automatically when someone signs up (phone OTP, email or Google)
--   * Row Level Security read policies for customers, caretakers and admins
--   * Storage buckets for profile photos and verification documents
--
-- Writes still go through the Next.js API with the service-role key, which bypasses RLS, so pricing,
-- quote snapshots and slot counting stay enforced in one place. These policies make direct reads with the
-- publishable (anon) key safe: the catalogue is public, private rows are visible only to their owners and admins.
--
-- Demo rows (user_demo, admin_demo, user_prov_*) have no auth account and keep working. See docs/database-design.md
-- for promoting an admin and linking a caretaker profile to a real account.

-- ---------------------------------------------------------------------------
-- Identity: app_users ↔ auth.users (1:1)
-- ---------------------------------------------------------------------------

-- Nullable so demo rows stay valid. Deleting the auth account keeps the app user for booking history.
alter table public.app_users
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

create index if not exists provider_profiles_user_idx on public.provider_profiles (user_id);
create index if not exists addresses_user_idx on public.addresses (user_id);
create index if not exists bookings_address_idx on public.bookings (address_id);

-- New sign-up → app user. Sign-up metadata is client-controlled, so it can only choose customer or caretaker;
-- admin is never self-assigned (promote staff with SQL).
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.app_users (id, auth_user_id, name, email, phone, role)
  values (
    'user_' || replace(new.id::text, '-', ''),
    new.id,
    coalesce(
      nullif(trim(meta ->> 'full_name'), ''),
      nullif(trim(meta ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'HealNest user'
    ),
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    case when meta ->> 'account_type' = 'caretaker' then 'provider' else 'user' end
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep contact details in step when a user changes their email or phone in Auth.
create or replace function public.handle_auth_user_updated() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.app_users
     set email = coalesce(new.email, ''), phone = coalesce(new.phone, '')
   where auth_user_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated after update of email, phone on auth.users
  for each row when (old.email is distinct from new.email or old.phone is distinct from new.phone)
  execute function public.handle_auth_user_updated();

-- ---------------------------------------------------------------------------
-- Policy helpers. SECURITY DEFINER so policies can look up the caller without recursing through RLS.
-- ---------------------------------------------------------------------------

create or replace function public.current_app_user_id() returns text
language sql stable security definer set search_path = '' as $$
  select id from public.app_users where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_users where auth_user_id = auth.uid() and role = 'admin')
$$;

-- Provider profiles the caller controls (normally one).
create or replace function public.current_provider_ids() returns setof text
language sql stable security definer set search_path = '' as $$
  select p.id
    from public.provider_profiles p
    join public.app_users u on u.id = p.user_id
   where u.auth_user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Read policies. There are deliberately no insert/update/delete policies: writes go through the API.
-- ---------------------------------------------------------------------------

-- Public catalogue.
drop policy if exists "categories are public" on public.categories;
create policy "categories are public" on public.categories
  for select to anon, authenticated
  using (active or (select public.is_admin()));

drop policy if exists "active providers are public" on public.provider_profiles;
create policy "active providers are public" on public.provider_profiles
  for select to anon, authenticated
  using (active or id in (select public.current_provider_ids()) or (select public.is_admin()));

drop policy if exists "active services are public" on public.services;
create policy "active services are public" on public.services
  for select to anon, authenticated
  using (active or provider_id in (select public.current_provider_ids()) or (select public.is_admin()));

drop policy if exists "slots are public" on public.availability_slots;
create policy "slots are public" on public.availability_slots
  for select to anon, authenticated using (true);

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public" on public.reviews
  for select to anon, authenticated using (true);

-- Margins are disclosed on every quote, so the rules behind them are public too.
drop policy if exists "pricing rules are public" on public.pricing_rules;
create policy "pricing rules are public" on public.pricing_rules
  for select to anon, authenticated using (true);

drop policy if exists "platform config is public" on public.platform_config;
create policy "platform config is public" on public.platform_config
  for select to anon, authenticated using (true);

-- Private rows.
drop policy if exists "users read themselves" on public.app_users;
create policy "users read themselves" on public.app_users
  for select to authenticated
  using (auth_user_id = (select auth.uid()) or (select public.is_admin()));

-- Caretakers see a customer's address only for their own bookings, and only with the customer's consent.
drop policy if exists "addresses: owner, assigned caretaker, admin" on public.addresses;
create policy "addresses: owner, assigned caretaker, admin" on public.addresses
  for select to authenticated
  using (
    user_id = (select public.current_app_user_id())
    or (select public.is_admin())
    or (
      consent_to_share
      and exists (
        select 1 from public.bookings b
         where b.address_id = addresses.id
           and b.provider_id in (select public.current_provider_ids())
      )
    )
  );

drop policy if exists "bookings: customer, caretaker, admin" on public.bookings;
create policy "bookings: customer, caretaker, admin" on public.bookings
  for select to authenticated
  using (
    user_id = (select public.current_app_user_id())
    or provider_id in (select public.current_provider_ids())
    or (select public.is_admin())
  );

-- Quotes, line items and status events follow the booking they belong to (the bookings policy applies inside EXISTS).
drop policy if exists "quotes follow their booking" on public.quotes;
create policy "quotes follow their booking" on public.quotes
  for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = quotes.booking_id) or (select public.is_admin()));

drop policy if exists "line items follow their quote" on public.quote_line_items;
create policy "line items follow their quote" on public.quote_line_items
  for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_line_items.quote_id));

drop policy if exists "status events follow their booking" on public.booking_status_events;
create policy "status events follow their booking" on public.booking_status_events
  for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_status_events.booking_id));

-- Identity documents and registration details: the applicant and admins only.
drop policy if exists "verification: applicant and admin" on public.verification_applications;
create policy "verification: applicant and admin" on public.verification_applications
  for select to authenticated
  using (provider_id in (select public.current_provider_ids()) or (select public.is_admin()));

drop policy if exists "audit log: admin only" on public.audit_logs;
create policy "audit log: admin only" on public.audit_logs
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage. Objects are stored as <provider_id>/<file name>.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('provider-photos', 'provider-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "provider photos are public" on storage.objects;
create policy "provider photos are public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'provider-photos');

drop policy if exists "caretakers upload their photo" on storage.objects;
create policy "caretakers upload their photo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-photos' and (storage.foldername(name))[1] in (select public.current_provider_ids()));

drop policy if exists "caretakers replace their photo" on storage.objects;
create policy "caretakers replace their photo" on storage.objects
  for update to authenticated
  using (bucket_id = 'provider-photos' and (storage.foldername(name))[1] in (select public.current_provider_ids()));

drop policy if exists "caretakers upload verification documents" on storage.objects;
create policy "caretakers upload verification documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] in (select public.current_provider_ids()));

drop policy if exists "applicant and admin read verification documents" on storage.objects;
create policy "applicant and admin read verification documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-documents'
    and ((storage.foldername(name))[1] in (select public.current_provider_ids()) or (select public.is_admin()))
  );
