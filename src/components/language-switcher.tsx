"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALES, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

/** Each language names itself, so someone who can't read the current one still finds theirs. */
const OPTIONS: Record<Locale, { label: string; short: string; lang: string }> = {
  en: { label: "English", short: "EN", lang: "en" },
  hi: { label: "हिंदी", short: "हिं", lang: "hi" },
};

/** Remembers the choice for a year; the server reads it on the next render. */
function saveLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

/** English / Hindi toggle in the header. Stores the choice in a cookie and re-renders the page on the server. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    saveLocale(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Language / भाषा"
      aria-busy={pending}
      className={cn(
        "flex items-center gap-0.5 rounded-full bg-brand-50/80 p-0.5 text-xs font-semibold ring-1 ring-brand-100 sm:p-1 sm:text-sm",
        pending && "opacity-70",
        className,
      )}
      data-testid="language-switcher"
    >
      <Languages aria-hidden className="ml-1.5 hidden size-4 text-brand-700 md:block" />
      {LOCALES.map((value) => {
        const option = OPTIONS[value];
        const active = value === locale;
        return (
          <button
            key={value}
            type="button"
            lang={option.lang}
            aria-pressed={active}
            onClick={() => choose(value)}
            disabled={pending}
            className={cn(
              "rounded-full px-2 py-1 whitespace-nowrap transition sm:px-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sea-600/40",
              active ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-100" : "text-ink-muted hover:bg-white/70 hover:text-brand-700",
            )}
            data-testid={`language-${value}`}
          >
            <span className="sm:hidden">{option.short}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
