"use client";

import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="hero-surface px-4 py-16 sm:py-24">
      <div
        className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white text-center shadow-[0_24px_60px_-32px_rgb(13_82_184/0.45)] ring-1 ring-line"
        role="alert"
      >
        <div aria-hidden className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-leaf-500" />
        <div className="px-6 py-10 sm:px-10">
          <div className="relative mx-auto w-fit">
            {/* Client component, so the logo path is used directly rather than via BrandMark (which reads the filesystem). */}
            <Image src="/images/logo.png" alt="" width={1126} height={1211} className="h-20 w-auto" />
            <span className="absolute -right-2 -bottom-1 grid size-8 place-items-center rounded-full bg-amber-50 ring-2 ring-white">
              <TriangleAlert aria-hidden className="size-4 text-amber-600" />
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Something went wrong</h1>
          <p className="mt-2 text-ink-muted">
            We couldn&apos;t load this page. Please try again. If you need urgent medical help, call 112.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Go home
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
