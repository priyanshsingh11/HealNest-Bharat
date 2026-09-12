import type { CategoryId } from "@/types";

// The accounts registered on *this* browser, kept in localStorage.
//
// Each entry holds the secret issued at sign-up; logging in sends it back so the server can confirm the
// account belongs to this device. Nothing here is trusted on its own — the server rejects a token it did
// not issue — so a tampered entry just fails to log in.
//
// Storage can be unavailable (private windows, blocked site data), so every access is guarded and an
// unreadable store is treated as "no accounts on this device".

const KEY = "healnest.device-accounts.v1";

export type DeviceAccount = {
  /** App user id. For a caretaker this is the user behind the profile, not the profile id. */
  id: string;
  role: "user" | "provider";
  /** Caretaker profile this login opens. Null for customers. */
  providerId: string | null;
  category: CategoryId | null;
  name: string;
  /** Second line in the picker: the email for customers, "Locality, City" for caretakers. */
  detail: string;
  /** Secret issued at sign-up. Sent to /api/session to prove this device registered the account. */
  token: string;
  addedAt: string;
};

function readStore(): DeviceAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is DeviceAccount =>
        typeof a === "object" && a !== null && typeof (a as DeviceAccount).id === "string" && typeof (a as DeviceAccount).token === "string",
    );
  } catch {
    return [];
  }
}

function writeStore(accounts: DeviceAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(accounts));
  } catch {
    // Storage full or blocked: the account still exists server-side, it just won't be offered here again.
  }
}

/** Accounts registered on this device, newest first. Pass a role to filter. */
export function listDeviceAccounts(role?: DeviceAccount["role"]): DeviceAccount[] {
  return readStore()
    .filter((a) => !role || a.role === role)
    .sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));
}

/** Adds an account after sign-up, replacing any earlier entry for the same id. */
export function rememberDeviceAccount(account: DeviceAccount): void {
  writeStore([account, ...readStore().filter((a) => a.id !== account.id)]);
  publish();
}

/** Removes an account from this device's list. The account itself is untouched. */
export function forgetDeviceAccount(id: string): void {
  writeStore(readStore().filter((a) => a.id !== id));
  publish();
}

// --- useSyncExternalStore plumbing -----------------------------------------------------------------
//
// localStorage is an external store, so components read it through useSyncExternalStore rather than an
// effect that calls setState. The snapshot is cached because useSyncExternalStore compares by reference
// and would loop forever on a freshly parsed array each call.

const listeners = new Set<() => void>();
let cached: DeviceAccount[] | null = null;
/** The server renders no accounts; a stable reference keeps hydration from tearing. */
const NONE: DeviceAccount[] = [];

function publish(): void {
  cached = null;
  for (const listener of listeners) listener();
}

export function subscribeToDeviceAccounts(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab signing up or removing an account writes to the same key.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === KEY) publish();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getDeviceAccountsSnapshot(): DeviceAccount[] {
  cached ??= listDeviceAccounts();
  return cached;
}

/** Server render and the first hydration pass: this device's list is unknowable there. */
export function getDeviceAccountsServerSnapshot(): DeviceAccount[] {
  return NONE;
}
