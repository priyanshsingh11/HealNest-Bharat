import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { bookableCategories, isComingSoon } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";
import { flattenParams } from "@/lib/location";
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

/**
 * Which accounts exist is deliberately not sent to the browser. The page renders only the professions
 * available for sign-up; the accounts you can log into come from this device's own store, so nobody can
 * see — let alone open — an account created on someone else's device.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const params = flattenParams(await searchParams);
  const categories = await getRepository().listCategories();
  const activeCategories = new Set(bookableCategories(categories).map((c) => c.id));

  return (
    <div className="hero-surface">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <BrandMark className="mx-auto h-20" />
        <LoginForm
          professions={PROFESSION_ORDER.filter((id) => activeCategories.has(id) || isComingSoon(id))}
          initialType={params.as === "caretaker" ? "caretaker" : "customer"}
          next={safeNext(params.next)}
          demoEnabled={demoToolsEnabled()}
        />
      </div>
    </div>
  );
}
