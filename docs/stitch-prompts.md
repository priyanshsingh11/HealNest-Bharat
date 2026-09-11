# HealNest Bharat — Google Stitch prompts

How to use:
1. Create one Stitch project. Choose **Web** (then repeat with **App** for mobile if you want both).
2. Paste **Prompt 0 (Design system)** first, together with Prompt 1. Paste each later prompt one at a time in the same project, so every screen keeps the same style.
3. When a screen looks right, use **Copy to Figma** and paste it into your Figma file (one frame per screen).
4. If a screen drifts off-style, reply in Stitch: "Keep the HealNest design system from the first screen: teal #0B6A61 primary, #F6F9FB background, white 16px-radius cards, Inter."

---

## Prompt 0 — Design system (paste first, with Prompt 1)

```
Design system for "HealNest Bharat", an Indian web marketplace for booking verified home-visit care: home nurses, physiotherapists, home lab collection, babysitters/nannies and elder caregivers. Mood: calm, trustworthy, clinical but warm, very clear. Not flashy. Built for Indian families, including older users, so use large readable text and strong contrast.

Colors:
- Background #F6F9FB, cards/surfaces #FFFFFF, borders #DCE5EC
- Text #0F1F2E, secondary text #4A5D6E
- Primary teal #0B6A61 (buttons, logo tile, selected chips), hover #0C554F, light teal tint #ECFBF8, teal accent #16A394
- Link/focus blue #1D64C8
- Verified/success: emerald green text #047857 on #ECFDF5
- Estimates/warnings: amber text #92400E on #FFFBEB with #FDE68A border
- Emergency: rose text #881337 on #FFF1F2 with #FECDD3 border
- Category tiles: medical = sky (#E0F2FE bg, #075985 text), childcare = fuchsia (#FAE8FF bg, #86198F text), non-medical care = violet (#EDE9FE bg, #5B21B6 text)

Typography: Inter. Headings extra-bold (800) with tight letter-spacing; H1 48px desktop / 30px mobile; body 16px; small labels 12–14px. Prices in bold tabular figures with the rupee sign (₹1,250).
Shapes: cards 16px radius with 1px #DCE5EC border and a very soft shadow; hero search box 24px radius; buttons and inputs 10px radius, 44–48px tall; chips and badges fully rounded pills.
Icons: Lucide outline icons, 1.75 stroke.
Layout: max content width 1280px, 24px gutters, generous whitespace.
Header on every screen: sticky white bar, 64px tall. Left: logo (a 36px teal rounded square with a white heart-pulse icon, then "HealNest" in dark text and "Bharat" in teal). Center/right nav: Find care, My bookings, Provider dashboard, Admin. Hamburger menu on mobile.
Footer: white, two columns. Left: "HealNest Bharat — A marketplace for home-visit care services. We do not provide diagnosis, medical advice or emergency care. For emergencies, dial 112." Right: "MVP demo — providers, reviews and registration numbers are fictional."
Care-seeking screens show a thin rose emergency strip under the header with a siren icon: "For life-threatening emergencies, contact local emergency services (dial 112 in India). HealNest Bharat does not provide emergency care or diagnosis."
```

---

## Prompt 1 — Home / landing page

