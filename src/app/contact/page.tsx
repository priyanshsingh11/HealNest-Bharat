import { Mail, Phone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us – HealNest Bharat",
  description: "Reach out to the HealNest Bharat team for support, partnership enquiries or general questions.",
};

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

      </div>

      <p className="mt-8 text-xs text-ink-muted">
        For medical emergencies, please dial{" "}
        <a href="tel:112" className="font-semibold text-brand-700 underline">112</a> immediately.
      </p>
    </div>
  );
}
