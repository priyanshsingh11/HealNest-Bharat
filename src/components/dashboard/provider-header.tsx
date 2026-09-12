import Link from "next/link";
import { KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-meta";
import { ProviderDashboardNav } from "@/components/dashboard/provider-nav";
import { ProviderSwitcher } from "@/components/dashboard/provider-switcher";
import { ProviderAvatar } from "@/components/provider-avatar";
import { Card } from "@/components/ui/card";
import type { ProviderProfile } from "@/types";

/** Shown when nobody is signed in as a caretaker. Only profiles registered on this device can be opened. */
export function ProviderGate({ missing = false }: { missing?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold">Provider dashboard</h1>
      <p className="mt-2 text-ink-muted">
        {missing ? "That caretaker profile wasn't found. " : ""}Open one of the caretaker profiles saved on this device, or{" "}
        <Link href="/login?as=caretaker" className="font-semibold text-brand-700 underline underline-offset-2">
          log in as a caretaker
        </Link>
        .
      </p>
      <Card className="mt-6 p-6">
        <ProviderSwitcher />
        <p className="mt-3 text-sm text-ink-muted">
          Caretaker accounts can only be opened from the device they were created on.{" "}
          <Link href="/login?as=caretaker" className="font-semibold text-brand-700 underline underline-offset-2">
            Create one
          </Link>{" "}
          to get started.
        </p>
      </Card>
    </div>
  );
}

/** Caretaker dashboard header: photo, name with the verified tick, status badges, profile switcher and section tabs. */
export function ProviderDashboardHeader({ provider, eyebrow }: { provider: ProviderProfile; eyebrow: string }) {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <ProviderAvatar provider={provider} />
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{eyebrow}</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {provider.name}
              {provider.verificationStatus === "verified" && <VerifiedTick className="size-6" />}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <VerificationBadge status={provider.verificationStatus} />
              <KindBadge category={provider.category} />
            </div>
          </div>
        </div>
        <ProviderSwitcher currentProviderId={provider.id} />
      </div>
      <ProviderDashboardNav />
    </>
  );
}
