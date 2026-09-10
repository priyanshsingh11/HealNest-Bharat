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
            ? "rounded-full px-3.5 py-2 text-[15px] transition-colors hover:text-ink"
            : "block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-100",
          active ? "font-bold text-ink" : "font-medium text-ink-muted",
        )}
      >
        {item.label}
      </Link>
    );
  });
}
