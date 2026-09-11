import { z } from "zod";
import { DOCUMENT_KINDS, GOVT_ID_TYPES, type CategoryId, type DocumentKind, type GovtIdType } from "@/types";

// Caretaker verification rules shared by the form (client) and the API (server).
// Each profession must show the credentials that matter for it: nurses their qualification and council registration,
// nannies and caregivers a police verification.

export const GOVT_ID_LABELS: Record<GovtIdType, string> = {
  aadhaar: "Aadhaar",
  pan: "PAN card",
  voter_id: "Voter ID",
  passport: "Passport",
  driving_licence: "Driving licence",
};

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  photo_id: "Government photo ID",
  degree: "Degree or qualification certificate",
  registration: "Council registration certificate",
  police: "Police verification certificate",
  training: "Training certificate",
  other: "Other supporting document",
};

type Requirements = {
  registration: boolean;
  police: boolean;
  qualifications: boolean;
  documents: DocumentKind[];
};

export const VERIFICATION_REQUIREMENTS: Record<CategoryId, Requirements> = {
  nurse: { registration: true, police: false, qualifications: true, documents: ["photo_id", "degree", "registration"] },
  physiotherapist: { registration: true, police: false, qualifications: true, documents: ["photo_id", "degree", "registration"] },
  phlebotomist: { registration: false, police: true, qualifications: true, documents: ["photo_id", "degree", "police"] },
  babysitter: { registration: false, police: true, qualifications: false, documents: ["photo_id", "police"] },
  caregiver: { registration: false, police: true, qualifications: false, documents: ["photo_id", "police"] },
};

export const QUALIFICATION_OPTIONS: Record<CategoryId, string[]> = {
  nurse: ["B.Sc Nursing", "M.Sc Nursing", "Post Basic B.Sc Nursing", "GNM", "ANM"],
  physiotherapist: ["BPT", "MPT"],
  phlebotomist: ["DMLT", "BMLT", "Phlebotomy certificate"],
  babysitter: ["Paediatric first aid & CPR", "Early childhood care certificate", "Nanny training certificate"],
  caregiver: ["Elder-care training", "First aid & CPR", "Home health aide certificate"],
};

export const REGISTRATION_LABELS: Record<CategoryId, string> = {
  nurse: "Nurse registration",
  physiotherapist: "Physiotherapy registration",
  phlebotomist: "Registration",
  babysitter: "Registration",
  caregiver: "Registration",
};

/** A resized profile photo is ~30 KB; this cap keeps data URLs small. */
export const PHOTO_MAX_CHARS = 200_000;
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

const requiredText = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export const qualificationSchema = z.object({
  degree: requiredText(2, 40, "Choose a qualification"),
  institution: requiredText(3, 120, "Enter the university or college"),
  year: z
    .number({ error: "Enter the year" })
    .int()
    .min(1960, "Enter a valid year")
    .max(new Date().getFullYear(), "Year can't be in the future"),
});

export const documentSchema = z.object({
  kind: z.enum(DOCUMENT_KINDS),
  fileName: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(1).max(10 * 1024 * 1024, "Each file must be under 10 MB"),
  contentType: z.string().max(100).default(""),
});

/** Verification form schema for one profession. Required fields differ by profession. */
export function verificationSchemaFor(category: CategoryId) {
  const req = VERIFICATION_REQUIREMENTS[category];
  return z.object({
    fullName: requiredText(3, 80, "Enter your full name as on your ID"),
    phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, "Enter a valid 10-digit Indian mobile number"),
    email: z.email("Enter a valid email address").max(120),
    addressText: requiredText(10, 200, "Enter your full address"),
    city: requiredText(2, 60, "Enter your city"),
    languages: z.array(z.string().trim().min(2).max(30)).min(1, "Choose at least one language").max(8),
    yearsExperience: z.number({ error: "Enter your years of experience" }).int().min(0).max(60),
    govtIdType: z.enum(GOVT_ID_TYPES),
    govtIdLast4: z.string().trim().regex(/^[0-9A-Za-z]{4}$/, "Enter the last 4 characters of your ID"),
    photoUrl: z
      .string({ error: "Upload a clear profile photo" })
      .max(PHOTO_MAX_CHARS, "That photo is too large — try a smaller one")
      .regex(PHOTO_PATTERN, "Upload a JPEG, PNG or WebP photo"),
    registrationNumber: req.registration ? requiredText(4, 40, "Enter your registration number") : optionalText(40),
    registrationCouncil: req.registration ? requiredText(3, 80, "Enter your registering council") : optionalText(80),
    qualifications: z.array(qualificationSchema).min(req.qualifications ? 1 : 0, "Add at least one qualification").max(6),
    policeVerificationRef: req.police
      ? requiredText(4, 40, "Enter your police verification certificate number")
      : optionalText(40),
    documents: z
      .array(documentSchema)
      .max(8)
      .refine((docs) => req.documents.every((kind) => docs.some((d) => d.kind === kind)), {
        message: `Upload: ${req.documents.map((kind) => DOCUMENT_LABELS[kind].toLowerCase()).join(", ")}`,
      }),
    confirmAccurate: z.literal(true, { error: "Please confirm these details are accurate" }),
  });
}

export type VerificationSubmission = z.output<ReturnType<typeof verificationSchemaFor>>;
