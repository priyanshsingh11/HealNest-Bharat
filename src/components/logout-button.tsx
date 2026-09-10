"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/client-api";

export function LogoutButton({ className }: { className?: string }) {
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
        <LogOut aria-hidden className="size-4" /> Log out
      </Button>
      {error && (
        <span role="alert" className="text-xs text-rose-700">
          {error}
        </span>
      )}
    </>
  );
}
