# HealNest Bharat

Discover and request verified home nurses, physiotherapists, lab collection, babysitters/nannies and caregivers near you —
with every rupee itemised before you confirm.

> Doctors have been removed from the product; every booking is a home visit by one of the professions above. If your Supabase
> database was set up earlier, run [`20260911020000_remove_doctors.sql`](supabase/migrations/20260911020000_remove_doctors.sql) —
> it deletes the `doctor` category, doctor providers and everything tied to them. It is safe on a fresh database.

Web MVP built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zod · React Hook Form · Supabase · Mappls (Leaflet/OpenStreetMap fallback) · Vitest · Playwright**.

> ⚠️ HealNest Bharat is a care-services marketplace, **not** an emergency or diagnostic service. For life-threatening emergencies, dial **112**.
> No real payments are taken.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No keys are needed: without Supabase credentials the app runs on an in-memory store. It starts with the categories,
pricing rules and platform settings plus a demo customer and admin, but **no providers** — caretakers sign up themselves.
In-memory data resets when the dev server restarts.

Try it: **Log in → Sign up → Caretaker** and create a nurse based in **Saket**, add availability and submit
verification. Approve it as staff at **/staff** (see *Accounts and sign-in* below). Then, as a customer, search
**"Saket"**, pick **Home Nurse**, open the provider and request a visit.

## Accounts and sign-in

Customers and caretakers **sign up and log in with an email and password**. With Supabase, the password lives in
Supabase Auth and is linked to the app account through `app_users.auth_user_id`; the in-memory store keeps an
in-memory stand-in (`src/lib/password-auth.ts`). **Forgot password?** emails a code for choosing a new one — in memory
mode the code is printed in the server log instead.

In Supabase, set *Authentication → Emails → Templates → Reset Password* to show the code, e.g.
`<p>Your code is <strong>{{ .Token }}</strong></p>`, and configure custom SMTP so it reaches customers' inboxes.
Accounts made before passwords existed have no password yet: their owners use **Forgot password?** to set one.

The session is one signed, httpOnly cookie (`hn_session`), signed with `SESSION_SECRET` (or, when that is unset, a key
derived from `SUPABASE_SERVICE_ROLE_KEY`), so it can't be edited in the browser.

Staff sign-in is separate: the admin dashboard has no account picker and nothing links to it. Staff go to **`/staff`**
(or *HealNest staff sign-in* under the login form), enter `ADMIN_PASSCODE`, then the code emailed to an address in
`ADMIN_EMAILS`. A password log-in never opens the admin dashboard.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (distance, pricing, state machine, booking service) |
| `npm run test:e2e` | Playwright smoke test (desktop + mobile Chromium). First run: `npx playwright install chromium` |
| `npm run db:seed` | Seed a Supabase project with categories, pricing rules, settings and the demo accounts |

## Using Supabase

1. Create a Supabase project.
2. In **SQL Editor**, run every file in [`supabase/migrations/`](supabase/migrations/) in filename order
   (or `supabase db push` if you use the Supabase CLI). See [docs/database-design.md](docs/database-design.md) for the
   schema, the Supabase Auth link and the full activation checklist.
3. Copy `.env.example` to `.env.local` and set:
   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role or sb_secret_… key>
   ```
4. `npm run db:seed` — idempotent; safe to re-run (keeps admin edits).
5. `npm run dev` — the footer shows **Data source: Supabase**.

`DATA_SOURCE=auto|memory|supabase` forces a source. The key is only read on the server; every table has Row Level Security
with read-only policies (public catalogue, private rows for their owners and admins) and no write policies, so the browser
can never write to the database directly. Price snapshots (`quotes`,
`quote_line_items`) are protected from updates by a trigger, and money columns have `CHECK` constraints mirroring the pricing invariants.

## Project structure

```text
src/
├── app/                     # Routes (App Router)
│   ├── page.tsx             # Home: location + categories
│   ├── discover/            # Nearby providers, filters, map, loading state
│   ├── providers/[providerId]/
│   ├── booking/new/         # Booking form + live quote
│   ├── booking/[bookingId]/ # Confirmation, price snapshot, status timeline
│   ├── bookings/            # Session's bookings
│   ├── dashboard/provider/  # Requests, availability, radius, payouts
│   ├── dashboard/admin/     # Verification, catalogue, pricing, settings, audit log
│   └── api/                 # providers, quotes, bookings, slots, admin/*, session
├── components/              # UI (location picker, provider card, quote breakdown, map, …)
├── lib/
│   ├── pricing.ts           # Pure quote engine (integer paise), shared by server + client preview
│   ├── geo.ts               # Haversine distance
│   ├── booking-status.ts    # Explicit booking state machine
│   ├── validations.ts       # Zod schemas (forms + API)
│   ├── platform-defaults.ts # Pricing rules, platform settings, caretaker starter services
│   ├── seed.ts              # What a fresh store starts with (no providers or bookings)
│   ├── repository/          # CareRepository interface, memory + Supabase implementations
│   ├── services/            # discovery, quotes, bookings, admin (authorization + audit)
│   └── db.ts                # Picks the data source
├── types/index.ts
└── tests/                   # *.test.ts (Vitest, test-only data in fixtures.ts), booking.spec.ts (Playwright)
supabase/migrations/         # Postgres schema
scripts/seed-supabase.ts
docs/                        # product-requirements.md, api-contracts.md
```

## Design decisions

- **Money:** integer paise only. `customer = base + margin` per line; provider payout is tracked separately from the customer price.
  Margins are fixed or percentage (basis points) per item type, configured by admins and always shown to the customer.
- **Server is authoritative:** the booking form previews the quote with the same `pricing.ts`, but `POST /api/bookings` recalculates it,
  re-checks verification, slot availability and service radius, and stores an immutable snapshot.
- **Safety:** only verified providers can be booked; estimated medicine/procedure costs are labelled; location consent is required;
  coordinates from geolocation are rounded to ~100 m before booking.
- **Swappable integrations:** storage (`CareRepository`), geocoding (`lib/localities.ts`), maps (`components/mappls-map-view.tsx` when `NEXT_PUBLIC_MAPPLS_KEY` is set, else `components/map-view.tsx`) and auth
  (`lib/session.ts` / `lib/auth.ts`) are each isolated behind one module.

## Known limitations (MVP)

- Sign-up doesn't confirm the email address before the account works; only a password reset proves it.
- Address search covers a fixed list of 18 localities; there is no real geocoder.
- Rate limiting and the in-memory store are per-process (not shared across instances).
- Supabase booking creation is several inserts with best-effort rollback, not a single transaction (move to a Postgres function for production).
- Payments, notifications and contact are simulated.

## Future production integrations

1. Real authentication and role-based authorization (e.g. Supabase Auth + RLS policies per user/provider).
2. Verified identity and professional-licence checks (state nursing and physiotherapy councils), background checks, incident reporting.
3. Maps/geocoding with location privacy controls.
4. Payment processor with refunds and provider payouts; invoices and GST handling reviewed by a tax advisor.
5. Prescription and medicine fulfilment workflows compliant with local law.
6. SMS/WhatsApp/push notifications; in-app secure messaging and call masking.
7. Terms of service, privacy policy, consent records, and healthcare/childcare regulatory review.