```
Home page for HealNest Bharat, using the design system above.

1. Header + rose emergency strip.
2. Hero on a soft vertical gradient from #ECFBF8 to #F6F9FB. Small teal uppercase eyebrow: "HOME VISITS · DELHI-NCR · MUMBAI · BENGALURU". H1: "Trusted care, at your doorstep." Subtext: "Find verified home nurses, physiotherapists, lab collection, babysitters and elder caregivers near you — with every rupee explained before you book." Optional on the right: a warm illustration of a nurse visiting an elderly Indian woman at home.
3. Big white search card (24px radius): a large location input with a map-pin icon and placeholder "Search your area, e.g. Indiranagar, Bengaluru", a secondary "Use my current location" button with a crosshair icon, then a primary teal button "Find care nearby →" and muted text "or pick the kind of help you need below".
4. Section "What kind of help do you need?": a grid of 5 category cards (3 columns desktop, 2 on mobile). Each has a colored icon tile, a title, a one-line description and a small kind badge:
   - Home Nurse (syringe, sky) — "Injections, wound dressing, vitals and post-operative care." — Medical service
   - Physiotherapist (person, sky) — "Pain relief, rehabilitation and mobility sessions." — Medical service
   - Home Lab Collection (test tube, sky) — "Blood and sample collection at home." — Medical service
   - Babysitter / Nanny (baby, fuchsia) — "Background-checked childcare at home." — Childcare — non-medical
   - Caregiver (hand-heart, violet) — "Companionship and daily-living support for elders." — Personal care — non-medical
5. Three trust cards in a row, each with a green icon: "Verified professionals" (badge-check) — "Nurses and physiotherapists show their council registration. Every provider displays their verification status." / "Transparent, itemised pricing" (receipt) — "See the visit fee, medicines, travel, platform fee and tax as separate lines before you confirm." / "Your location stays private" (lock) — "Your address is shared with a provider only after you give consent and confirm a booking."
6. White band "How it works" with 3 numbered teal circles: 1 "Tell us where" — "Search your area or use your current location." 2 "Choose a provider" — "Compare distance, availability, ratings, credentials and prices." 3 "Request a visit" — "Pick a time window, review the full quote and confirm." Below it, small muted disclaimer: "HealNest Bharat connects you with independent providers. It is not an emergency service and does not offer diagnosis or treatment advice. Babysitters and caregivers provide non-medical support only."
7. Footer.
```

---

## Prompt 2 — Discover / search results

```
Search results page "Home Nurse near Indiranagar, Bengaluru" for HealNest Bharat, same design system.

- Header + rose emergency strip.
- Title row: H1 "Home Nurse" + muted " near Indiranagar, Bengaluru"; subtext "Showing providers whose service area covers your location. Distances are approximate." On the right, a compact location bar with the current area and a "Change" button.
- A horizontally scrollable row of pill chips: "All care", "Nurse" (selected, solid teal with white text), "Physio", "Lab tests", "Babysitter", "Caregiver", each with a small icon.
- Two-column layout: a left filter sidebar (272px, white card, title "Filters" with a sliders icon) and results on the right.
  Filters: search input "Search by name or service" (placeholder "e.g. wound dressing"); Sort by (Nearest first / Soonest available / Highest rated / Lowest price); checkbox "Verified providers only"; Availability (Any time this week / Available today / By tomorrow / Within 7 days); Maximum distance (Up to 25 km, 3, 5, 10, 15 km); Starting price (Any, up to ₹500 / ₹800 / ₹1,000 / ₹1,500); Rating (Any / 4.5+ / 4.0+); Language; Provider gender preference (No preference / Female / Male); teal underlined link "Clear all filters".
- Results header: "4 providers available" on the left, "Show map" toggle button on the right (when expanded, show an OpenStreetMap-style map with a blue "You" pin and teal provider pins).
- Provider cards stacked vertically (white, 16px radius). Each card: left, a 64px rounded-square avatar tile in sky blue with initials and a small category icon badge at the bottom-right corner; middle, the name (bold 18px) + green "Verified" pill with a check icon, a muted line "Home Nurse · 8 yrs experience", a sky "Medical service" badge, then a 4-column meta row: map-pin "1.8 km away", amber star "4.8 (126)", clock in green "Next: Today, 4:00 PM", languages "Hindi, English, Kannada", and a tiny muted services line "Injection / IV · Wound dressing · Elderly care"; right, "Visits from" / big bold "₹450" / "+ travel & fees" and a teal "View profile →" link.
  Sample providers: Anjali Verma (Home Nurse, 8 yrs, 1.8 km, 4.8, ₹450), Rahul Nair (Home Nurse, 5 yrs, 3.2 km, 4.6, ₹400), Fatima Sheikh (Home Nurse, 12 yrs, 4.5 km, 4.9, ₹550, "Next: Tomorrow, 9:00 AM"), Deepa Iyer (Home Nurse, 3 yrs, 6.1 km, 4.4, ₹350, grey "Verification pending" amber pill).
- On mobile, the filters collapse into a single "Filters & sorting" row above the results.
```

