import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service – HealNest Bharat",
  description: "Terms and conditions for using the HealNest Bharat home-care marketplace.",
};

const LAST_UPDATED = "1 September 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none text-ink-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mt-1.5">
        <p>
          These Terms of Service ("Terms") govern your use of the HealNest Bharat platform operated by HealNest Bharat
          Pvt. Ltd. ("Company", "we" or "us"). By creating an account or using our services you agree to these Terms.
        </p>

        <h2>1. Nature of the platform</h2>
        <p>
          HealNest Bharat is a <strong>marketplace</strong> that connects individuals seeking home-visit care with
          independent care professionals. We do not employ care providers and are not a medical institution. We do
          not provide medical diagnosis, medical advice, or emergency care. For emergencies, call{" "}
          <a href="tel:112" className="font-medium text-brand-700 hover:underline">112</a>.
        </p>

        <h2>2. Eligibility</h2>
        <ul>
          <li>You must be at least 18 years old to create an account.</li>
          <li>Providers must hold valid professional registrations as required by Indian law.</li>
          <li>You must provide accurate and current information at registration.</li>
        </ul>

        <h2>3. Bookings and payments</h2>
        <ul>
          <li>A booking is confirmed only after the provider accepts the request.</li>
          <li>Prices shown are visit-fee estimates; the final itemised quote is shown before confirmation.</li>
          <li>Payments are processed securely by our payment partner; we do not store card details.</li>
          <li>Cancellation and refund policies are shown at the time of booking.</li>
        </ul>

        <h2>4. Provider responsibilities</h2>
        <ul>
          <li>Providers must maintain valid licences, certifications, and insurance throughout their time on the platform.</li>
          <li>Providers must arrive on time and render services as described in their listing.</li>
          <li>Medicines and injections are administered only against a valid prescription from a registered medical practitioner.</li>
        </ul>

        <h2>5. Patient responsibilities</h2>
        <ul>
          <li>Provide a safe and accessible environment for the visiting professional.</li>
          <li>Disclose relevant medical information truthfully during the booking process.</li>
          <li>Do not request services outside the agreed scope without amending the booking.</li>
        </ul>

        <h2>6. Prohibited conduct</h2>
        <ul>
          <li>Submitting false reviews or fraudulent booking requests.</li>
          <li>Circumventing the platform to pay providers directly and avoid fees.</li>
          <li>Harassment or abuse of any platform participant.</li>
        </ul>

        <h2>7. Limitation of liability</h2>
        <p>
          To the extent permitted by law, the Company's aggregate liability for any claim arising from platform use
          shall not exceed the amount paid by you for the relevant booking.
        </p>

        <h2>8. Governing law</h2>
        <p>
          These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of
          courts in Noida, Uttar Pradesh.
        </p>

        <h2>9. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be notified via email or an in-app banner
          at least 14 days before they take effect.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions? Write to{" "}
          <a href="mailto:legal@healnest.in" className="font-medium text-brand-700 hover:underline">
            legal@healnest.in
          </a>{" "}
          or visit our{" "}
          <Link href="/contact" className="font-medium text-brand-700 hover:underline">
            Contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
