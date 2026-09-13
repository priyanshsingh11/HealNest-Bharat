import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n/config";

/** The visitor's language for this request, from the language cookie. */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
});

/** Picks the strings for the visitor's language in a server component: `const t = await getMessages(homeMessages)`. */
export async function getMessages<T>(messages: Record<Locale, T>): Promise<T> {
  return messages[await getLocale()];
}
