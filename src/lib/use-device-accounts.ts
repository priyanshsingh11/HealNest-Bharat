"use client";

import { useSyncExternalStore } from "react";
import {
  getDeviceAccountsServerSnapshot,
  getDeviceAccountsSnapshot,
  subscribeToDeviceAccounts,
  type DeviceAccount,
} from "@/lib/device-accounts";

/**
 * The accounts registered on this browser, kept in sync with localStorage (including changes made in another tab).
 *
 * `hydrated` is false during the server render and the first client pass, where localStorage cannot be read.
 * Components use it to say "checking this device…" instead of flashing "no accounts" at someone who has some.
 */
export function useDeviceAccounts(role?: DeviceAccount["role"]): { accounts: DeviceAccount[]; hydrated: boolean } {
  const all = useSyncExternalStore(subscribeToDeviceAccounts, getDeviceAccountsSnapshot, getDeviceAccountsServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeToDeviceAccounts,
    () => true,
    () => false,
  );
  return { accounts: role ? all.filter((a) => a.role === role) : all, hydrated };
}
