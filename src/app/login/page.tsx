import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-logo";
import { LoginForm, type CaretakerOption, type CustomerOption } from "@/components/login-form";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { flattenParams } from "@/lib/location";
import { DEMO_USER_ID } from "@/lib/seed";
import type { CategoryId } from "@/types";

export const metadata: Metadata = { title: "Log in" };

/** Order of profession tiles on the caretaker tab. */
const PROFESSION_ORDER: CategoryId[] = ["nurse", "babysitter", "caregiver", "physiotherapist", "phlebotomist"];

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Only same-site relative paths, so `?next=` can't redirect to another site. */
function safeNext(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = flattenParams(await searchParams);
  const repo = getRepository();
  const [providers, categories, customerUsers] = await Promise.all([
    repo.listProviders(),
    repo.listCategories(),
    repo.listUsers({ role: "user" }),
  ]);

  // The demo customer first, then created accounts by name.
  const customers: CustomerOption[] = customerUsers
    .sort((a, b) => Number(b.id === DEMO_USER_ID) - Number(a.id === DEMO_USER_ID) || a.name.localeCompare(b.name))
    .map(({ id, name, email }) => ({ id, name, email }));

  const activeCategories = new Set(categories.filter((c) => c.active).map((c) => c.id));
  const caretakers: CaretakerOption[] = providers
    .filter((p) => p.active && activeCategories.has(p.category))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      locality: p.baseLocation.locality,
      city: p.baseLocation.city,
      verificationStatus: p.verificationStatus,
    }));

  return (
    <div className="hero-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <BrandMark className="mx-auto h-20" />
        <LoginForm
          customers={customers}
          caretakers={caretakers}
          professions={PROFESSION_ORDER.filter((id) => activeCategories.has(id))}
          initialType={params.as === "caretaker" ? "caretaker" : "customer"}
          next={safeNext(params.next)}
          enabled={demoToolsEnabled()}
        />
      </div>
    </div>
  );
}