---

## Prompt 3 — Provider profile

```
Provider profile page for "Anjali Verma", Home Nurse, HealNest Bharat design system. Two columns: main content (left) and a 352px sticky sidebar (right).

Main column (white cards, stacked):
1. Profile card: 96px sky-blue rounded avatar tile with initials "AV" and a syringe badge; H1 "Anjali Verma"; muted "Home Nurse · 8 years experience"; pills "Verified" (green) and "Medical service" (sky); meta row: star "4.8 (126 reviews)", map-pin "Based in Indiranagar, Bengaluru · 1.8 km from you", languages "Hindi, English, Kannada". A short bio paragraph. A sky-tinted notice box with an info icon: "Medical service by a registered professional. Home visits are for non-emergency needs only and follow your doctor's written advice where applicable."
2. "Services & prices" card with subtitle "Visit fees shown. Travel, platform fee and any estimated items appear in the full quote before you confirm." A divided list; each row has the service name, a description, a clock "45 min", optional "+ procedure fee ₹100" and "+ optional medicines ~₹150 (estimate)", then the price on the right and a secondary "Request this" button. Rows: Injection / IV at home ₹450; Wound dressing ₹500; Catheter care ₹650; Post-operative care visit ₹900.
3. "Credentials & verification" card: rows with a green badge-check icon — "B.Sc. Nursing (verified)", "Karnataka State Nursing Council · Reg. no. KSNC••••4821"; one row with a grey shield-question icon "(not yet verified)".
4. "Reviews" card: "4.8 average from 126 reviews", with 3 review tiles on light grey (#F8FAFC): name, "5/5" with a star, comment, date.

Sidebar (stacked cards):
- Big full-width teal button "Request home visit", with muted text below: "You'll see the full price before confirming."
- "Availability" card with a calendar icon: day labels in small uppercase grey (TODAY, TOMORROW, SAT 14 SEP) and small green time chips (10:00 AM, 12:00 PM, 4:00 PM…). Footnote: "Times are arrival windows (IST)."
- "Service area" card: "Visits within 8 km of Indiranagar. Travel fee ₹60." plus a 220px map with a teal radius circle.
- "Cancellation & refunds" card with 2 short paragraphs of muted text.
```

---

## Prompt 4 — Request a home visit (booking form)

```
Booking form page "Request a home visit with Anjali Verma", HealNest Bharat design system. Two columns: a form (left) and a sticky 384px quote summary (right).

Form, as numbered white cards:
1. "Choose a service": radio cards; the selected one has a teal border and #ECFBF8 background. Each shows the name + price on the right, and a description · duration below. (Injection / IV at home ₹450 selected, Wound dressing ₹500, Catheter care ₹650.)
2. "Pick a date & arrival window": hint "Times are in IST. The provider arrives within the chosen 2-hour window." Day labels in small grey uppercase with rows of time-window chips like "10:00 AM – 12:00 PM"; the selected chip is solid teal with white text.
3. "Visit address": area search input with a "Use my location" button; a muted line "1.8 km from the provider · within their 8 km service area."; two inputs side by side: "Label" (Home) and "Full address" (placeholder "House/flat no., building, street, landmark").
4. "What help do you need?": textarea "Short description (optional)" with placeholder "e.g. Prescribed injection, prescription available at home. Elderly patient, ground floor." and a hint "Logistics only — please don't describe symptoms for diagnosis. 0/500". Below it, an amber box with a checkbox: "Provider brings medicines & consumables (estimated ₹15 each)" and small text "Estimate only — the provider confirms the actual cost before the visit. A valid prescription is required for medicines."
5. "Consent & confirmation": two checkboxes — "I agree to share this visit address and my phone number with Anjali Verma for this booking only." and "I have reviewed the itemised price, including estimated items, and the cancellation terms." Small lock-icon note: "No payment is taken now. You pay only after the provider accepts."

Right sidebar, "Your quote" card, subtitle "Preview — the final price is recalculated securely when you confirm." An itemised table:
- Visit fee ₹300
- Procedure fee ₹100 (amber "Estimated" pill)
- Medicines × 1 ₹15 (amber "Estimated" pill), with small text "Original cost ₹10 + platform margin ₹5 = ₹15"
- Travel fee ₹50
- Platform fee ₹49, with small text "HealNest Bharat service fee (platform earnings)"
- Subtotal ₹514 · GST 18% ₹93
- "Estimated total" ₹607 in large extra-bold
Small muted line: "Provider receives ₹460 · Platform earns ₹54 · Tax ₹93". An amber info box: "Items marked "Estimated" are confirmed by the provider before the visit. If the actual cost differs, you will be asked to approve the change — you are never charged silently." A full-width teal button "Confirm request · ₹607".
On mobile, a sticky bottom bar shows "Estimated total ₹607", a "See breakdown" link and a "Confirm request" button.
```

