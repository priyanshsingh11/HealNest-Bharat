"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type ScopeItem = { title: string; description: string };

export function ServiceScopeAccordion({ items }: { items: ScopeItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-5 border-t border-line pt-2" aria-label="Home nursing care scope">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-700">Care scope</p>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.title} className="border-b border-line last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm font-bold text-ink transition hover:text-brand-700"
            >
              <span>{item.title}</span>
              <ChevronDown aria-hidden className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-brand-700" : ""}`} />
            </button>
            {isOpen && <p className="-mt-1 pb-3 pr-7 text-sm leading-6 text-ink-muted">{item.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
