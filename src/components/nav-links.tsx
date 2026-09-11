"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string };

/** Header links with the current page highlighted. */
export function NavLinks({ items, variant }: { items: NavItem[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return items.map((item) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          variant === "desktop"
            ? cn(
                "rounded-full px-3.5 py-1.5 text-[15px] whitespace-nowrap transition xl:px-4",
                active
                  ? "bg-white font-bold text-brand-700 shadow-sm ring-1 ring-brand-100"
                  : "font-medium text-ink-muted hover:bg-white/70 hover:text-brand-700",
              )
            : cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-brand-50 font-bold text-brand-700" : "font-medium text-ink hover:bg-brand-50 hover:text-brand-700",
              ),
        )}
      >
        {item.label}
        {active && variant === "mobile" && <span aria-hidden className="size-2 rounded-full bg-leaf-500" />}
      </Link>
    );
  });
}
