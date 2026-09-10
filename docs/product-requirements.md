# HealNest Bharat — product requirements (MVP)

The full brief is in [`../healnest_bharat.md`](../healnest_bharat.md). This page summarises what the MVP implements.

## Concept

A responsive web marketplace to discover and request nearby, verified care providers who visit the user's home:
home nurses, doctors (non-emergency home consultations), babysitters/nannies, and caregivers for elders or people with disabilities.

## Safety & business boundaries (implemented)

| Requirement | Where |
| --- | --- |
| Emergency banner on care-seeking screens | `components/emergency-banner.tsx` on home, discover, profile, booking pages |
| No diagnosis / treatment advice | Copy throughout; booking notes are "logistics only", 300 chars max |
| Medical vs childcare vs non-medical clearly separated | `KindBadge` on every card/profile, colour-coded tiles, kind notice on profiles |
| Credentials, verification, radius, availability, reviews, cancellation terms | Provider profile |
| Consent before sharing location | Required checkbox in booking form; coordinates rounded to ~100 m before booking |
| Never silently charge; full breakdown + confirmation | Itemised `QuoteBreakdown`, "reviewed the price" checkbox, explicit confirm; no payment taken |
| Medicine/procedure costs are estimates | `estimated` flag, amber "Estimated" badges and notice |
| Medicine margin disclosed | "Original cost ₹X + platform margin ₹Y = ₹Z" on every margin line |
| Configurable tax, refund, prescription, licensing | Admin → Country settings (`PlatformConfig`) |
| Only verified providers can be booked | `services/bookings.ts` |

## User journeys

- **Discover:** location (offline locality search or browser geolocation) → category → cards sorted by distance/availability/rating/price, filterable by service text, availability, price, distance, language, gender preference and verified status.
- **Request a visit:** service, arrival window, visit address, short note → live itemised quote → consent + confirm → confirmation page with price snapshot and status timeline → cancel or mocked contact.
- **Provider dashboard:** mock login as any provider; accept/decline, advance visit status, open/block/add availability, edit service radius, see payout vs platform fee per booking.
- **Admin dashboard:** verification, listing on/off, category and service management, bookings by status, pricing rules (fixed or percent), country settings, audit log.

## Pricing model

Integer paise everywhere. Each charge is a `QuoteLineItem` with base (provider), margin (platform) and customer amounts.
Provider payout is kept separate from customer price. Margins per item type are fixed or percentage via admin.
Tax is a configurable rate applied to configurable item types (default: GST 18% on the platform fee only — confirm with a tax advisor).
Every booking stores an immutable quote snapshot (also enforced by a database trigger in Supabase).

Worked example from the brief (tested in `src/tests/pricing.test.ts`):
₹10 medicine + ₹5 margin, ₹300 visit, ₹100 procedure, ₹50 travel → subtotal ₹465.

## Out of scope for the MVP

Real authentication, payments, geocoding, messaging/notifications, identity and licence verification, background checks,
prescription fulfilment, invoicing. See the README for the integration plan.
