"use client";

import { ChevronRight } from "lucide-react";
import { CategoryIcon, KIND_TILE } from "@/components/category-meta";
import { KIND_LABELS } from "@/lib/categories";
import { cn } from "@/lib/cn";
import type { Category, CategoryId } from "@/types";

/** Large category cards with icons and plain-language descriptions. */
export function CategorySelector({
  categories,
  onSelect,
  selected,
}: {
  categories: Category[];
  onSelect: (id: CategoryId) => void;
  selected?: CategoryId | null;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <li key={category.id}>
          <button
            type="button"
            onClick={() => onSelect(category.id)}
            aria-pressed={selected === category.id}
            data-testid={`category-${category.id}`}
            className={cn(
              "group flex h-full w-full flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md",
              selected === category.id ? "border-brand-500 ring-2 ring-brand-500/30" : "border-line",
            )}
          >
            <span className={cn("grid size-12 place-items-center rounded-xl", KIND_TILE[category.kind])}>
              <CategoryIcon category={category.id} className="size-6" />
            </span>
            <span className="mt-4 flex items-center justify-between gap-2 text-lg font-bold text-ink">
              {category.name}
              <ChevronRight aria-hidden className="size-5 text-ink-muted transition group-hover:translate-x-0.5" />
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{KIND_LABELS[category.kind]}</span>
            <span className="mt-2 text-sm text-ink-muted">{category.description}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
