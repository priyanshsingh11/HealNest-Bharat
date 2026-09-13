import { BrandMark } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { systemMessages } from "@/lib/i18n/messages/system";
import { getMessages } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = (await getMessages(systemMessages)).notFound;
  return (
    <div className="hero-surface px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white text-center shadow-[0_24px_60px_-32px_rgb(13_82_184/0.45)] ring-1 ring-line">
        <div aria-hidden className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-leaf-500" />
        <div className="px-6 py-10 sm:px-10">
          <BrandMark className="mx-auto h-20" />
          <p className="mt-5 text-sm font-bold tracking-wider text-brand-700 uppercase">{t.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t.heading}</h1>
          <p className="mt-2 text-ink-muted">{t.body}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/discover">{t.findCare}</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              {t.home}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
