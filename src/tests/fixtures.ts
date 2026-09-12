import { HAPPY_PATH } from "@/lib/booking-status";
import { LOCALITIES } from "@/lib/localities";
import { CANCELLATION_BY_CATEGORY, DEFAULT_PLATFORM_CONFIG, DEFAULT_PRICING_RULES, starterServicesFor } from "@/lib/platform-defaults";
import { calculateQuote } from "@/lib/pricing";
import { createSeedData, type SeedData } from "@/lib/seed";
import type {
  AvailabilitySlot,
  Booking,
  BookingStatus,
  CategoryId,
  Gender,
  ProviderProfile,
  Review,
  Service,
  User,
  VerificationApplication,
  VerificationStatus,
} from "@/types";

// Test-only providers, slots, reviews, bookings and one verification application, on top of the real (empty) seed.
// Ids are fixed so tests can refer to them. Everything here is fictional and never reaches the app.

type FixtureProvider = {
  number: number;
  name: string;
  category: CategoryId;
  gender: Gender;
  localityId: string;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  serviceRadiusKm: number;
  travelFeeMinor: number;
};

const PROVIDERS: FixtureProvider[] = [
  { number: 1, name: "Sunita Rawat", category: "nurse", gender: "female", localityId: "del-cp", verificationStatus: "verified", rating: 4.8, reviewCount: 126, serviceRadiusKm: 12, travelFeeMinor: 5000 },
  { number: 2, name: "Arjun Mehta", category: "nurse", gender: "male", localityId: "del-dwarka", verificationStatus: "verified", rating: 4.6, reviewCount: 64, serviceRadiusKm: 10, travelFeeMinor: 6000 },
  { number: 5, name: "Pooja Negi", category: "babysitter", gender: "female", localityId: "del-lajpat", verificationStatus: "verified", rating: 4.7, reviewCount: 88, serviceRadiusKm: 8, travelFeeMinor: 4000 },
  { number: 7, name: "Ramesh Yadav", category: "caregiver", gender: "male", localityId: "del-rohini", verificationStatus: "verified", rating: 4.6, reviewCount: 57, serviceRadiusKm: 12, travelFeeMinor: 5000 },
  { number: 8, name: "Anjali Thakur", category: "caregiver", gender: "female", localityId: "del-cp", verificationStatus: "unverified", rating: 4.3, reviewCount: 12, serviceRadiusKm: 8, travelFeeMinor: 4000 },
  { number: 9, name: "Priya Nair", category: "nurse", gender: "female", localityId: "mum-andheri", verificationStatus: "verified", rating: 4.9, reviewCount: 187, serviceRadiusKm: 10, travelFeeMinor: 7000 },
  { number: 14, name: "Fatima Ansari", category: "babysitter", gender: "female", localityId: "mum-andheri", verificationStatus: "pending", rating: 4.4, reviewCount: 18, serviceRadiusKm: 6, travelFeeMinor: 4000 },
  { number: 15, name: "Ravi Shankar", category: "physiotherapist", gender: "male", localityId: "blr-jayanagar", verificationStatus: "verified", rating: 4.9, reviewCount: 165, serviceRadiusKm: 12, travelFeeMinor: 6000 },
  { number: 16, name: "Mohit Saini", category: "phlebotomist", gender: "male", localityId: "del-lajpat", verificationStatus: "verified", rating: 4.6, reviewCount: 214, serviceRadiusKm: 15, travelFeeMinor: 0 },
  { number: 17, name: "Rubina Khan", category: "phlebotomist", gender: "female", localityId: "ncr-noida18", verificationStatus: "pending", rating: 4.4, reviewCount: 33, serviceRadiusKm: 12, travelFeeMinor: 0 },
  { number: 18, name: "Naveen Kumar", category: "phlebotomist", gender: "male", localityId: "blr-koramangala", verificationStatus: "verified", rating: 4.7, reviewCount: 241, serviceRadiusKm: 14, travelFeeMinor: 0 },
];

const SLOT_HOURS: Record<CategoryId, number[]> = {
  nurse: [8, 11, 14, 17],
  physiotherapist: [7, 10, 17, 19],
  phlebotomist: [6, 7, 8, 10],
  babysitter: [9, 13, 18],
  caregiver: [8, 12, 16],
};

const REVIEWER_NAMES = ["Neha S.", "Rahul K.", "Aditi P.", "Imran Q."];

