import { Mail, MapPin, Phone } from "lucide-react";
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
        Have a question, feedback, or need help with a booking? We're here for you. Reach out through any of the
        channels below and our team will get back to you within one business day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Phone aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Phone</h2>
          <p className="mt-1 text-sm text-ink-muted">Mon – Sat, 9 am – 7 pm IST</p>
          <a
            href="tel:+918800000000"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            +91 88000 00000
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Mail aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Email</h2>
          <p className="mt-1 text-sm text-ink-muted">We reply within 24 hours</p>
          <a
            href="mailto:support@healnest.in"
            className="mt-2 block text-sm font-semibold text-brand-700 hover:underline"
          >
            support@healnest.in
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <MapPin aria-hidden className="size-5" />
          </span>
          <h2 className="mt-3 font-semibold text-ink">Office</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Sector 62, Noida<br />
            Uttar Pradesh 201301<br />
            India
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Send us a message</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Fill in the form below and we'll get back to you shortly.
        </p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" action="#" method="POST">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Priya Sharma"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="priya@example.com"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contact-subject" className="block text-sm font-medium text-ink">
              Subject
            </label>
            <input
              id="contact-subject"
              name="subject"
              type="text"
              required
              placeholder="Booking help / Partnership / Other"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="contact-message" className="block text-sm font-medium text-ink">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              placeholder="Tell us how we can help…"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              Send message
            </button>
          </div>
        </form>
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        For medical emergencies, do <strong>not</strong> use this form. Please dial{" "}
        <a href="tel:112" className="font-semibold text-brand-700 underline">112</a> immediately.
      </p>
    </div>
  );
}
