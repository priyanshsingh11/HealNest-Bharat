# API contracts

All routes are Next.js route handlers under `src/app/api`. Bodies are JSON. Money is always integer **minor units** (paise).
Every route is rate-limited per client IP (reads: 120/min, writes: 30/min) and validates input with Zod.

Errors share one shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Choose a date and time window", "issues": [{ "path": "slotId", "message": "…" }] } }
```

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` | Bad input |
| 403 | `FORBIDDEN` | Role not allowed (switch role in the header) |
| 404 | `NOT_FOUND` | Missing, or not visible to this session |
| 409 | `CONFLICT`, `INVALID_TRANSITION` | Slot taken, illegal status change |
| 422 | `UNPROCESSABLE` | Business rule failed (unverified provider, outside service area) |
| 429 | `RATE_LIMITED` | Too many requests (`Retry-After` header) |

## Session (mock auth)

`POST /api/session` — `{ "role": "user" | "provider" | "admin", "providerId"?: "prov_01" }` → sets `hn_role` / `hn_provider` httpOnly cookies. Disabled when `DEMO_TOOLS=false`.

## Discovery

`GET /api/providers?lat=28.63&lng=77.21&category=nurse&sort=distance`

Optional filters: `q`, `maxDistanceKm`, `maxPrice` (rupees), `minRating`, `language`, `gender`, `availability` (`today|tomorrow|week`), `verifiedOnly=1`, `sort` (`distance|availability|rating|price`).
Only providers whose service radius covers the location are returned.

```json
{ "count": 1, "totalInCategory": 1, "location": { "latitude": 28.63, "longitude": 77.21 },
  "results": [{ "provider": { "...": "ProviderProfile" }, "distanceKm": 0.6, "startingPriceMinor": 30000,
                "earliestSlot": { "id": "slot_01_…", "startAt": "…", "endAt": "…", "status": "open" },
                "services": [{ "id": "svc_01_1", "name": "Injection administration", "basePriceMinor": 30000 }] }] }
```

`GET /api/providers/:providerId` → `{ provider, services, slots, reviews }` (open future slots only).

`PATCH /api/providers/:providerId` — admin: `{ verificationStatus?, active? }`; provider (own profile): `{ serviceRadiusKm }`.

`POST /api/providers/:providerId/slots` — provider: `{ startAt: ISO-8601 with offset, durationMinutes?: 30–600 }`. Rejects past or overlapping slots.

`PATCH /api/slots/:slotId` — provider: `{ status: "open" | "blocked" }`. Booked slots cannot be changed.

## Quotes

`POST /api/quotes` — `{ providerId, serviceId, includeMedicine?: boolean, medicineQuantity?: 1–10 }` → `{ quote }`.
Nothing is reserved or charged.

```json
{
  "quote": {
    "status": "estimated", "currency": "INR",
    "lineItems": [
      { "id": "li_visit", "type": "visit", "label": "Visit fee — Injection administration",
        "baseAmountMinor": 30000, "marginAmountMinor": 0, "customerAmountMinor": 30000,
        "quantity": 1, "lineTotalMinor": 30000, "disclosed": true, "estimated": false },
      { "id": "li_medicine", "type": "medicine", "label": "Medicines & consumables",
        "baseAmountMinor": 1000, "marginAmountMinor": 100, "customerAmountMinor": 1100,
        "quantity": 1, "lineTotalMinor": 1100, "disclosed": true, "estimated": true }
    ],
    "subtotalMinor": 50000, "taxMinor": 882, "totalMinor": 50882,
    "providerPayoutMinor": 46000, "platformEarningsMinor": 4000, "hasEstimates": true
  }
}
```

Invariants (enforced in code, in tests, and by database `CHECK` constraints):
`customerAmountMinor = baseAmountMinor + marginAmountMinor`, `lineTotalMinor = customerAmountMinor × quantity`,
`totalMinor = subtotalMinor + taxMinor = providerPayoutMinor + platformEarningsMinor + taxMinor`.

## Bookings

`POST /api/bookings` (customer role)

```json
{ "providerId": "prov_01", "serviceId": "svc_01_1", "slotId": "slot_01_20260911_08",
  "addressLabel": "Home", "addressText": "Flat 4B, Barakhamba Road, Connaught Place",
  "latitude": 28.6315, "longitude": 77.2167, "notes": "Prescription available",
  "includeMedicine": true, "medicineQuantity": 1,
  "consentToShareLocation": true, "acceptPriceBreakdown": true }
```

→ `201 { booking }`. The server re-validates the provider (active, **verified**), service, slot (open, future), service radius
and consent, recalculates the quote, stores it as an immutable price snapshot, and atomically reserves the slot. Client prices are ignored.

`GET /api/bookings` → bookings visible to the session (own / provider's / all for admin).

`GET /api/bookings/:bookingId` → `{ booking }`.

`PATCH /api/bookings/:bookingId` — `{ status, note? }`. State machine:

```
REQUESTED → ACCEPTED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED
REQUESTED → DECLINED
REQUESTED / ACCEPTED → CANCELLED
```

Customers may only cancel. Providers (own bookings) and admins run the visit. Cancel/decline releases the slot.

`POST /api/bookings/:bookingId/simulate` — demo only: advances one step as the provider; logged as simulated.

## Admin

- `PATCH /api/admin/pricing-rules/:ruleId` — `{ mode: "fixed" | "percent", value, active, label? }`. Fixed = paise, percent = basis points (≤ 10000).
- `PATCH /api/admin/config` — any of `taxLabel, taxRateBps, taxAppliesTo, quoteValidityMinutes, refundPolicy, prescriptionRequiredForMedicine, prescriptionNote, licensingNote, emergencyNumber`.
- `PATCH /api/admin/categories/:categoryId` — `{ active?, description? }`.
- `PATCH /api/admin/services/:serviceId` — `{ basePriceMinor?, active? }`.

All admin, verification, slot, quote-snapshot and booking-status changes are written to the audit log.