---

## Prompt 5 — Booking details / status tracking

```
Booking details page, HealNest Bharat design system, shown right after a request is sent.

- Header + rose emergency strip.
- A green success banner with a check-circle icon: "Request sent to Anjali Verma" / "You'll be notified when they accept. No payment has been taken. Your price snapshot is saved below."
- Title row: H1 "Booking HB-10427" + an amber "Requested" status pill.
- Two columns.
Left:
  1. Card: "Injection / IV at home", "with Anjali Verma (teal link) · Home Nurse" + a sky "Medical service" pill. A two-column detail list with icons: calendar "Arrival window — Today, 4:00 – 6:00 PM IST"; map-pin "Visit address (Home) — 12, 3rd Cross, Indiranagar · 1.8 km from provider", with small text "Shared with the provider with your consent."; notebook "Your note — Prescribed injection, prescription available at home."
  2. "Status" card with a vertical timeline: Requested (done, teal filled circle with a check, timestamp) → Accepted ("Provider confirmed your visit", current step with a light teal ring) → On the way → Arrived → In progress → Completed (upcoming steps have grey outline circles and hints). Below a divider: a secondary "Contact provider" button and a red outline "Cancel request" button.
Right (sticky):
  - "Price snapshot" card with the same itemised quote table as the booking form (total ₹607), and the footnote "Price snapshot recorded 10 Sep, 3:12 PM. Later pricing changes do not affect this booking."
  - "Cancellation & refunds" card.
Also create a variant with the status "On the way" (teal pill) where the first 3 timeline steps are done.
```

---

## Prompt 6 — My bookings

```
"My bookings" list page, HealNest Bharat design system, with a narrow centered column (max 896px).
H1 "My bookings". A vertical list of white cards (16px radius), each clickable: left, the service name in bold + a muted line "Provider name · date and time window"; right, a status pill + the bold total.
Rows:
- Injection / IV at home — Anjali Verma · Today, 4:00–6:00 PM — amber "Requested" — ₹607
- Physiotherapy session — Karan Mehta · Sat 14 Sep, 10:00 AM–12:00 PM — teal "Accepted" — ₹1,120
- Elderly care (4 hrs) — Sunita Rao · 5 Sep — green "Completed" — ₹1,480
- Home lab collection — Imran Qureshi · 2 Sep — grey "Cancelled" — ₹399
Also show an empty-state variant: a dashed-border card "No bookings yet" with a teal "Find care nearby" button.
```

---

## Prompt 7 — Provider dashboard

