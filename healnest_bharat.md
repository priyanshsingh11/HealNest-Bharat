# Nearby Care Platform — Product Roadmap and Codex Build Brief

## 1. Product concept

Build a responsive web application that helps a user discover and request nearby, verified care providers who can visit the user’s home.

Initial provider categories:

- Home nurses
- Doctors for non-emergency home consultations
- Babysitters and nannies
- Caregivers for elderly or disabled people
- Optional later categories: physiotherapists, lab technicians, wound-care specialists

The first release is a web-only MVP built with Next.js and TypeScript. Use mock data and a local database or seeded in-memory data so the application works without external API keys. Design the code so real authentication, payments, maps, notifications, and provider verification can be added later.

## 2. Important safety and business boundaries

This is a care-services marketplace, not an emergency or diagnostic system.

- Show an emergency banner on relevant screens: “For life-threatening emergencies, contact local emergency services.”
- Do not provide diagnosis or medical treatment instructions.
- Clearly distinguish doctors, nurses, babysitters, and non-medical caregivers.
- Display provider credentials, verification status, service radius, availability, reviews, and cancellation terms.
- Require consent before sharing the user’s location with a provider.
- Never silently charge a user. Show a complete price breakdown and require confirmation before booking.
- Treat medicine and procedure costs as estimates until confirmed by the provider.
- Do not add a medicine markup without labeling it clearly as a platform/service margin and showing the original cost, margin, and final amount.
- Add configurable tax, refund, prescription, and licensing fields rather than hardcoding assumptions about a country.

## 3. MVP user journeys

### A. Discover nearby help

1. User opens the homepage.
2. User enters an address or uses browser geolocation.
3. User selects a category: Nurse, Doctor, Babysitter/Nanny, or Caregiver.
4. User sees nearby provider cards sorted by distance, availability, rating, and price.
5. User can filter by service, availability, price range, distance, language, gender preference, and verified status.
6. User opens a provider profile and reviews services, price, credentials, reviews, and availability.

### B. Request a home visit

1. User chooses a service, date, time window, visit address, and short non-diagnostic description.
2. User sees an itemized quote.
3. User confirms the request.
4. MVP shows a simulated booking confirmation and status timeline.
5. User can cancel or contact the provider through a mocked contact action.

### C. Provider-side MVP

Create a provider dashboard with mock login/state switching. A provider can:

- View incoming requests
- Accept or decline a request
- Update availability
- View service radius
- See expected payout and platform fee/margin

### D. Admin-side MVP

Create a basic admin screen with mock data for:

- Provider verification status
- Service and category management
- Booking status
- Pricing rules
- Platform margin configuration

## 4. Pricing and margin model

Use integer minor currency units in the data model to avoid floating-point errors.

Example:

```text
medicineCost = ₹10.00
medicineMargin = ₹5.00
medicineCustomerPrice = ₹15.00
providerVisitFee = ₹300.00
procedureFee = ₹100.00
travelFee = ₹50.00
subtotal = ₹465.00
tax = configurable
total = subtotal + tax
```

Represent every charge as a line item:

```ts
type QuoteLineItem = {
  id: string;
  type: "visit" | "medicine" | "procedure" | "travel" | "platform_fee" | "tax";
  label: string;
  baseAmountMinor: number;
  marginAmountMinor: number;
  customerAmountMinor: number;
  quantity: number;
  disclosed: boolean;
};
```

Rules:

- `customerAmountMinor = baseAmountMinor + marginAmountMinor`.
- Keep provider payout separate from customer price.
- Allow margin to be a fixed amount or percentage through admin configuration.
- Show “Estimated” when a provider must confirm the actual medicine or procedure cost.
- Record a price snapshot on the booking so later rule changes do not alter historical bookings.

## 5. Recommended technical stack

- Next.js 15+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or accessible custom components
- Zod for validation
- React Hook Form for forms
- Prisma with SQLite for the local MVP database
- Vitest for unit tests
- Playwright for one end-to-end booking test
- Leaflet/OpenStreetMap or a simple map placeholder in MVP; isolate map code behind a component
- Mock authentication initially; add a real auth provider later
- Mock payment flow initially; never store card data

If Prisma setup becomes a blocker, use typed seed data in `src/lib/mock-data.ts` and keep the repository/service interfaces unchanged.

## 6. Proposed project directory

```text
nearby-care/
├── README.md
├── .env.example
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── discover/page.tsx
│   │   ├── providers/[providerId]/page.tsx
│   │   ├── booking/new/page.tsx
│   │   ├── booking/[bookingId]/page.tsx
│   │   ├── dashboard/provider/page.tsx
│   │   ├── dashboard/admin/page.tsx
│   │   └── api/
│   │       ├── providers/route.ts
│   │       ├── quotes/route.ts
│   │       └── bookings/route.ts
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── category-selector.tsx
│   │   ├── location-picker.tsx
│   │   ├── provider-card.tsx
│   │   ├── provider-filters.tsx
│   │   ├── provider-profile.tsx
│   │   ├── quote-breakdown.tsx
│   │   ├── booking-form.tsx
│   │   ├── booking-status.tsx
│   │   ├── emergency-banner.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── mock-data.ts
│   │   ├── pricing.ts
│   │   ├── geo.ts
│   │   ├── validations.ts
│   │   └── formatters.ts
│   ├── types/
│   │   └── index.ts
│   └── tests/
│       ├── pricing.test.ts
│       └── booking.spec.ts
└── docs/
    ├── product-requirements.md
    └── api-contracts.md
```

