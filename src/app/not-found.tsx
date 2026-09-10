import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-ink-muted">The provider or booking may no longer exist, or the link may be incorrect.</p>
      <div className="mt-6 flex justify-center gap-2">
        <ButtonLink href="/discover">Find care</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </div>
  );
}
