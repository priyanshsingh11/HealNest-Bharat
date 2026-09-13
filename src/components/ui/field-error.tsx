"use client";

import { useLocale } from "@/lib/i18n/client";
import { translateError } from "@/lib/i18n/errors";

/** Validation messages come from shared English schemas; they are shown in the visitor's language. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  const locale = useLocale();
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-rose-700">
      {translateError(message, locale)}
    </p>
  );
}
