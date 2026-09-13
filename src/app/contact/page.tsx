import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/contact";
import { contactMessages } from "@/lib/i18n/messages/contact";
import { getMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(contactMessages);
  return { title: t.metaTitle, description: t.metaDescription };
}

/** lucide-react dropped brand marks, so the Instagram glyph is drawn inline. */
function Instagram({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.0" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default async function ContactPage() {
  const t = await getMessages(contactMessages);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{t.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t.heading}</h1>
      <p className="mt-3 text-ink-muted">{t.intro}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <WhatsAppIcon className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">{t.whatsapp.heading}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.whatsapp.body}</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            {WHATSAPP_DISPLAY}
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Mail aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">{t.email.heading}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.email.body}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 block break-all text-sm font-semibold text-brand-700 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Instagram className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">{t.instagram.heading}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.instagram.body}</p>
          <a
            href="https://www.instagram.com/freakin_doc?stkn=MWMzaWx5a242cnQ1dA=="
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            @freakin_doc
          </a>
        </div>

      </div>

      <p className="mt-8 text-xs text-ink-muted">
        {t.emergencyBefore}
        <a href="tel:112" className="font-semibold text-brand-700 underline">112</a>
        {t.emergencyAfter}
      </p>
    </div>
  );
}
