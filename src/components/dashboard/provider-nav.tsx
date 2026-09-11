"use client";

import { BadgeCheck, CalendarDays, Clock, LayoutDashboard, Star, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Sections of the caretaker dashboard. */
export function ProviderDashboardNav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const items: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/dashboard/provider", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/provider/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/dashboard/provider/schedule", label: "Slots", icon: Clock },
    { href: "/dashboard/provider/verification", label: "Profile & verification", icon: BadgeCheck },
    { href: "/dashboard/provider/reviews", label: "Ratings & reviews", icon: Star },
  ];

  // On phones the tabs scroll sideways; keep the current one in view. Braces matter: newer browsers return a
  // Promise from scrollIntoView, and an effect must not return anything but a cleanup function.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      aria-label="Dashboard sections"
      className="-mx-4 mt-5 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]"
    >
      <ul className="flex w-max gap-2 pr-6 sm:w-auto sm:flex-wrap sm:pr-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                ref={active ? activeRef : undefined}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-brand-700 bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-sm"
                    : "border-line bg-white text-ink hover:border-brand-300 hover:text-brand-700",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
