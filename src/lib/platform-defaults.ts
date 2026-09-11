import type { CategoryId, PlatformConfig, PricingRule, Service } from "@/types";

// Settings the platform ships with: tax and refund config, pricing rules, and the starter services and cancellation
// policy each new caretaker gets. A fresh data store starts from these (see seed.ts).

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
    "Nurses and physiotherapists are listed with their state council registration. Verification is performed by HealNest Bharat staff before a profile is marked verified.",
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

/** Starter services per profession. Order matters: service ids are svc_<provider number>_<position>. */
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

export const CANCELLATION_BY_CATEGORY: Record<CategoryId, string> = {
  nurse: "Free cancellation up to 2 hours before the visit. Later cancellations may be charged the travel fee.",
  physiotherapist: "Free cancellation up to 2 hours before the session. Later cancellations may be charged the travel fee.",
  phlebotomist: "Free cancellation up to 1 hour before the collection window.",
  babysitter: "Free cancellation up to 6 hours before the booking. Later cancellations may be charged 1 hour of care.",
  caregiver: "Free cancellation up to 6 hours before the booking. Later cancellations may be charged the travel fee.",
};

/** Standard services for a caretaker who signs up, at template prices. */
export function starterServicesFor(category: CategoryId, providerId: string): Service[] {
  const number = providerId.replace(/^prov_/, "");
  return SERVICE_TEMPLATES[category].map((template, index) => ({
    ...template,
    id: `svc_${number}_${index + 1}`,
    providerId,
    category,
    active: true,
  }));
}
