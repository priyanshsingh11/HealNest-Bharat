import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { LOCALITIES, type Locality } from "@/lib/localities";
import { calculateQuote } from "@/lib/pricing";
import type {
  AvailabilitySlot,
  Booking,
  BookingStatus,
  Category,
  CategoryId,
  Credential,
  Gender,
  PlatformConfig,
  PricingRule,
  ProviderProfile,
  Review,
  Service,
  User,
  VerificationStatus,
} from "@/types";

// Typed seed data. Used directly by the in-memory repository and by `npm run db:seed` for Supabase.
// Everything is fictional: names, registration numbers and reviews are for demo purposes only.

export const DEMO_USER_ID = "user_demo";
export const DEMO_ADMIN_ID = "admin_demo";
export const DEMO_PROVIDER_ID = "prov_01";

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  country: "IN",
  currency: "INR",
  taxLabel: "GST",
  taxRateBps: 1800,
  // Configurable — default applies tax to the platform fee only. Confirm with a tax advisor before launch.
  taxAppliesTo: ["platform_fee"],
  quoteValidityMinutes: 30,
  refundPolicy:
    "Free cancellation until the provider accepts. After acceptance, cancellations more than 2 hours before the visit are fully refunded; later cancellations may incur the travel fee.",
  prescriptionRequiredForMedicine: true,
  prescriptionNote:
    "Prescription medicines are only administered against a valid prescription from a registered medical practitioner.",
  licensingNote:
    "Doctors and nurses are listed with their state council registration. Verification is performed by HealNest Bharat staff before a profile is marked verified.",
  emergencyNumber: "112",
};

export const DEFAULT_PRICING_RULES: PricingRule[] = [
  { id: "rule_visit", itemType: "visit", label: "Visit margin", mode: "fixed", value: 0, active: true },
  { id: "rule_medicine", itemType: "medicine", label: "Medicine service margin", mode: "percent", value: 1000, active: true },
  { id: "rule_procedure", itemType: "procedure", label: "Procedure margin", mode: "fixed", value: 0, active: true },
  { id: "rule_travel", itemType: "travel", label: "Travel margin", mode: "fixed", value: 0, active: true },
  { id: "rule_platform", itemType: "platform_fee", label: "Platform fee", mode: "fixed", value: 4900, active: true },
];

type ServiceTemplate = Omit<Service, "id" | "providerId" | "category" | "active">;

