-- HealNest Bharat — initial schema.
-- Run in the Supabase SQL editor (or `supabase db push`). Then run `npm run db:seed`.
--
-- Security model for the MVP: Row Level Security is enabled on every table with NO public policies.
-- Only the server (using the service-role / secret key) can read or write. Add per-user policies
-- when real Supabase Auth replaces the mock session.

-- Money is always stored as integer minor units (paise).

create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  short_name  text not null,
  kind        text not null check (kind in ('medical', 'childcare', 'non_medical')),
  description text not null,
  active      boolean not null default true
);

create table if not exists public.app_users (
  id         text primary key,
  name       text not null,
  email      text not null,
  phone      text not null,
  role       text not null check (role in ('user', 'provider', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.provider_profiles (
  id                  text primary key,
  user_id             text not null references public.app_users (id),
  name                text not null,
  category            text not null references public.categories (id),
  gender              text not null check (gender in ('female', 'male', 'other')),
  languages           text[] not null default '{}',
  bio                 text not null default '',
  years_experience    integer not null default 0 check (years_experience >= 0),
  credentials         jsonb not null default '[]'::jsonb,
  verification_status text not null default 'unverified'
                      check (verification_status in ('verified', 'pending', 'unverified', 'rejected')),
  rating              numeric(2, 1) not null default 0 check (rating between 0 and 5),
  review_count        integer not null default 0 check (review_count >= 0),
  service_radius_km   integer not null check (service_radius_km between 1 and 50),
  latitude            double precision not null check (latitude between -90 and 90),
  longitude           double precision not null check (longitude between -180 and 180),
  locality            text not null,
  city                text not null,
  travel_fee_minor    integer not null default 0 check (travel_fee_minor >= 0),
  cancellation_policy text not null,
  active              boolean not null default true
);
create index if not exists provider_profiles_category_idx on public.provider_profiles (category);

create table if not exists public.services (
  id                      text primary key,
  provider_id             text not null references public.provider_profiles (id) on delete cascade,
  category                text not null references public.categories (id),
  name                    text not null,
  description             text not null default '',
  base_price_minor        integer not null check (base_price_minor >= 0),
  duration_minutes        integer not null check (duration_minutes > 0),
  requires_confirmation   boolean not null default false,
  medicine_estimate_minor integer not null default 0 check (medicine_estimate_minor >= 0),
  procedure_fee_minor     integer not null default 0 check (procedure_fee_minor >= 0),
  active                  boolean not null default true
);
create index if not exists services_provider_idx on public.services (provider_id);

create table if not exists public.availability_slots (
  id          text primary key,
  provider_id text not null references public.provider_profiles (id) on delete cascade,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  status      text not null default 'open' check (status in ('open', 'booked', 'blocked')),
  check (end_at > start_at)
);
create index if not exists availability_slots_provider_start_idx on public.availability_slots (provider_id, start_at);

create table if not exists public.addresses (
  id               text primary key,
  user_id          text not null references public.app_users (id),
  label            text not null,
  address_text     text not null,
  latitude         double precision not null,
  longitude        double precision not null,
  consent_to_share boolean not null,
  created_at       timestamptz not null default now()
);

create table if not exists public.bookings (
  id                 text primary key,
  user_id            text not null references public.app_users (id),
  provider_id        text not null references public.provider_profiles (id),
  service_id         text not null references public.services (id),
  address_id         text not null references public.addresses (id),
  slot_id            text references public.availability_slots (id) on delete set null,
  provider_name      text not null,
  service_name       text not null,
  category           text not null references public.categories (id),
  scheduled_start    timestamptz not null,
  scheduled_end      timestamptz not null,
  status             text not null
                     check (status in ('REQUESTED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED')),
  notes              text not null default '',
  distance_km        numeric(6, 1) not null default 0,
  total_amount_minor integer not null check (total_amount_minor >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_provider_idx on public.bookings (provider_id, created_at desc);

-- Price snapshot taken at booking time.
create table if not exists public.quotes (
  id                      text primary key,
  booking_id              text references public.bookings (id) on delete cascade,
  status                  text not null check (status in ('preview', 'estimated', 'confirmed')),
  currency                text not null,
  subtotal_minor          integer not null check (subtotal_minor >= 0),
  tax_minor               integer not null check (tax_minor >= 0),
  total_minor             integer not null check (total_minor >= 0),
  provider_payout_minor   integer not null check (provider_payout_minor >= 0),
  platform_earnings_minor integer not null check (platform_earnings_minor >= 0),
  has_estimates           boolean not null,
  created_at              timestamptz not null,
  expires_at              timestamptz not null,
  check (total_minor = subtotal_minor + tax_minor)
);
create index if not exists quotes_booking_idx on public.quotes (booking_id);

create table if not exists public.quote_line_items (
  id                    text primary key,
  quote_id              text not null references public.quotes (id) on delete cascade,
  position              integer not null,
  type                  text not null check (type in ('visit', 'medicine', 'procedure', 'travel', 'platform_fee', 'tax')),
  label                 text not null,
  base_amount_minor     integer not null check (base_amount_minor >= 0),
  margin_amount_minor   integer not null check (margin_amount_minor >= 0),
  customer_amount_minor integer not null,
  quantity              integer not null check (quantity > 0),
  line_total_minor      integer not null,
  disclosed             boolean not null default true,
  estimated             boolean not null default false,
  check (customer_amount_minor = base_amount_minor + margin_amount_minor),
  check (line_total_minor = customer_amount_minor * quantity)
);
create index if not exists quote_line_items_quote_idx on public.quote_line_items (quote_id);

create table if not exists public.booking_status_events (
  id         bigint generated always as identity primary key,
  booking_id text not null references public.bookings (id) on delete cascade,
  status     text not null,
  at         timestamptz not null default now(),
  by_role    text not null check (by_role in ('user', 'provider', 'admin')),
  note       text
);
create index if not exists booking_status_events_booking_idx on public.booking_status_events (booking_id, at);

create table if not exists public.reviews (
  id          text primary key,
  booking_id  text references public.bookings (id) on delete set null,
  user_id     text not null references public.app_users (id),
  provider_id text not null references public.provider_profiles (id) on delete cascade,
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists reviews_provider_idx on public.reviews (provider_id, created_at desc);

create table if not exists public.pricing_rules (
  id        text primary key,
  item_type text not null unique check (item_type in ('visit', 'medicine', 'procedure', 'travel', 'platform_fee')),
  label     text not null,
  mode      text not null check (mode in ('fixed', 'percent')),
  -- fixed: minor units; percent: basis points (1500 = 15%)
  value     integer not null check (value >= 0),
  active    boolean not null default true,
  check (mode <> 'percent' or value <= 10000)
);

create table if not exists public.platform_config (
  id                                 integer primary key default 1 check (id = 1),
  country                            text not null,
  currency                           text not null,
  tax_label                          text not null,
  tax_rate_bps                       integer not null check (tax_rate_bps between 0 and 5000),
  tax_applies_to                     text[] not null default '{}',
  quote_validity_minutes             integer not null default 30,
  refund_policy                      text not null,
  prescription_required_for_medicine boolean not null default true,
  prescription_note                  text not null default '',
  licensing_note                     text not null default '',
  emergency_number                   text not null
);

create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_role  text not null,
  actor_id    text not null,
  action      text not null,
  entity_type text not null,
  entity_id   text not null,
  details     jsonb not null default '{}'::jsonb
);
create index if not exists audit_logs_at_idx on public.audit_logs (at desc);

-- Price snapshots are immutable once written, so later rule changes never alter historical bookings.
create or replace function public.prevent_snapshot_update() returns trigger
language plpgsql as $$
begin
  raise exception 'Quote snapshots are immutable';
end;
$$;

drop trigger if exists quotes_immutable on public.quotes;
create trigger quotes_immutable before update on public.quotes
  for each row execute function public.prevent_snapshot_update();

drop trigger if exists quote_line_items_immutable on public.quote_line_items;
create trigger quote_line_items_immutable before update on public.quote_line_items
  for each row execute function public.prevent_snapshot_update();

-- Lock everything down: server-side service role only.
alter table public.categories            enable row level security;
alter table public.app_users             enable row level security;
alter table public.provider_profiles     enable row level security;
alter table public.services              enable row level security;
alter table public.availability_slots    enable row level security;
alter table public.addresses             enable row level security;
alter table public.bookings              enable row level security;
alter table public.quotes                enable row level security;
alter table public.quote_line_items      enable row level security;
alter table public.booking_status_events enable row level security;
alter table public.reviews               enable row level security;
alter table public.pricing_rules         enable row level security;
alter table public.platform_config       enable row level security;
alter table public.audit_logs            enable row level security;
