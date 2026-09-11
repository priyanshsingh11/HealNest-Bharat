import { BrandMark } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="hero-surface px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white text-center shadow-[0_24px_60px_-32px_rgb(13_82_184/0.45)] ring-1 ring-line">
        <div aria-hidden className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-leaf-500" />
        <div className="px-6 py-10 sm:px-10">
          <BrandMark className="mx-auto h-20" />
          <p className="mt-5 text-sm font-bold tracking-wider text-brand-700 uppercase">Error 404</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">We couldn&apos;t find that page</h1>
          <p className="mt-2 text-ink-muted">The provider or booking may no longer exist, or the link may be incorrect.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/discover">Find care</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Home
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