## 7. Core data entities

Create these entities in Prisma or the mock repository layer:

- `User`: id, name, phone/email, role, createdAt
- `ProviderProfile`: id, userId, category, bio, credentials, verificationStatus, rating, reviewCount, serviceRadiusKm
- `Service`: id, providerId, category, name, description, basePriceMinor, durationMinutes, requiresConfirmation
- `AvailabilitySlot`: id, providerId, startAt, endAt, status
- `Address`: id, userId, label, addressText, latitude, longitude, consentToShare
- `Booking`: id, userId, providerId, serviceId, addressId, scheduledStart, scheduledEnd, status, notes, totalAmountMinor
- `Quote`: id, bookingId, status, currency, subtotalMinor, taxMinor, totalMinor, expiresAt
- `QuoteLineItem`: id, quoteId, type, label, baseAmountMinor, marginAmountMinor, customerAmountMinor, quantity
- `Review`: id, bookingId, userId, providerId, rating, comment
- `PricingRule`: id, itemType, mode, value, active

Booking status should be an explicit state machine:

```text
REQUESTED → ACCEPTED → ON_THE_WAY → ARRIVED → IN_PROGRESS → COMPLETED
REQUESTED → DECLINED
REQUESTED/ACCEPTED → CANCELLED
```

## 8. Build phases

### Phase 1 — Foundation

- Scaffold the Next.js project.
- Add TypeScript, Tailwind, component primitives, validation, and linting.
- Add a polished responsive shell with navigation and emergency banner.
- Add seeded mock providers and services.

### Phase 2 — Discovery

- Build location picker with address text and optional browser geolocation.
- Build category selection and provider discovery.
- Calculate approximate distance with the Haversine formula.
- Build filters, sorting, loading states, empty states, and error states.

### Phase 3 — Provider profiles

- Show provider identity, category, credentials, verification badge, services, prices, service area, reviews, and availability.
- Make it impossible to confuse medical and childcare services in the UI.
- Add a clear “Request home visit” action.

### Phase 4 — Quote and booking

- Build validated booking form.
- Add quote calculation server-side and client preview.
- Show visit fee, medicine estimate, procedure estimate, travel fee, margin, tax, and total as separate rows.
- Add confirmation, booking detail, cancellation, and simulated status updates.

### Phase 5 — Provider and admin dashboards

- Add role-based mock views.
- Provider request management and availability.
- Admin provider verification and pricing-rule controls.

### Phase 6 — Quality and production preparation

- Add tests and accessibility checks.
- Add rate limiting and authorization boundaries around API routes.
- Add audit logging for quote changes, booking status changes, and verification changes.
- Replace mock auth, maps, payments, messaging, and notifications one integration at a time.

## 9. UX and visual direction

Use a trustworthy, calm healthcare-inspired interface:

- Light background, dark readable text, blue/teal primary accent, green for verified/success, amber for estimates.
- Large location input near the top of the homepage.
- Category cards with clear icons and plain-language descriptions.
- Provider cards should answer: who they are, what they do, distance, earliest availability, rating, and starting price.
- Use a sticky quote summary on desktop and a bottom summary bar on mobile.
- Ensure every interactive element has keyboard focus, a visible label, and sufficient color contrast.

## 10. Required acceptance criteria

The generated application is ready for MVP review when:

- `npm install` completes successfully.
- `npm run dev` starts the application.
- The homepage loads without console errors.
- A user can choose a location and category and see nearby seeded providers.
- Distance, availability, and prices appear on provider cards.
- A provider profile can be opened directly by URL.
- A user can submit a booking request with validation.
- The quote displays every cost component and margin separately.
- A booking confirmation page shows the complete price snapshot and status.
- Provider and admin dashboard demo routes load.
- `npm run lint`, `npm run test`, and the Playwright smoke test pass.
- The app has responsive layouts for mobile and desktop.
- No real medical diagnosis, emergency promise, payment credentials, or secret keys are included.

## 11. Copy-paste instruction for Codex

```text
Build the Nearby Care Platform described in docs/nearby-care-platform-roadmap.md as a working Next.js + TypeScript web MVP.

First inspect the repository and preserve existing user work. If no app exists, scaffold one. Implement the product in vertical slices: foundation, discovery, provider profile, quote/booking, provider dashboard, and admin dashboard. Use seeded mock data and a local SQLite/Prisma database if practical; otherwise use a typed repository abstraction with mock data. Do not require paid APIs or external credentials.

Use accessible responsive UI. Implement location selection, nearby provider filtering, provider profiles, availability, booking form validation, itemized quote calculation, and transparent medicine/service margin display. Keep quote calculations in a reusable server-side module and use integer minor currency units. Add an emergency notice and avoid diagnosis or emergency-care claims.

Add unit tests for distance and pricing calculations and an end-to-end smoke test covering location → category → provider → booking → confirmation. Add README setup instructions, .env.example, seed instructions, and a short list of future production integrations. Run lint, tests, and a production build. Fix all errors you introduce. At the end, report the files changed, commands run, and any remaining limitations.
```

## 12. Future production integrations

Only after the MVP is validated:

- Verified identity and professional-license checks
- Real authentication and role-based authorization
- Maps/geocoding and location privacy controls
- Payment processor with refunds and provider payouts
- Prescription and medicine fulfillment workflows compliant with local law
- SMS/WhatsApp/push notifications
- In-app secure messaging and call masking
- Provider background checks and incident reporting
- Taxes, invoices, terms of service, privacy policy, consent records, and healthcare/childcare regulatory review
