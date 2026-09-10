"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { apiRequest } from "@/lib/client-api";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types";

const DESTINATION: Record<Role, string | null> = {
  user: null,
  provider: "/dashboard/provider",
  admin: "/dashboard/admin",
};

/** Mock login: switch between the demo customer, provider and admin views. */
export function RoleSwitcher({ role }: { role: Role }) {
  const id = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function change(next: Role) {
    setError(null);
    try {
      await apiRequest("/api/session", "POST", { role: next });
      startTransition(() => {
        const destination = DESTINATION[next];
        if (destination) router.push(destination);
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch role");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-medium text-ink-muted whitespace-nowrap">
        Viewing as
      </label>
      <select
        id={id}
        value={role}
        disabled={pending}
        onChange={(e) => change(e.target.value as Role)}
        className="h-9 rounded-lg border border-line bg-white px-2 text-sm font-semibold text-ink"
        data-testid="role-switcher"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-xs text-rose-700">
          {error}
        </span>
      )}
    </div>
  );
}
