import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names, skipping falsy values. Later Tailwind classes win over conflicting earlier ones (e.g. a `className` override). */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
