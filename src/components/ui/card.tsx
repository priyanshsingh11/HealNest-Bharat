import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-surface shadow-sm", className)} {...props} />;
}

export function SectionHeading({ title, description, id }: { title: string; description?: string; id?: string }) {
  return (
    <div className="mb-4">
      <h2 id={id} className="text-lg font-bold text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </div>
  );
}
