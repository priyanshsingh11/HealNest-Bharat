"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { apiRequest } from "@/lib/client-api";
import type { Role } from "@/types";

/** Mock login for dashboards: become the admin, or sign in as a specific provider. */
export function SwitchRole({
  role,
  providers,
  currentProviderId,
  label,
}: {
  role: Role;
  providers?: { id: string; name: string; category: string }[];
  currentProviderId?: string | null;
  label: string;
}) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [providerId, setProviderId] = useState(currentProviderId ?? providers?.[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function submit(nextProviderId?: string) {
    setError(null);
    try {
      await apiRequest("/api/session", "POST", { role, providerId: nextProviderId ?? (providers ? providerId : undefined) });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {providers && (
        <div className="min-w-56">
          <Label htmlFor={id}>Signed in as provider</Label>
          <Select
            id={id}
            value={providerId}
            onChange={(e) => {
              setProviderId(e.target.value);
              if (currentProviderId) submit(e.target.value);
            }}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.category}
              </option>
            ))}
          </Select>
        </div>
      )}
      {(!providers || !currentProviderId) && (
        <Button onClick={() => submit()} disabled={pending}>
          {label}
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
