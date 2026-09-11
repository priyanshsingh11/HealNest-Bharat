import { PROFESSION_LABELS } from "@/lib/categories";
import { AppError, conflict, unprocessable } from "@/lib/errors";
import { findLocality } from "@/lib/localities";
import { CANCELLATION_BY_CATEGORY, starterServicesFor } from "@/lib/platform-defaults";
import type { CareRepository } from "@/lib/repository/types";
import { buildSession, type Session } from "@/lib/session";
import type { AccountCreateInput } from "@/lib/validations";
import type { ProviderProfile } from "@/types";

// Demo sign-up: creates a customer, or a caretaker with an unverified profile and starter services.
// Replace with Supabase Auth sign-up later (docs/database-design.md); the created rows keep the same shape.

const DEFAULT_RADIUS_KM = 10;
const DEFAULT_TRAVEL_FEE_MINOR = 5000;
/** Retries when two sign-ups race for the same provider number. */
const ID_ATTEMPTS = 3;

const newCustomerId = () => `user_c${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

const isConflict = (error: unknown) => error instanceof AppError && error.status === 409;

/** Next free provider id: one above the highest prov_NN, or prov_01 in an empty store. */
async function nextProviderId(repo: CareRepository): Promise<string> {
  const numbers = (await repo.listProviders()).map((p) => Number(/^prov_(\d+)$/.exec(p.id)?.[1] ?? 0));
  return `prov_${String(Math.max(0, ...numbers) + 1).padStart(2, "0")}`;
}

/** Creates the account and returns the session to log into it. */
export async function createDemoAccount(repo: CareRepository, input: AccountCreateInput, now = new Date()): Promise<Session> {
  const users = await repo.listUsers();
  if (users.some((user) => user.email.toLowerCase() === input.email)) {
    throw conflict("An account with this email already exists. Log in to it instead.");
  }
  const createdAt = now.toISOString();

  if (input.type === "customer") {
    const user = await repo.createUser({
      id: newCustomerId(),
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: "user",
      createdAt,
    });
    return buildSession("user", undefined, user.id);
  }

  const locality = findLocality(input.localityId);
  if (!locality) throw unprocessable("Choose where you are based from the list.");
  const category = (await repo.listCategories()).find((c) => c.id === input.category);
  if (!category?.active) throw unprocessable("This profession is not accepting new caretakers right now.");

  for (let attempt = 0; attempt < ID_ATTEMPTS; attempt++) {
    const providerId = await nextProviderId(repo);
    const userId = `user_${providerId}`;
    try {
      await repo.createUser({ id: userId, name: input.name, email: input.email, phone: input.phone, role: "provider", createdAt });
    } catch (error) {
      if (isConflict(error)) continue;
      throw error;
    }

    const provider: ProviderProfile = {
      id: providerId,
      userId,
      name: input.name,
      photoUrl: null,
      category: input.category,
      gender: input.gender,
      languages: input.languages,
      bio: `${PROFESSION_LABELS[input.category]} based in ${locality.name}, ${locality.city}.`,
      yearsExperience: input.yearsExperience,
      credentials: [],
      // Verification happens from the provider dashboard; only verified caretakers can be booked.
      verificationStatus: "unverified",
      rating: 0,
      reviewCount: 0,
      serviceRadiusKm: DEFAULT_RADIUS_KM,
      baseLocation: { latitude: locality.latitude, longitude: locality.longitude, locality: locality.name, city: locality.city },
      // Home lab collection is free to the customer.
      travelFeeMinor: input.category === "phlebotomist" ? 0 : DEFAULT_TRAVEL_FEE_MINOR,
      cancellationPolicy: CANCELLATION_BY_CATEGORY[input.category],
      active: true,
    };
    await repo.createProvider(provider, starterServicesFor(input.category, providerId));
    return buildSession("provider", providerId);
  }
  throw conflict("Could not create the account right now. Please try again.");
}
