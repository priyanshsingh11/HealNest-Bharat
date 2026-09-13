import { KindBadge, VerificationBadge, VerifiedTick } from "@/components/category-meta";
import { ProviderDashboardNav } from "@/components/dashboard/provider-nav";
import { ProviderAvatar } from "@/components/provider-avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import { getMessages } from "@/lib/i18n/server";
import type { ProviderProfile } from "@/types";

/** Shown when nobody is logged in as a caretaker. */
export async function ProviderGate({ missing = false }: { missing?: boolean }) {
  const { gate: t } = await getMessages(providerDashboardMessages);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold">{t.title}</h1>
      <Card className="mt-6 p-6">
        <p className="text-ink-muted">
          {missing ? t.notFound : ""}
          {t.intro}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/login?next=/dashboard/provider">{t.logIn}</ButtonLink>
          <ButtonLink href="/login?mode=signup&as=caretaker" variant="secondary">
            {t.signUp}
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

/** Caretaker dashboard header: photo, name with the verified tick, status badges and section tabs. */
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
      </div>
      <ProviderDashboardNav />
    </>
  );
}
