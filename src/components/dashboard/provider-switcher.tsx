"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import { listDeviceAccounts, type DeviceAccount } from "@/lib/device-accounts";

/**
 * Switches between the caretaker profiles registered on *this* device.
 *
 * The options come from the browser's own store, not the server, so it can never list someone else's profile —
 * and the server re-checks each account's device secret before switching.
 */
export function ProviderSwitcher({ currentProviderId }: { currentProviderId?: string | null }) {
  const id = useId();
  const router = useRouter();
  const [accounts, setAccounts] = useState<DeviceAccount[]>([]);
  const [providerId, setProviderId] = useState(currentProviderId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = listDeviceAccounts("provider");
    setAccounts(saved);
    setProviderId((current) => current || (saved[0]?.providerId ?? ""));
  }, []);

  async function switchTo(nextProviderId: string) {
    const account = accounts.find((a) => a.providerId === nextProviderId);
    if (!account) return;
    setError(null);
    try {
      await apiRequest("/api/session", "POST", { role: "provider", providerId: nextProviderId, deviceToken: account.token });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch profile");
    }
  }

  // One profile on this device and it is already open: nothing to switch to.
  if (accounts.length === 0 || (accounts.length === 1 && accounts[0].providerId === currentProviderId)) return null;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-56">
        <Label htmlFor={id}>Your caretaker profiles</Label>
        <Select
          id={id}
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value);
            if (currentProviderId) void switchTo(e.target.value);
          }}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.providerId ?? ""}>
              {a.name} — {a.detail}
            </option>
          ))}
        </Select>
      </div>
      {!currentProviderId && (
        <Button onClick={() => void switchTo(providerId)} disabled={pending || !providerId}>
          Open provider dashboard
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
