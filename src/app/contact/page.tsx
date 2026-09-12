import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us – HealNest Bharat",
  description: "Reach out to the HealNest Bharat team for support, partnership enquiries or general questions.",
};

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

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Get in touch</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-ink-muted">
        Have a question or need help with a booking? Call us or send an email and our team will help you.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Phone aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Phone</h2>
          <p className="mt-1 text-sm text-ink-muted">Mon – Sat, 9 am – 7 pm IST</p>
          <a
            href="tel:+919653030683"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            +91 96530 30683
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Mail aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Email</h2>
          <p className="mt-1 text-sm text-ink-muted">We reply within 24 hours</p>
          <a
            href="mailto:healtnestbharat@gmail.com"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            healtnestbharat@gmail.com
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Instagram className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Instagram</h2>
          <p className="mt-1 text-sm text-ink-muted">Follow us for updates</p>
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
        For medical emergencies, please dial{" "}
        <a href="tel:112" className="font-semibold text-brand-700 underline">112</a> immediately.
      </p>
    </div>
  );
}
