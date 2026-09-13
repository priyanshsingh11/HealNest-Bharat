"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import { useMessages } from "@/lib/i18n/client";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import { useDeviceAccounts } from "@/lib/use-device-accounts";

/**
 * Switches between the caretaker profiles registered on *this* device.
 *
 * The options come from the browser's own store, not the server, so it can never list someone else's profile —
 * and the server re-checks each account's device secret before switching.
 */
export function ProviderSwitcher({ currentProviderId }: { currentProviderId?: string | null }) {
  const id = useId();
  const router = useRouter();
  const { switcher: t } = useMessages(providerDashboardMessages);
  const { accounts } = useDeviceAccounts("provider");
  const [chosenId, setChosenId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Derived rather than stored, so the select is always valid even before the device list has loaded.
  const providerId = chosenId || currentProviderId || accounts[0]?.providerId || "";

  async function switchTo(nextProviderId: string) {
    const account = accounts.find((a) => a.providerId === nextProviderId);
    if (!account) return;
    setError(null);
    try {
      await apiRequest("/api/session", "POST", { role: "provider", providerId: nextProviderId, deviceToken: account.token });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.failed);
    }
  }

  // One profile on this device and it is already open: nothing to switch to.
  if (accounts.length === 0 || (accounts.length === 1 && accounts[0].providerId === currentProviderId)) return null;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-56">
        <Label htmlFor={id}>{t.label}</Label>
        <Select
          id={id}
          value={providerId}
          onChange={(e) => {
            setChosenId(e.target.value);
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
          {t.open}
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
