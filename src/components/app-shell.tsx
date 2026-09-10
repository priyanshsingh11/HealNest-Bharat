import { HeartPulse, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { ButtonLink } from "@/components/ui/button";
import { getSession, isSignedIn } from "@/lib/auth";
import { PROFESSION_LABELS } from "@/lib/categories";
import { getRepository } from "@/lib/db";
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

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const repo = getRepository();
  const account = (await isSignedIn()) ? await describeAccount(repo, session) : null;
  const roleNav = account ? ROLE_NAV[session.role] : undefined;
  const nav = roleNav ? [...NAV, roleNav] : NAV;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="flex items-center gap-2 rounded-lg font-extrabold tracking-tight text-ink">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-white">
              <HeartPulse aria-hidden className="size-5" />
            </span>
            <span className="text-lg">
              HealNest <span className="text-brand-600">Bharat</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            <NavLinks items={nav} variant="desktop" />
          </nav>

          <div className="flex items-center justify-end gap-2">
            {account ? (
              <div className="hidden items-center gap-3 sm:flex" data-testid="account">
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold text-ink">{account.name}</p>
                  <p className="text-xs text-ink-muted">{account.label}</p>
                </div>
                <LogoutButton />
              </div>
            ) : (
              <ButtonLink href="/login" size="sm" className="px-5" data-testid="login-link">
                Log in
              </ButtonLink>
            )}
            <details className="relative lg:hidden">
              <summary
                className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-line [&::-webkit-details-marker]:hidden"
                aria-label="Open menu"
              >
                <Menu aria-hidden className="size-5" />
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lg">
                <nav aria-label="Mobile">
                  <NavLinks items={nav} variant="mobile" />
                </nav>
                {account && (
                  <div className="mt-2 border-t border-line px-3 pt-3 pb-1 sm:hidden">
                    <p className="text-sm font-semibold text-ink">{account.name}</p>
                    <p className="text-xs text-ink-muted">{account.label}</p>
                    <LogoutButton className="mt-2 w-full" />
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

      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-ink-muted sm:px-6 md:grid-cols-2">
          <div>
            <p className="font-bold text-ink">HealNest Bharat</p>
            <p className="mt-1">
              A marketplace for home-visit care services. We do not provide diagnosis, medical advice or emergency care.
              For emergencies, dial <a className="font-semibold underline" href="tel:112">112</a>.
            </p>
          </div>
          <div className="md:text-right">
            <p>
              MVP demo — providers, reviews and registration numbers are fictional. No real payments are taken.
            </p>
            <p className="mt-1">
              Data source: <span className="font-semibold">{repo.kind === "supabase" ? "Supabase" : "In-memory demo data"}</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