const SERVICE_TEMPLATES: Record<CategoryId, ServiceTemplate[]> = {
  nurse: [
    {
      name: "Injection administration",
      careService: "injection-iv",
      description: "Administering a prescribed injection at home. A valid prescription is required.",
      basePriceMinor: 30000,
      durationMinutes: 30,
      requiresConfirmation: true,
      medicineEstimateMinor: 1000,
      procedureFeeMinor: 10000,
    },
    {
      name: "Wound dressing",
      careService: "wound-dressing",
      description: "Cleaning and dressing of an existing wound as advised by your doctor.",
      basePriceMinor: 40000,
      durationMinutes: 45,
      requiresConfirmation: true,
      medicineEstimateMinor: 15000,
      procedureFeeMinor: 25000,
    },
    {
      name: "Vitals check & monitoring",
      careService: "home-nursing",
      description: "Blood pressure, pulse, temperature, SpO₂ and blood sugar readings, recorded for your doctor.",
      basePriceMinor: 50000,
      durationMinutes: 60,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Post-operative care visit (4 hr)",
      careService: "post-operative-care",
      description: "Hands-on nursing support at home after discharge, following the hospital's care plan.",
      basePriceMinor: 180000,
      durationMinutes: 240,
      requiresConfirmation: true,
      medicineEstimateMinor: 20000,
      procedureFeeMinor: 0,
    },
    // Appended after the original four so existing service ids (svc_NN_1…4) stay stable.
    {
      name: "IV infusion / drip at home",
      careService: "injection-iv",
      description: "Setting up and monitoring a prescribed IV drip or infusion. A valid prescription is required.",
      basePriceMinor: 60000,
      durationMinutes: 90,
      requiresConfirmation: true,
      medicineEstimateMinor: 30000,
      procedureFeeMinor: 20000,
    },
    {
      name: "Urinary catheter care",
      careService: "catheter-care",
      description: "Catheter insertion, change or removal on your doctor's advice, with bag and hygiene care.",
      basePriceMinor: 50000,
      durationMinutes: 45,
      requiresConfirmation: true,
      medicineEstimateMinor: 25000,
      procedureFeeMinor: 20000,
    },
    {
      name: "Home nursing shift (12 hr)",
      careService: "home-nursing",
      description: "Day or night nursing shift for patients who need continuous care, following your doctor's care plan.",
      basePriceMinor: 250000,
      durationMinutes: 720,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
  doctor: [
    {
      name: "Home consultation — general physician",
      careService: null,
      description: "Non-emergency consultation at home. Not for life-threatening situations.",
      basePriceMinor: 80000,
      durationMinutes: 30,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Follow-up home consultation",
      careService: null,
      description: "Follow-up visit for an ongoing, non-emergency concern.",
      basePriceMinor: 60000,
      durationMinutes: 20,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Elderly home check-up",
      careService: "elderly-care",
      description: "Routine, non-emergency check-up for seniors who find travel difficult.",
      basePriceMinor: 100000,
      durationMinutes: 45,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
  physiotherapist: [
    {
      name: "Physiotherapy session (45 min)",
      careService: "physiotherapy",
      description: "Assessment and a tailored exercise and therapy session at home.",
      basePriceMinor: 70000,
      durationMinutes: 45,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Back, neck & joint pain therapy",
      careService: "physiotherapy",
      description: "Manual therapy, exercises and posture advice for back, neck, knee and shoulder pain.",
      basePriceMinor: 80000,
      durationMinutes: 60,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Post-surgery rehabilitation (60 min)",
      careService: "post-operative-care",
      description: "Rehab after knee or hip replacement, fractures or spine surgery, following your surgeon's protocol.",
      basePriceMinor: 90000,
      durationMinutes: 60,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Stroke & neuro rehabilitation (60 min)",
      careService: "physiotherapy",
      description: "Mobility, balance and strength training after a stroke or for neurological conditions.",
      basePriceMinor: 100000,
      durationMinutes: 60,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
  phlebotomist: [
    {
      name: "Blood sample collection",
      careService: "home-lab-collection",
      description: "Home collection for blood tests your doctor has requested. Lab test charges are billed separately by the partner lab.",
      basePriceMinor: 20000,
      durationMinutes: 20,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Health check-up package collection",
      careService: "home-lab-collection",
      description: "Fasting blood and urine collection for a full-body check-up. Lab test charges are billed separately by the partner lab.",
      basePriceMinor: 30000,
      durationMinutes: 30,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Urine / stool sample pickup",
      careService: "home-lab-collection",
      description: "Pickup of a urine or stool sample in a lab-provided container. Lab test charges are billed separately.",
      basePriceMinor: 15000,
      durationMinutes: 15,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
  babysitter: [
    {
      name: "Babysitting (4 hours)",
      careService: null,
      description: "Supervised play, meals and nap-time care for children at home.",
      basePriceMinor: 80000,
      durationMinutes: 240,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Evening babysitting (3 hours)",
      careService: null,
      description: "Evening childcare including dinner and bedtime routine.",
      basePriceMinor: 65000,
      durationMinutes: 180,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Full-day nanny (9 hours)",
      careService: null,
      description: "Full-day childcare while parents are at work.",
      basePriceMinor: 160000,
      durationMinutes: 540,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
  caregiver: [
    {
      name: "Elder companion care (4 hours)",
      careService: "elderly-care",
      description: "Companionship, conversation, reading and light assistance. Non-medical.",
      basePriceMinor: 90000,
      durationMinutes: 240,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Mobility & daily-living assistance (2 hours)",
      careService: "elderly-care",
      description: "Help with walking, bathing, dressing and meals. Non-medical.",
      basePriceMinor: 60000,
      durationMinutes: 120,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
    {
      name: "Day caregiver (8 hours)",
      careService: "elderly-care",
      description: "Full-day non-medical support for an elder or a person with a disability.",
      basePriceMinor: 150000,
      durationMinutes: 480,
      requiresConfirmation: false,
      medicineEstimateMinor: 0,
      procedureFeeMinor: 0,
    },
  ],
};

type ProviderSeed = {
  name: string;
  category: CategoryId;
  gender: Gender;
  languages: string[];
  yearsExperience: number;
  localityId: string;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewCount: number;
  serviceRadiusKm: number;
  travelFeeMinor: number;
  /** Price multiplier in percent applied to service templates. */
  priceFactor: number;
};

const PROVIDER_SEEDS: ProviderSeed[] = [
  // Delhi NCR
  { name: "Sunita Rawat", category: "nurse", gender: "female", languages: ["Hindi", "English"], yearsExperience: 9, localityId: "del-cp", verificationStatus: "verified", rating: 4.8, reviewCount: 126, serviceRadiusKm: 12, travelFeeMinor: 5000, priceFactor: 100 },
  { name: "Arjun Mehta", category: "nurse", gender: "male", languages: ["Hindi", "English", "Punjabi"], yearsExperience: 5, localityId: "del-dwarka", verificationStatus: "verified", rating: 4.6, reviewCount: 64, serviceRadiusKm: 10, travelFeeMinor: 6000, priceFactor: 95 },
  { name: "Dr. Kavita Suri", category: "doctor", gender: "female", languages: ["Hindi", "English"], yearsExperience: 14, localityId: "del-saket", verificationStatus: "verified", rating: 4.9, reviewCount: 212, serviceRadiusKm: 15, travelFeeMinor: 10000, priceFactor: 110 },
  { name: "Dr. Rohit Bansal", category: "doctor", gender: "male", languages: ["Hindi", "English"], yearsExperience: 8, localityId: "ncr-noida18", verificationStatus: "pending", rating: 4.5, reviewCount: 38, serviceRadiusKm: 10, travelFeeMinor: 8000, priceFactor: 100 },
  { name: "Pooja Negi", category: "babysitter", gender: "female", languages: ["Hindi", "English"], yearsExperience: 6, localityId: "del-lajpat", verificationStatus: "verified", rating: 4.7, reviewCount: 88, serviceRadiusKm: 8, travelFeeMinor: 4000, priceFactor: 100 },
  { name: "Meenakshi Joshi", category: "babysitter", gender: "female", languages: ["Hindi", "Garhwali"], yearsExperience: 11, localityId: "ncr-dlf3", verificationStatus: "verified", rating: 4.9, reviewCount: 143, serviceRadiusKm: 10, travelFeeMinor: 5000, priceFactor: 115 },
  { name: "Ramesh Yadav", category: "caregiver", gender: "male", languages: ["Hindi", "Bhojpuri"], yearsExperience: 7, localityId: "del-rohini", verificationStatus: "verified", rating: 4.6, reviewCount: 57, serviceRadiusKm: 12, travelFeeMinor: 5000, priceFactor: 95 },
  { name: "Anjali Thakur", category: "caregiver", gender: "female", languages: ["Hindi", "English"], yearsExperience: 4, localityId: "del-cp", verificationStatus: "unverified", rating: 4.3, reviewCount: 12, serviceRadiusKm: 8, travelFeeMinor: 4000, priceFactor: 90 },
  // Mumbai
  { name: "Priya Nair", category: "nurse", gender: "female", languages: ["Marathi", "Hindi", "English", "Malayalam"], yearsExperience: 12, localityId: "mum-andheri", verificationStatus: "verified", rating: 4.9, reviewCount: 187, serviceRadiusKm: 10, travelFeeMinor: 7000, priceFactor: 110 },
  { name: "Sachin Patil", category: "nurse", gender: "male", languages: ["Marathi", "Hindi"], yearsExperience: 6, localityId: "mum-thane", verificationStatus: "verified", rating: 4.5, reviewCount: 49, serviceRadiusKm: 12, travelFeeMinor: 6000, priceFactor: 95 },
  { name: "Dr. Farah Shaikh", category: "doctor", gender: "female", languages: ["Hindi", "English", "Urdu", "Marathi"], yearsExperience: 16, localityId: "mum-bandra", verificationStatus: "verified", rating: 4.8, reviewCount: 240, serviceRadiusKm: 12, travelFeeMinor: 12000, priceFactor: 125 },
  { name: "Dr. Vikram Desai", category: "doctor", gender: "male", languages: ["Gujarati", "Hindi", "English"], yearsExperience: 10, localityId: "mum-powai", verificationStatus: "verified", rating: 4.7, reviewCount: 131, serviceRadiusKm: 10, travelFeeMinor: 10000, priceFactor: 115 },
  { name: "Rekha Kamble", category: "babysitter", gender: "female", languages: ["Marathi", "Hindi"], yearsExperience: 8, localityId: "mum-dadar", verificationStatus: "verified", rating: 4.8, reviewCount: 96, serviceRadiusKm: 8, travelFeeMinor: 5000, priceFactor: 105 },
  { name: "Fatima Ansari", category: "babysitter", gender: "female", languages: ["Hindi", "Urdu", "English"], yearsExperience: 3, localityId: "mum-andheri", verificationStatus: "pending", rating: 4.4, reviewCount: 18, serviceRadiusKm: 6, travelFeeMinor: 4000, priceFactor: 95 },
  { name: "Joseph D'Souza", category: "caregiver", gender: "male", languages: ["Konkani", "English", "Hindi"], yearsExperience: 9, localityId: "mum-bandra", verificationStatus: "verified", rating: 4.7, reviewCount: 72, serviceRadiusKm: 10, travelFeeMinor: 6000, priceFactor: 110 },
  { name: "Lata Shinde", category: "caregiver", gender: "female", languages: ["Marathi", "Hindi"], yearsExperience: 13, localityId: "mum-powai", verificationStatus: "verified", rating: 4.9, reviewCount: 158, serviceRadiusKm: 10, travelFeeMinor: 5000, priceFactor: 105 },
  // Bengaluru
  { name: "Lakshmi Reddy", category: "nurse", gender: "female", languages: ["Telugu", "Kannada", "English"], yearsExperience: 10, localityId: "blr-koramangala", verificationStatus: "verified", rating: 4.8, reviewCount: 142, serviceRadiusKm: 10, travelFeeMinor: 6000, priceFactor: 105 },
  { name: "Thomas Mathew", category: "nurse", gender: "male", languages: ["Malayalam", "English", "Kannada"], yearsExperience: 7, localityId: "blr-whitefield", verificationStatus: "verified", rating: 4.6, reviewCount: 71, serviceRadiusKm: 14, travelFeeMinor: 7000, priceFactor: 100 },
  { name: "Dr. Ananya Rao", category: "doctor", gender: "female", languages: ["Kannada", "English", "Hindi"], yearsExperience: 12, localityId: "blr-indiranagar", verificationStatus: "verified", rating: 4.9, reviewCount: 198, serviceRadiusKm: 12, travelFeeMinor: 10000, priceFactor: 120 },
  { name: "Dr. Karthik Iyer", category: "doctor", gender: "male", languages: ["Tamil", "English", "Kannada"], yearsExperience: 6, localityId: "blr-jayanagar", verificationStatus: "verified", rating: 4.6, reviewCount: 83, serviceRadiusKm: 10, travelFeeMinor: 8000, priceFactor: 100 },
  { name: "Shalini Gowda", category: "babysitter", gender: "female", languages: ["Kannada", "English"], yearsExperience: 7, localityId: "blr-hsr", verificationStatus: "verified", rating: 4.8, reviewCount: 104, serviceRadiusKm: 8, travelFeeMinor: 5000, priceFactor: 110 },
  { name: "Divya Menon", category: "babysitter", gender: "female", languages: ["Malayalam", "English", "Hindi"], yearsExperience: 4, localityId: "blr-koramangala", verificationStatus: "verified", rating: 4.5, reviewCount: 36, serviceRadiusKm: 7, travelFeeMinor: 4000, priceFactor: 100 },
  { name: "Manjunath K", category: "caregiver", gender: "male", languages: ["Kannada", "Tamil"], yearsExperience: 11, localityId: "blr-malleshwaram", verificationStatus: "verified", rating: 4.7, reviewCount: 91, serviceRadiusKm: 12, travelFeeMinor: 5000, priceFactor: 100 },
  { name: "Selvi Murugan", category: "caregiver", gender: "female", languages: ["Tamil", "Kannada", "English"], yearsExperience: 5, localityId: "blr-indiranagar", verificationStatus: "pending", rating: 4.4, reviewCount: 22, serviceRadiusKm: 9, travelFeeMinor: 4500, priceFactor: 95 },
  // Physiotherapists and home lab collection — appended so existing provider ids stay stable.
  { name: "Neeraj Chauhan", category: "physiotherapist", gender: "male", languages: ["Hindi", "English"], yearsExperience: 8, localityId: "del-saket", verificationStatus: "verified", rating: 4.8, reviewCount: 97, serviceRadiusKm: 12, travelFeeMinor: 6000, priceFactor: 100 },
  { name: "Simran Kaur", category: "physiotherapist", gender: "female", languages: ["Punjabi", "Hindi", "English"], yearsExperience: 6, localityId: "ncr-dlf3", verificationStatus: "verified", rating: 4.7, reviewCount: 61, serviceRadiusKm: 10, travelFeeMinor: 5000, priceFactor: 105 },
  { name: "Mohit Saini", category: "phlebotomist", gender: "male", languages: ["Hindi"], yearsExperience: 5, localityId: "del-lajpat", verificationStatus: "verified", rating: 4.6, reviewCount: 214, serviceRadiusKm: 15, travelFeeMinor: 0, priceFactor: 100 },
  { name: "Rubina Khan", category: "phlebotomist", gender: "female", languages: ["Hindi", "Urdu", "English"], yearsExperience: 4, localityId: "ncr-noida18", verificationStatus: "pending", rating: 4.4, reviewCount: 33, serviceRadiusKm: 12, travelFeeMinor: 0, priceFactor: 100 },
  { name: "Aditya Kulkarni", category: "physiotherapist", gender: "male", languages: ["Marathi", "Hindi", "English"], yearsExperience: 10, localityId: "mum-andheri", verificationStatus: "verified", rating: 4.8, reviewCount: 119, serviceRadiusKm: 10, travelFeeMinor: 7000, priceFactor: 110 },
  { name: "Neha Bhosale", category: "physiotherapist", gender: "female", languages: ["Marathi", "Hindi", "English"], yearsExperience: 5, localityId: "mum-thane", verificationStatus: "verified", rating: 4.6, reviewCount: 44, serviceRadiusKm: 12, travelFeeMinor: 6000, priceFactor: 95 },
  { name: "Santosh Jadhav", category: "phlebotomist", gender: "male", languages: ["Marathi", "Hindi"], yearsExperience: 7, localityId: "mum-dadar", verificationStatus: "verified", rating: 4.7, reviewCount: 302, serviceRadiusKm: 12, travelFeeMinor: 0, priceFactor: 100 },
  { name: "Maria Fernandes", category: "phlebotomist", gender: "female", languages: ["English", "Konkani", "Hindi"], yearsExperience: 6, localityId: "mum-powai", verificationStatus: "verified", rating: 4.8, reviewCount: 176, serviceRadiusKm: 10, travelFeeMinor: 0, priceFactor: 100 },
  { name: "Ravi Shankar", category: "physiotherapist", gender: "male", languages: ["Kannada", "Tamil", "English"], yearsExperience: 12, localityId: "blr-jayanagar", verificationStatus: "verified", rating: 4.9, reviewCount: 165, serviceRadiusKm: 12, travelFeeMinor: 6000, priceFactor: 110 },
  { name: "Aishwarya Hegde", category: "physiotherapist", gender: "female", languages: ["Kannada", "English", "Hindi"], yearsExperience: 4, localityId: "blr-hsr", verificationStatus: "unverified", rating: 4.3, reviewCount: 14, serviceRadiusKm: 8, travelFeeMinor: 5000, priceFactor: 90 },
  { name: "Naveen Kumar", category: "phlebotomist", gender: "male", languages: ["Kannada", "Telugu", "English"], yearsExperience: 6, localityId: "blr-koramangala", verificationStatus: "verified", rating: 4.7, reviewCount: 241, serviceRadiusKm: 14, travelFeeMinor: 0, priceFactor: 100 },
  { name: "Kavya Shetty", category: "phlebotomist", gender: "female", languages: ["Kannada", "Tulu", "English"], yearsExperience: 3, localityId: "blr-whitefield", verificationStatus: "verified", rating: 4.5, reviewCount: 58, serviceRadiusKm: 12, travelFeeMinor: 0, priceFactor: 100 },
];

const STATE_COUNCIL: Record<string, { medical: string; nursing: string }> = {
  "New Delhi": { medical: "Delhi Medical Council", nursing: "Delhi Nursing Council" },
  Noida: { medical: "Uttar Pradesh Medical Council", nursing: "UP Nurses & Midwives Council" },
  Gurugram: { medical: "Haryana Medical Council", nursing: "Haryana Nurses & Nurse-Midwives Council" },
  Mumbai: { medical: "Maharashtra Medical Council", nursing: "Maharashtra Nursing Council" },
  Thane: { medical: "Maharashtra Medical Council", nursing: "Maharashtra Nursing Council" },
  Bengaluru: { medical: "Karnataka Medical Council", nursing: "Karnataka State Nursing Council" },
};

function credentialsFor(seed: ProviderSeed, locality: Locality, index: number): Credential[] {
  const verified = seed.verificationStatus === "verified";
  const council = STATE_COUNCIL[locality.city] ?? { medical: "State Medical Council", nursing: "State Nursing Council" };
  const ref = `DEMO-${String(40210 + index * 137).padStart(6, "0")}`;
  switch (seed.category) {
    case "doctor":
      return [
        { label: "MBBS", issuer: "Recognised medical college (demo)", verified },
        { label: "Medical registration", issuer: council.medical, reference: ref, verified },
      ];
    case "nurse":
      return [
        { label: index % 2 ? "GNM Diploma" : "B.Sc Nursing", issuer: "Recognised nursing institute (demo)", verified },
        { label: "Nurse registration", issuer: council.nursing, reference: ref, verified },
      ];
    case "physiotherapist":
      return [
        { label: "BPT (Bachelor of Physiotherapy)", issuer: "Recognised physiotherapy college (demo)", verified },
        { label: "Physiotherapy registration", issuer: "State physiotherapy council (demo)", reference: ref, verified },
      ];
    case "phlebotomist":
      return [
        { label: "DMLT (Diploma in Medical Lab Technology)", issuer: "Recognised paramedical institute (demo)", verified },
        { label: "Partner lab affiliation", issuer: "NABL-accredited partner lab (demo)", verified },
        { label: "Police verification", issuer: "Local police (demo)", verified },
      ];
    case "babysitter":
      return [
        { label: "Police verification", issuer: "Local police (demo)", verified },
        { label: "Paediatric first aid & CPR", issuer: "Certified training partner (demo)", verified },
      ];
    case "caregiver":
      return [
        { label: "Police verification", issuer: "Local police (demo)", verified },
        { label: "Elder-care training", issuer: "Certified training partner (demo)", verified },
      ];
  }
}

function bioFor(seed: ProviderSeed, locality: Locality): string {
  const years = `${seed.yearsExperience} years`;
  switch (seed.category) {
    case "doctor":
      return `General physician with ${years} of experience offering non-emergency home consultations around ${locality.name}. For emergencies, please call emergency services.`;
    case "nurse":
      return `Registered nurse with ${years} of hospital and home-care experience around ${locality.name}. Follows your doctor's written care plan.`;
    case "physiotherapist":
      return `Physiotherapist with ${years} of experience in pain management and rehabilitation, visiting homes around ${locality.name}.`;
    case "phlebotomist":
      return `Trained phlebotomist with ${years} of experience in safe, hygienic home sample collection around ${locality.name}. Samples go to a partner lab.`;
    case "babysitter":
      return `Warm, background-checked childcare provider with ${years} of experience caring for infants and young children around ${locality.name}.`;
    case "caregiver":
      return `Patient, trained caregiver with ${years} of experience supporting elders with companionship and daily living around ${locality.name}. Non-medical care only.`;
  }
}

const CANCELLATION_BY_CATEGORY: Record<CategoryId, string> = {
  nurse: "Free cancellation up to 2 hours before the visit. Later cancellations may be charged the travel fee.",
  doctor: "Free cancellation up to 2 hours before the visit. Later cancellations may be charged the travel fee.",
  physiotherapist: "Free cancellation up to 2 hours before the session. Later cancellations may be charged the travel fee.",
  phlebotomist: "Free cancellation up to 1 hour before the collection window.",
  babysitter: "Free cancellation up to 6 hours before the booking. Later cancellations may be charged 1 hour of care.",
  caregiver: "Free cancellation up to 6 hours before the booking. Later cancellations may be charged the travel fee.",
};

/** Round to the nearest ₹10 so seeded prices look natural. */
const roundTo10Rupees = (minor: number) => Math.round(minor / 1000) * 1000;

/** Offsets providers from locality centres so distances are not all zero. */
function jitter(index: number): { dLat: number; dLng: number } {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.006 + (index % 5) * 0.004;
  return { dLat: Math.sin(angle) * radius, dLng: Math.cos(angle) * radius };
}

const SLOT_HOURS: Record<CategoryId, number[]> = {
  nurse: [8, 11, 14, 17],
  doctor: [9, 12, 16, 19],
  physiotherapist: [7, 10, 17, 19],
  // Early windows suit fasting blood tests.
  phlebotomist: [6, 7, 8, 10],
  babysitter: [9, 13, 18],
  caregiver: [8, 12, 16],
};

/** IST calendar date (YYYY-MM-DD) for a given instant. */
function istDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

function istInstant(ymd: string, hour: number): Date {
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00+05:30`);
}

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  d.setUTCDate(d.getUTCDate() + days);
  return istDate(d);
}

const REVIEW_COMMENTS: Record<CategoryId, string[]> = {
  nurse: [
    "Arrived on time and was very gentle with my father.",
    "Professional, explained everything she was doing, and kept the area clean.",
    "Polite and punctual. Followed the doctor's written plan exactly.",
    "Made my mother comfortable. Will book again.",
  ],
  doctor: [
    "Very patient and listened carefully. Saved us a difficult trip to the clinic.",
    "Punctual and courteous. Clear about when to go to a hospital instead.",
    "Great bedside manner with my grandmother.",
    "Unhurried visit and helpful follow-up.",
  ],
  physiotherapist: [
    "My knee pain has improved a lot after a few sessions.",
    "Explained every exercise clearly and was very encouraging.",
    "Helped my father walk confidently again after his surgery.",
    "Punctual and professional. Sessions were well planned.",
  ],
  phlebotomist: [
    "Painless blood draw, done in five minutes.",
    "Came early for the fasting test as promised.",
    "Very hygienic — opened a fresh kit in front of us.",
    "Polite, quick and on time. Smooth experience.",
  ],
  babysitter: [
    "Our kids loved her! Very attentive and kind.",
    "Reliable and calm. Sent us updates every hour.",
    "Great with our toddler and followed our routine perfectly.",
    "Trustworthy and fun. Highly recommended.",
  ],
  caregiver: [
    "Very respectful and patient with my grandfather.",
    "Helped with walks and meals, and was great company.",
    "Kind and dependable. Our family feels at ease.",
    "Always on time and very caring.",
  ],
};

const REVIEWER_NAMES = ["Neha S.", "Rahul K.", "Aditi P.", "Imran Q.", "Sneha R.", "Vivek M.", "Harpreet G.", "Deepa N."];

export type SeedData = {
  categories: Category[];
  users: User[];
  providers: ProviderProfile[];
  services: Service[];
  slots: AvailabilitySlot[];
  reviews: Review[];
  pricingRules: PricingRule[];
  config: PlatformConfig;
  bookings: Booking[];
};

export function createSeedData(now: Date = new Date()): SeedData {
  const createdAt = new Date(now.getTime() - 90 * 24 * 3600 * 1000).toISOString();
  const users: User[] = [
    { id: DEMO_USER_ID, name: "Aarav Sharma", email: "aarav.demo@example.com", phone: "+91 90000 00001", role: "user", createdAt },
    { id: DEMO_ADMIN_ID, name: "HealNest Admin", email: "admin.demo@example.com", phone: "+91 90000 00002", role: "admin", createdAt },
  ];
  const providers: ProviderProfile[] = [];
  const services: Service[] = [];
  const slots: AvailabilitySlot[] = [];
  const reviews: Review[] = [];

  const today = istDate(now);

  PROVIDER_SEEDS.forEach((seed, index) => {
    const number = String(index + 1).padStart(2, "0");
    const providerId = `prov_${number}`;
    const userId = `user_prov_${number}`;
    const locality = LOCALITIES.find((l) => l.id === seed.localityId);
    if (!locality) throw new Error(`Unknown locality ${seed.localityId}`);
    const { dLat, dLng } = jitter(index);

    users.push({
      id: userId,
      name: seed.name,
      email: `provider${number}.demo@example.com`,
      phone: `+91 90000 1${number.padStart(4, "0")}`,
      role: "provider",
      createdAt,
    });

    providers.push({
      id: providerId,
      userId,
      name: seed.name,
      category: seed.category,
      gender: seed.gender,
      languages: seed.languages,
      bio: bioFor(seed, locality),
      yearsExperience: seed.yearsExperience,
      credentials: credentialsFor(seed, locality, index),
      verificationStatus: seed.verificationStatus,
      rating: seed.rating,
      reviewCount: seed.reviewCount,
      serviceRadiusKm: seed.serviceRadiusKm,
      baseLocation: {
        latitude: Math.round((locality.latitude + dLat) * 1e5) / 1e5,
        longitude: Math.round((locality.longitude + dLng) * 1e5) / 1e5,
        locality: locality.name,
        city: locality.city,
      },
      travelFeeMinor: seed.travelFeeMinor,
      cancellationPolicy: CANCELLATION_BY_CATEGORY[seed.category],
      active: true,
    });

    SERVICE_TEMPLATES[seed.category].forEach((template, serviceIndex) => {
      services.push({
        ...template,
        id: `svc_${number}_${serviceIndex + 1}`,
        providerId,
        category: seed.category,
        basePriceMinor: roundTo10Rupees((template.basePriceMinor * seed.priceFactor) / 100),
        active: true,
      });
    });

    const slotHours = SLOT_HOURS[seed.category];
    for (let day = 0; day < 7; day++) {
      const ymd = addDays(today, day);
      slotHours.forEach((hour, hourIndex) => {
        const start = istInstant(ymd, hour);
        const end = new Date(start.getTime() + 2 * 3600 * 1000);
        // Deterministic mix of open / booked / blocked slots so the UI has variety.
        const pattern = (index + day * 3 + hourIndex) % 7;
        const status = pattern === 0 ? "booked" : pattern === 3 && day > 0 ? "blocked" : "open";
        slots.push({
          id: `slot_${number}_${ymd.replace(/-/g, "")}_${String(hour).padStart(2, "0")}`,
          providerId,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          status,
        });
      });
    }

    const comments = REVIEW_COMMENTS[seed.category];
    for (let r = 0; r < 3; r++) {
      reviews.push({
        id: `rev_${number}_${r + 1}`,
        bookingId: null,
        userId: DEMO_USER_ID,
        providerId,
        authorName: REVIEWER_NAMES[(index + r) % REVIEWER_NAMES.length],
        rating: r === 2 && seed.rating < 4.7 ? 4 : 5,
        comment: comments[(index + r) % comments.length],
        createdAt: new Date(now.getTime() - (r + 1) * 9 * 24 * 3600 * 1000).toISOString(),
      });
    }
  });

  const bookings = createSampleBookings({ now, providers, services });

  return {
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    users,
    providers,
    services,
    slots,
    reviews,
    pricingRules: DEFAULT_PRICING_RULES.map((rule) => ({ ...rule })),
    config: { ...DEFAULT_PLATFORM_CONFIG, taxAppliesTo: [...DEFAULT_PLATFORM_CONFIG.taxAppliesTo] },
    bookings,
  };
}

/** A few bookings so the provider and admin dashboards have something to show on first load. */
function createSampleBookings(args: {
  now: Date;
  providers: ProviderProfile[];
  services: Service[];
}): Booking[] {
  const { now, providers, services } = args;
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
    const end = new Date(start.getTime() + service.durationMinutes * 60_000);
    const bookingId = `bk_demo_${i + 1}`;
    const createdAt = new Date(now.getTime() - (5 - i) * 3600 * 1000).toISOString();
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
    if (sample.status === "ACCEPTED" || sample.status === "COMPLETED") {
      history.push({ status: "ACCEPTED", at: createdAt, by: "provider" });
    }
    if (sample.status === "COMPLETED") {
      for (const status of ["ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETED"] as const) {
        history.push({ status, at: start.toISOString(), by: "provider" });
      }
    }
    if (sample.status === "CANCELLED") history.push({ status: "CANCELLED", at: createdAt, by: "user" });

    return {
      id: bookingId,
      userId: DEMO_USER_ID,
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
      scheduledEnd: end.toISOString(),
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
