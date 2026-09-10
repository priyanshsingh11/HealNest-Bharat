# HealNest Bharat

Discover and request verified home nurses, doctors (non-emergency visits), babysitters/nannies and caregivers near you —
with every rupee itemised before you confirm.

Web MVP built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Zod · React Hook Form · Supabase · Leaflet/OpenStreetMap · Vitest · Playwright**.

> ⚠️ HealNest Bharat is a care-services marketplace, **not** an emergency or diagnostic service. For life-threatening emergencies, dial **112**.
> All providers, reviews and registration numbers in this demo are fictional. No real payments are taken.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No keys are needed: without Supabase credentials the app runs on seeded in-memory data (24 providers across Delhi-NCR, Mumbai and Bengaluru).
In-memory data resets when the dev server restarts.

Try it: search **"Saket"**, pick **Home Nurse**, open a provider, request a visit. Use the **Viewing as** switcher in the header
to act as a **Provider** (accept the request) or **Admin** (change margins, verify providers).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests (distance, pricing, state machine, booking service) |
| `npm run test:e2e` | Playwright smoke test (desktop + mobile Chromium). First run: `npx playwright install chromium` |
| `npm run db:seed` | Seed a Supabase project with the demo data |

## Using Supabase

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/migrations/20260910000000_init.sql`](supabase/migrations/20260910000000_init.sql)
   (or `supabase db push` if you use the Supabase CLI).
3. Copy `.env.example` to `.env.local` and set:
   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role or sb_secret_… key>
   ```
4. `npm run db:seed` — idempotent; safe to re-run (adds availability for new days, keeps edits and bookings).
5. `npm run dev` — the footer shows **Data source: Supabase**.

`DATA_SOURCE=auto|memory|supabase` forces a source. The key is only read on the server; every table has Row Level Security
enabled with no public policies, so the browser can never query the database directly. Price snapshots (`quotes`,
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
│   ├── mock-data.ts         # Typed seed data
│   ├── repository/          # CareRepository interface, memory + Supabase implementations
│   ├── services/            # discovery, quotes, bookings, admin (authorization + audit)
│   └── db.ts                # Picks the data source
├── types/index.ts
└── tests/                   # *.test.ts (Vitest), booking.spec.ts (Playwright)
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
- **Swappable integrations:** storage (`CareRepository`), geocoding (`lib/localities.ts`), maps (`components/map-view.tsx`) and auth
  (`lib/session.ts` / `lib/auth.ts`) are each isolated behind one module.

## Known limitations (MVP)

- Mock login via a cookie role switcher — anyone can switch to admin. **Set `DEMO_TOOLS=false` and add real auth before deploying.**
- Address search covers a fixed list of 18 localities; there is no real geocoder.
- Rate limiting and the in-memory store are per-process (not shared across instances).
- Supabase booking creation is several inserts with best-effort rollback, not a single transaction (move to a Postgres function for production).
- Payments, notifications and contact are simulated.

## Future production integrations

1. Real authentication and role-based authorization (e.g. Supabase Auth + RLS policies per user/provider).
2. Verified identity and professional-licence checks (state medical/nursing councils), background checks, incident reporting.
3. Maps/geocoding with location privacy controls.
4. Payment processor with refunds and provider payouts; invoices and GST handling reviewed by a tax advisor.
5. Prescription and medicine fulfilment workflows compliant with local law.
6. SMS/WhatsApp/push notifications; in-app secure messaging and call masking.
7. Terms of service, privacy policy, consent records, and healthcare/childcare regulatory review.
