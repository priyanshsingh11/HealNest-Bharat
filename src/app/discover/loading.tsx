export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading nearby providers…</p>
      <div className="h-8 w-72 animate-pulse rounded-lg bg-line" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-28 animate-pulse rounded-full bg-line" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-line lg:block" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-line" />
          ))}
        </div>
      </div>
    </div>
  );
}
