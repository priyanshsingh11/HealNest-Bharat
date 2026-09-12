-- HealNest Bharat — device-bound accounts.
--
-- Accounts used to be pickable from a public list on /login, so anyone visiting the site could log into
-- anyone else's account. Instead, signing up issues a secret to the browser that created the account and
-- records only its SHA-256 hash here. Logging in requires presenting that secret, so an account is
-- reachable only from a device it was registered on.
--
-- Losing the device (or clearing site data) means losing access: there is no recovery path yet. Add one
-- (email or OTP re-registration) before this carries accounts people cannot afford to lose.

create table if not exists public.account_devices (
  -- SHA-256 (hex) of the secret the browser holds. The secret itself is never stored.
  token_hash   text primary key,
  user_id      text not null references public.app_users (id) on delete cascade,
  -- Where the account was registered, for showing the person their own device list later.
  label        text not null default '',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists account_devices_user_idx on public.account_devices (user_id);

-- Server-only, like every other table: RLS on with no policies, so only the service-role key can read it.
alter table public.account_devices enable row level security;
