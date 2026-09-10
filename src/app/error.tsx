"use client";

import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center" role="alert">
      <TriangleAlert aria-hidden className="mx-auto size-10 text-amber-600" />
      <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-ink-muted">
        We couldn&apos;t load this page. Please try again. If you need urgent medical help, call 112.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
