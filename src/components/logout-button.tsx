"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";

/** `compact` shows only the icon below the xl breakpoint; the label stays available to screen readers. */
export function LogoutButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function logOut() {
    setError(null);
    try {
      await apiRequest("/api/session", "DELETE");
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log out");
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" className={className} onClick={logOut} disabled={pending} data-testid="logout">
        <LogOut aria-hidden className="size-4" />
        <span className={compact ? "sr-only xl:not-sr-only" : undefined}>Log out</span>
      </Button>
      {error && (
        <span role="alert" className="text-xs text-rose-700">
          {error}
        </span>
      )}
    </>
  );
}
