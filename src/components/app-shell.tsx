import { Menu, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark, Wordmark } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { ButtonLink } from "@/components/ui/button";
import { getSession, isSignedIn } from "@/lib/auth";
import { PROFESSION_LABELS } from "@/lib/categories";
import { getRepository } from "@/lib/db";
import { initials } from "@/lib/formatters";
import type { CareRepository } from "@/lib/repository/types";
import { ROLE_LABELS } from "@/lib/roles";
import type { Session } from "@/lib/session";

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Find care" },
  { href: "/services", label: "Services" },
  { href: "/bookings", label: "My bookings" },
];

/** Dashboards appear only for the role that uses them; everyone else reaches them via /login. */
const ROLE_NAV: Partial<Record<Session["role"], NavItem>> = {
  provider: { href: "/dashboard/provider", label: "Dashboard" },
  admin: { href: "/dashboard/admin", label: "Admin" },
};

/** Name and role line for the header, e.g. "Sunita Rawat" / "Caretaker · Nurse". */
async function describeAccount(repo: CareRepository, session: Session): Promise<{ name: string; label: string }> {
  if (session.role === "provider" && session.providerId) {
    const provider = await repo.getProvider(session.providerId);
    if (provider) return { name: provider.name, label: `Caretaker · ${PROFESSION_LABELS[provider.category]}` };
  }
  const user = await repo.getUser(session.userId);
  return { name: user?.name ?? ROLE_LABELS[session.role], label: ROLE_LABELS[session.role] };
}

/** Initials on the logo's blue-to-green gradient. */
function AccountAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-leaf-500 text-sm font-bold text-white ring-2 ring-white shadow-sm"
    >
      {initials(name)}
    </span>
  );
}

/** Blue-to-green strip, as in the logo. */
function BrandStrip({ className }: { className?: string }) {
  return <div aria-hidden className={`h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-leaf-500 ${className ?? ""}`} />;
}

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const repo = getRepository();
  const account = (await isSignedIn()) ? await describeAccount(repo, session) : null;
  const roleNav = account ? ROLE_NAV[session.role] : undefined;
  const nav = roleNav ? [...NAV, roleNav] : NAV;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 shadow-[0_1px_0_var(--color-line),0_10px_30px_-24px_rgb(13_82_184/0.5)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <BrandStrip />
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl">
            <BrandMark className="h-11 sm:h-12" />
            <span className="leading-none">
              <Wordmark className="block text-lg sm:text-xl" />
              <span className="mt-1 hidden text-[11px] font-semibold tracking-wide text-ink-muted sm:block">
                Verified care at your doorstep
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full bg-brand-50/80 p-1 ring-1 ring-brand-100">
              <NavLinks items={nav} variant="desktop" />
            </div>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            {account ? (
              <div className="hidden items-center gap-2.5 sm:flex" data-testid="account">
                <AccountAvatar name={account.name} />
                {/* Name shows where there is room: tablets (no desktop nav yet) and wide desktops. */}
                <div className="hidden leading-tight md:block lg:hidden xl:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-ink">{account.name}</p>
                  <p className="max-w-40 truncate text-xs text-ink-muted">{account.label}</p>
                </div>
                <LogoutButton compact />
              </div>
            ) : (
              <ButtonLink href="/login" size="sm" className="px-5" data-testid="login-link">
                Log in
              </ButtonLink>
            )}
            <details className="group relative lg:hidden">
              <summary
                className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-line bg-white text-brand-800 transition-colors hover:bg-brand-50 [&::-webkit-details-marker]:hidden"
                aria-label="Open menu"
              >
                <Menu aria-hidden className="size-5 group-open:hidden" />
                <X aria-hidden className="hidden size-5 group-open:block" />
              </summary>
              <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
                <BrandStrip />
                <nav aria-label="Mobile" className="p-2">
                  <NavLinks items={nav} variant="mobile" />
                </nav>
                {account && (
                  <div className="border-t border-line p-3 sm:hidden">
                    <div className="flex items-center gap-2.5">
                      <AccountAvatar name={account.name} />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-semibold text-ink">{account.name}</p>
                        <p className="truncate text-xs text-ink-muted">{account.label}</p>
                      </div>
                    </div>
                    <LogoutButton className="mt-3 w-full" />
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="bg-brand-900 text-brand-100">
        <BrandStrip />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm sm:px-6 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-white p-1.5 shadow-sm">
                <BrandMark className="h-full" />
              </span>
              <Wordmark tone="light" className="text-lg" />
            </p>
            <p className="mt-3 max-w-xl text-brand-100/90">
              A marketplace for home-visit care services. We do not provide diagnosis, medical advice or emergency care.
              For emergencies, dial <a className="font-semibold text-white underline" href="tel:112">112</a>.
            </p>
          </div>
          <div className="text-brand-100/80 md:text-right">
            <p>
              MVP demo — providers, reviews and registration numbers are fictional. No real payments are taken.
            </p>
            <p className="mt-1">
              Data source:{" "}
              <span className="font-semibold text-white">{repo.kind === "supabase" ? "Supabase" : "In-memory demo data"}</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
