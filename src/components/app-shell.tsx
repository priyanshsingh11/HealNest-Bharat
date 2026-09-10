import { HeartPulse, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { RoleSwitcher } from "@/components/role-switcher";
import { getSession } from "@/lib/auth";
import { getRepository } from "@/lib/db";
import { demoToolsEnabled } from "@/lib/demo";

const NAV = [
  { href: "/discover", label: "Find care" },
  { href: "/services", label: "Services" },
  { href: "/bookings", label: "My bookings" },
  { href: "/dashboard/provider", label: "Provider dashboard" },
  { href: "/dashboard/admin", label: "Admin" },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const repo = getRepository();
  const showDemo = demoToolsEnabled();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-lg font-extrabold tracking-tight text-ink">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-700 text-white">
              <HeartPulse aria-hidden className="size-5" />
            </span>
            <span className="text-lg">
              HealNest <span className="text-brand-700">Bharat</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-slate-100 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showDemo && (
              <div className="hidden sm:block">
                <RoleSwitcher role={session.role} />
              </div>
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
                  {NAV.map((item) => (
                    <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-slate-100">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {showDemo && (
                  <div className="mt-2 border-t border-line px-3 pt-3 pb-1 sm:hidden">
                    <RoleSwitcher role={session.role} />
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
