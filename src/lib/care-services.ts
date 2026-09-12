import { isComingSoon } from "@/lib/categories";
import type { CareServiceId, CategoryId } from "@/types";

export type CareService = {
  id: CareServiceId;
  name: string;
  /** One line for compact cards. */
  summary: string;
  description: string;
  includes: string[];
  /** Provider categories that offer this service. */
  providedBy: CategoryId[];
  /** Safety or scope note shown with the service, if any. */
  note?: string;
  /** Optional expandable scope list shown on the service catalogue. */
  scope?: { title: string; description: string }[];
};

export const CARE_SERVICES: CareService[] = [
  {
    id: "home-nursing",
    name: "Home Nursing",
    summary: "Registered nurses for visits or full shifts at home.",
    description: "A registered nurse at home for routine nursing care, vitals monitoring and day or night shifts.",
    includes: ["Vitals: BP, pulse, SpO₂, temperature, sugar", "Medication reminders as prescribed", "12-hour day or night nursing shifts"],
    providedBy: ["nurse"],
    scope: [
      { title: "Patient Monitoring", description: "BP, pulse, temperature, SpO₂, respiratory rate, blood sugar, consciousness, pain and overall condition; prompt reporting of deterioration." },
      { title: "Medication & Treatment", description: "Prescribed medicines, injections, IV fluids, insulin and nebulization; medication scheduling and monitoring." },
      { title: "Basic Nursing Care", description: "Personal hygiene, oral care, feeding, changing clothes/linen, positioning, pressure-sore prevention and mobility assistance." },
      { title: "Catheter/Tube Care", description: "Foley catheter, NG/feeding tube, drains, tracheostomy and ostomy care, including urine-output monitoring." },
      { title: "Wound Care", description: "Dressing, postoperative and pressure-ulcer care, infection monitoring and aseptic technique." },
      { title: "Respiratory Care", description: "Oxygen therapy, nebulization, suctioning and tracheostomy care as per patient requirements and nurse competency." },
      { title: "Nutrition & Elimination", description: "Feeding, tube feeding, intake/output monitoring, diaper changes and bowel/bladder care." },
      { title: "Documentation", description: "Nursing notes, vital/medication/intake-output records and communication of significant changes in the patient’s condition." },
    ],
  },
  {
    id: "injection-iv",
    name: "Injection & IV",
    summary: "Prescribed injections and IV drips given at home.",
    description: "Intramuscular, subcutaneous and intravenous injections, and IV infusions, given by a registered nurse.",
    includes: ["IM / SC / IV injections", "IV drip and infusion set-up and monitoring", "Cannula care"],
    providedBy: ["nurse"],
    note: "A valid prescription from a registered doctor is required.",
  },
  {
    id: "wound-dressing",
    name: "Wound Dressing",
    summary: "Cleaning and dressing of wounds as advised by your doctor.",
    description: "Sterile cleaning and dressing of surgical wounds, injuries, ulcers and bedsores.",
    includes: ["Surgical and post-operative wounds", "Diabetic foot and pressure ulcers", "Suture and staple care"],
    providedBy: ["nurse"],
  },
  {
    id: "catheter-care",
    name: "Catheter Care",
    summary: "Urinary catheter insertion, change and removal.",
    description: "Urinary catheter insertion, routine change, removal and bag care by a trained nurse.",
    includes: ["Foley catheter insertion and change", "Catheter removal", "Hygiene and infection-prevention care"],
    providedBy: ["nurse"],
    note: "Insertion and change are done only on a doctor's advice.",
  },
  {
    id: "elderly-care",
    name: "Elderly Care",
    summary: "Companionship, daily-living help and check-ups for seniors.",
    description: "Everyday support for elders at home: companionship, mobility and personal care.",
    includes: ["Companionship and supervision", "Help with bathing, dressing and meals", "Support with walks and mobility"],
    providedBy: ["caregiver"],
  },
  {
    id: "post-operative-care",
    name: "Post-operative Care",
    summary: "Nursing and rehab support after a hospital discharge.",
    description: "Hands-on recovery support at home after surgery, following your hospital's discharge plan.",
    includes: ["Nursing visits following the discharge plan", "Post-surgery physiotherapy rehab", "Pain, drain and mobility monitoring"],
    providedBy: ["nurse", "physiotherapist"],
  },
  {
    id: "physiotherapy",
    name: "Physiotherapy",
    summary: "Qualified physiotherapists for sessions at home.",
    description: "Home physiotherapy sessions for pain relief, mobility and strength, by qualified physiotherapists.",
    includes: ["Back, neck and joint pain", "Stroke and neuro rehabilitation", "Balance and fall prevention for seniors"],
    providedBy: ["physiotherapist"],
  },
  {
    id: "home-lab-collection",
    name: "Home Lab Collection",
    summary: "Blood and sample collection at home for lab tests.",
    description: "A trained phlebotomist collects blood, urine or other samples at home and delivers them to a partner lab.",
    includes: ["Blood tests and health check-up packages", "Early-morning fasting collections", "Urine and stool sample pickup"],
    providedBy: ["phlebotomist"],
    note: "Prices shown are the collection fee. The lab bills test charges separately.",
  },
];

export function findCareService(id: string | null | undefined): CareService | undefined {
  return CARE_SERVICES.find((service) => service.id === id);
}

/** True while every profession that provides this service is still "Coming soon". */
export function isCareServiceComingSoon(service: CareService): boolean {
  return service.providedBy.every((category) => isComingSoon(category));
}

/** Services that can actually be booked today — use this for counts shown to customers. */
export const AVAILABLE_CARE_SERVICES = CARE_SERVICES.filter((service) => !isCareServiceComingSoon(service));
