import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { StaffSignInSection } from "@/components/staff-sign-in-section";
import { bookableCategories, isComingSoon } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { authMessages } from "@/lib/i18n/messages/auth";
import { getMessages } from "@/lib/i18n/server";
import { flattenParams } from "@/lib/location";
import { staffLoginConfigured } from "@/lib/staff";
import type { CategoryId } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(authMessages);
  return { title: t.meta.title };
}

/** Order of profession tiles on the caretaker tab. */
const PROFESSION_ORDER: CategoryId[] = ["nurse", "babysitter", "caregiver", "physiotherapist", "phlebotomist"];

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Only same-site relative paths, so `?next=` can't redirect to another site. */
function safeNext(value: string | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Log in or sign up (`?mode=signup`, `?as=caretaker`), with the staff entry tucked underneath. */
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
          initialMode={params.mode === "signup" ? "signup" : "login"}
          initialType={params.as === "caretaker" ? "caretaker" : "customer"}
          next={safeNext(params.next)}
        />
        <StaffSignInSection configured={staffLoginConfigured()} />
      </div>
    </div>
  );
}