/** The customer who made the fixture bookings and reviews. */
export const TEST_CUSTOMER_ID = "user_ctest01";

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
const istDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
const istInstant = (ymd: string, hour: number) => new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00+05:30`);

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + days);
  return istDate(d);
}

/** Offsets providers from locality centres so distances are not all zero. */
function jitter(index: number): { dLat: number; dLng: number } {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.006 + (index % 5) * 0.004;
  return { dLat: Math.sin(angle) * radius, dLng: Math.cos(angle) * radius };
}

export function createTestData(now: Date = new Date()): SeedData {
  const seed = createSeedData(now);
  const createdAt = now.toISOString();
  const users: User[] = [
    ...seed.users,
    { id: TEST_CUSTOMER_ID, name: "Kavya Iyer", email: "customer@example.test", phone: "+91 90000 00001", role: "user", createdAt },
  ];
  const providers: ProviderProfile[] = [];
  const services: Service[] = [];
  const slots: AvailabilitySlot[] = [];
  const reviews: Review[] = [];
  const today = istDate(now);

  for (const fixture of PROVIDERS) {
    const number = String(fixture.number).padStart(2, "0");
    const providerId = `prov_${number}`;
    const userId = `user_prov_${number}`;
    const index = fixture.number - 1;
    const locality = LOCALITIES.find((l) => l.id === fixture.localityId);
    if (!locality) throw new Error(`Unknown locality ${fixture.localityId}`);
    const { dLat, dLng } = jitter(index);
    const verified = fixture.verificationStatus === "verified";

    users.push({ id: userId, name: fixture.name, email: `provider${number}@example.test`, phone: `+91 90000 1${number.padStart(4, "0")}`, role: "provider", createdAt });
    providers.push({
      id: providerId,
      userId,
      name: fixture.name,
      photoUrl: null,
      category: fixture.category,
      gender: fixture.gender,
      languages: ["Hindi", "English"],
      bio: `Test ${fixture.category} based in ${locality.name}.`,
      yearsExperience: 6,
      credentials: [{ label: "Registration", issuer: "Test council", reference: `TEST-${number}`, verified }],
      verificationStatus: fixture.verificationStatus,
      rating: fixture.rating,
      reviewCount: fixture.reviewCount,
      serviceRadiusKm: fixture.serviceRadiusKm,
      baseLocation: {
        latitude: round5(locality.latitude + dLat),
        longitude: round5(locality.longitude + dLng),
        locality: locality.name,
        city: locality.city,
      },
      travelFeeMinor: fixture.travelFeeMinor,
      cancellationPolicy: CANCELLATION_BY_CATEGORY[fixture.category],
      active: true,
    });
    services.push(...starterServicesFor(fixture.category, providerId));

    SLOT_HOURS[fixture.category].forEach((hour, hourIndex) => {
      for (let day = 0; day < 7; day++) {
        const ymd = addDays(today, day);
        const start = istInstant(ymd, hour);
        // Deterministic mix of open / booked / blocked slots.
        const pattern = (index + day * 3 + hourIndex) % 7;
        const status = pattern === 0 ? "booked" : pattern === 3 && day > 0 ? "blocked" : "open";
        slots.push({
          id: `slot_${number}_${ymd.replace(/-/g, "")}_${String(hour).padStart(2, "0")}`,
          providerId,
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + 2 * 3600 * 1000).toISOString(),
          status,
          capacity: 1,
          bookedCount: status === "booked" ? 1 : 0,
        });
      }
    });

    for (let r = 0; r < 3; r++) {
      reviews.push({
        id: `rev_${number}_${r + 1}`,
        bookingId: null,
        userId: TEST_CUSTOMER_ID,
        providerId,
        authorName: REVIEWER_NAMES[(index + r) % REVIEWER_NAMES.length],
        rating: r === 2 && fixture.rating < 4.7 ? 4 : 5,
        aspects: { punctuality: r === 1 ? 4 : 5, communication: 5, courtesy: 5, value: (index + r) % 3 === 0 ? 4 : 5 },
        wouldRecommend: r === 2 && fixture.rating < 4.5 ? null : true,
        comment: "Punctual and professional.",
        createdAt: new Date(now.getTime() - (r + 1) * 9 * 24 * 3600 * 1000).toISOString(),
      });
    }
  }

  return {
    ...seed,
    users,
    providers,
    services,
    slots,
    reviews,
    bookings: createBookings(now, providers, services),
    verificationApplications: createApplications(now, users),
  };
}

/** bk_demo_1…5: requested, accepted and completed visits for prov_01, plus one each for prov_05 and prov_09. */
function createBookings(now: Date, providers: ProviderProfile[], services: Service[]): Booking[] {
  const samples: Array<{ providerId: string; serviceIndex: number; status: BookingStatus; dayOffset: number; notes: string }> = [
    { providerId: "prov_01", serviceIndex: 0, status: "REQUESTED", dayOffset: 1, notes: "Prescribed injection, prescription available at home." },
    { providerId: "prov_01", serviceIndex: 2, status: "ACCEPTED", dayOffset: 2, notes: "Weekly vitals check for my grandmother." },
    { providerId: "prov_01", serviceIndex: 1, status: "COMPLETED", dayOffset: -3, notes: "Dressing change as advised by surgeon." },
    { providerId: "prov_05", serviceIndex: 0, status: "REQUESTED", dayOffset: 1, notes: "Two kids, ages 3 and 6." },
    { providerId: "prov_09", serviceIndex: 2, status: "CANCELLED", dayOffset: 2, notes: "Routine vitals check." },
  ];

  return samples.map((sample, i) => {
    const provider = providers.find((p) => p.id === sample.providerId)!;
    const service = services.filter((s) => s.providerId === provider.id)[sample.serviceIndex];
    const start = new Date(now.getTime() + sample.dayOffset * 24 * 3600 * 1000);
    start.setUTCMinutes(0, 0, 0);
    const bookingId = `bk_demo_${i + 1}`;
    const createdAt = new Date(
      Math.min(now.getTime() - (samples.length - i) * 3600 * 1000, start.getTime() - 24 * 3600 * 1000),
    ).toISOString();
    const quote = calculateQuote({
      service,
      provider,
      rules: DEFAULT_PRICING_RULES,
      config: DEFAULT_PLATFORM_CONFIG,
      includeMedicine: service.medicineEstimateMinor > 0,
      bookingId,
      quoteId: `q_demo_${i + 1}`,
      now: new Date(createdAt),
    });
    const history: Booking["statusHistory"] = [{ status: "REQUESTED", at: createdAt, by: "user" }];
    for (const status of HAPPY_PATH.slice(1, HAPPY_PATH.indexOf(sample.status) + 1)) {
      history.push({ status, at: status === "ACCEPTED" ? createdAt : start.toISOString(), by: "provider" });
    }
    if (sample.status === "CANCELLED") history.push({ status: "CANCELLED", at: createdAt, by: "user" });

    return {
      id: bookingId,
      userId: TEST_CUSTOMER_ID,
      providerId: provider.id,
      serviceId: service.id,
      providerName: provider.name,
      serviceName: service.name,
      category: provider.category,
      address: {
        label: "Home",
        addressText: `Flat 12B, Demo Residency, ${provider.baseLocation.locality}, ${provider.baseLocation.city}`,
        latitude: provider.baseLocation.latitude + 0.01,
        longitude: provider.baseLocation.longitude + 0.01,
        consentToShare: true,
      },
      scheduledStart: start.toISOString(),
      scheduledEnd: new Date(start.getTime() + service.durationMinutes * 60_000).toISOString(),
      slotId: null,
      status: sample.status,
      notes: sample.notes,
      distanceKm: 1.5,
      quote,
      totalAmountMinor: quote.totalMinor,
      statusHistory: history,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

/** vapp_demo_2: a nanny (prov_14) waiting in the admin verification queue. */
function createApplications(now: Date, users: User[]): VerificationApplication[] {
  const user = users.find((u) => u.id === "user_prov_14")!;
  return [
    {
      id: "vapp_demo_2",
      providerId: "prov_14",
      category: "babysitter",
      status: "submitted",
      details: {
        fullName: "Fatima Ansari",
        phone: user.phone,
        email: user.email,
        addressText: "Room 3, Gulmohar Chawl, Andheri East, Mumbai",
        city: "Mumbai",
        languages: ["Hindi", "Urdu", "English"],
        yearsExperience: 3,
        govtIdType: "voter_id",
        govtIdLast4: "7Q2K",
        photoUrl: null,
        registrationNumber: "",
        registrationCouncil: "",
        qualifications: [{ degree: "Paediatric first aid & CPR", institution: "Certified training partner", year: 2024 }],
        employments: [
          {
            organisation: "Little Steps Day Care",
            role: "Nanny",
            city: "Mumbai",
            current: true,
            startYear: 2024,
            endYear: null,
            contactName: "Meera Joshi",
            contactPhone: "+91 98200 41122",
          },
          {
            organisation: "Sharma family, Powai",
            role: "Live-out babysitter",
            city: "Mumbai",
            current: false,
            startYear: 2022,
            endYear: 2024,
            contactName: "",
            contactPhone: "",
          },
        ],
        policeVerificationRef: "TEST-MPV-20931",
      },
      documents: [
        { kind: "photo_id", fileName: "voter-id.jpg", sizeBytes: 312_000, contentType: "image/jpeg" },
        { kind: "police", fileName: "police-verification.pdf", sizeBytes: 380_000, contentType: "application/pdf" },
        { kind: "training", fileName: "first-aid-certificate.pdf", sizeBytes: 220_000, contentType: "application/pdf" },
      ],
      submittedAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      reviewedAt: null,
      reviewerNote: "",
    },
  ];
}
