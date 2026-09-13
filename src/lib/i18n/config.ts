// Language settings shared by server and client code. The chosen language lives in a cookie, so every
// server render already knows it and there is no flash of English before Hindi.

export const LOCALES = ["en", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "hn_locale";
/** One year: the choice should survive closing the browser. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** BCP 47 tags for `<html lang>` and `Intl` formatters. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-IN", hi: "hi-IN" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Reads the language from a raw `Cookie` header, for route handlers that only have the request. */
export function localeFromCookieHeader(header: string | null): Locale {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`));
  return parseLocale(match?.[1]);
}

/**
 * Declares one set of UI strings in every language. The Hindi copy must have exactly the English shape,
 * so a missing or misnamed key is a type error. Values may be functions for text with numbers or names.
 */
export function defineMessages<T>(messages: { en: T; hi: NoInfer<T> }): Record<Locale, T> {
  return messages;
}
