import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy – HealNest Bharat",
  description: "How HealNest Bharat collects, uses and protects your personal data.",
};

const LAST_UPDATED = "1 September 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none text-ink-muted [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mt-1.5">
        <p>
          HealNest Bharat Pvt. Ltd. ("we", "our" or "HealNest Bharat") operates the HealNest Bharat platform — a
          marketplace connecting individuals with verified home-visit care professionals. This Privacy Policy explains
          what personal data we collect, why we collect it, and how we protect it.
        </p>

        <h2>1. Data we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email address, phone number and role (patient / provider / admin).</li>
          <li><strong>Location data:</strong> locality and pin code you share when searching for providers.</li>
          <li><strong>Booking data:</strong> service type, scheduled date/time, visit address, and payment status.</li>
          <li><strong>Provider data:</strong> professional registration numbers, certifications and service listings.</li>
          <li><strong>Usage data:</strong> pages visited, search queries and in-app actions, collected via server logs.</li>
        </ul>

        <h2>2. How we use your data</h2>
        <ul>
          <li>To match you with care professionals in your area.</li>
          <li>To process, confirm and manage bookings.</li>
          <li>To send transactional notifications (booking confirmations, reminders).</li>
          <li>To verify provider credentials and maintain platform safety.</li>
          <li>To improve and personalise the platform experience.</li>
          <li>To comply with applicable Indian laws and regulations.</li>
        </ul>

        <h2>3. Data sharing</h2>
        <p>
          We do not sell your personal data. We share limited data with:
        </p>
        <ul>
          <li><strong>Care providers:</strong> only the information they need to fulfil your booking.</li>
          <li><strong>Payment processors:</strong> for secure transaction handling (no card data is stored by us).</li>
          <li><strong>Infrastructure providers:</strong> Supabase (database), Vercel (hosting) — both subject to data-processing agreements.</li>
          <li><strong>Regulators:</strong> when required by law or a valid court order.</li>
        </ul>

        <h2>4. Data retention</h2>
        <p>
          We retain account and booking data for a minimum of three years as required under applicable Indian
          regulations. You may request deletion of your account at any time; residual anonymised data may be kept for
          analytics purposes.
        </p>

        <h2>5. Your rights</h2>
        <p>
          Under the Digital Personal Data Protection Act 2023 (DPDPA) you have the right to access, correct, and erase
          your personal data. To exercise any right, email{" "}
          <a href="mailto:privacy@healnest.in" className="font-medium text-brand-700 hover:underline">
            privacy@healnest.in
          </a>.
        </p>

        <h2>6. Cookies</h2>
        <p>
          We use strictly necessary cookies to maintain your login session. No third-party advertising or tracking
          cookies are used.
        </p>

        <h2>7. Contact</h2>
        <p>
          Questions about this policy? Reach our Data Protection Officer at{" "}
          <a href="mailto:privacy@healnest.in" className="font-medium text-brand-700 hover:underline">
            privacy@healnest.in
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