```
Provider dashboard for a home nurse on HealNest Bharat, same design system, desktop.
- Teal uppercase eyebrow "PROVIDER DASHBOARD", H1 "Anjali Verma", pills "Verified" + "Medical service". On the right, a "Signed in as provider" dropdown.
- 4 stat cards in a row, each with a teal icon, a big number and a label: "3 New requests" (clipboard), "2 Active visits" (calendar), "₹4,860 Expected payout" (wallet), "₹690 Platform fee & margin" (rupee). Muted footnote: "Payout and platform share cover active and completed visits, from each booking's price snapshot."
- Two columns. Left:
  1. "Incoming requests (3)" card, subtitle "Accept or decline. Customers are notified immediately." Each request row (bordered, 12px radius): service name + amber "Requested" pill, "Today, 4:00–6:00 PM IST", "12, 3rd Cross, Indiranagar · 1.8 km", the customer's note in quotes, and a small payout line "Customer pays ₹607 · your payout ₹460 (green) · platform fee & margin ₹54 · tax ₹93". Actions on the right: a green "Accept" button and a red "Decline" button.
  2. "Active visits (2)" card: same row style with a teal status pill and one next-step button ("Mark on the way", "Mark arrived", "Start visit" or "Complete visit").
  3. "Availability — next 7 days" card: day groups of slot chips — green "10:00 AM · open", sky "12:00 PM · booked", grey strikethrough "4:00 PM · blocked". Below: an inline form with Day, Start (IST) and Window (1 / 2 / 4 hours) dropdowns and a "+ Add slot" button.
  4. "Past & closed" list.
- Right column: a "Service area" card with a map and radius circle, "Based in Indiranagar, Bengaluru", a "Service radius (km)" number input and a "Save radius" button; a "Your services" card with services and prices in a divided list, plus the note "Prices are set with HealNest Bharat admin. Travel fee ₹60."
```

---

## Prompt 8 — Admin operations

```
Admin operations dashboard for HealNest Bharat, same design system, desktop, data-dense but clean.
- Teal eyebrow "ADMIN", H1 "Operations". A row of anchor pills: Providers, Bookings, Pricing & margins, Settings, Categories & services, Audit log.
- 4 stat cards: "24 Providers", "3 Awaiting verification", "57 Bookings", "₹6,480 Platform earnings (live bookings)".
- "Provider verification" card, subtitle "Only verified providers can receive bookings. Every change is written to the audit log." A table with a light grey header (#F8FAFC, small uppercase grey column labels): Provider (teal link + small id), Category (+ kind pill), City, Credentials (small muted lines), Verification (dropdown: Verified / Pending / Unverified / Rejected), Listing (checkbox "Active").
- "Bookings by status" card: count pills (Requested 6, Accepted 4, On the way 1, Arrived 0, In progress 1, Completed 38, Declined 3, Cancelled 4), then a table: Booking ID, Provider / service, Status pill, Total, Payout, Platform, Created.
- "Pricing rules & platform margin" card, subtitle "Margins are always disclosed to customers as separate amounts. Changes apply to new quotes only — booked price snapshots never change." Each rule is a bordered row: rule name + "Applies to: medicine line", a Mode dropdown (Fixed ₹ / Percent %), an Amount input, an "Active" checkbox and a teal "Save" button. Rules: Medicine margin (50%), Platform fee (₹49 fixed), Procedure margin (10%).
- "Country settings" card: inputs for Tax label (GST), Tax rate (18%), Quote validity (30 min), Emergency number (112); "Tax applies to" checkboxes (Visit fee, Procedure fee, Medicines, Travel fee, Platform fee); textareas for Refund policy, Prescription note and Licensing note; a "Save settings" button.
- "Audit log" card: a divided list of rows — timestamp · bold action (e.g. "provider.verification_changed") · "provider P-014 · by admin" · small monospace JSON details.
```

---

## Optional — Mobile versions

```
Create the mobile (390px) version of the previous screen with the same HealNest Bharat design system: a hamburger menu in the header, a single column, full-width buttons, the sidebar content moved below the main content, filters collapsed into a "Filters & sorting" accordion, and (on the booking form) a sticky bottom bar with the total and "Confirm request".
```
