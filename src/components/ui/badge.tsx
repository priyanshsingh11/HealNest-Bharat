import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "medical" | "childcare" | "care";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  danger: "bg-rose-50 text-rose-800 ring-rose-200",
  medical: "bg-sky-50 text-sky-900 ring-sky-200",
  childcare: "bg-fuchsia-50 text-fuchsia-900 ring-fuchsia-200",
  care: "bg-violet-50 text-violet-900 ring-violet-200",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
