import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-logo";
import { StaffLoginForm } from "@/components/staff-login-form";
import { staffLoginConfigured } from "@/lib/staff";

/**
 * Staff sign-in. Deliberately unlinked from the rest of the site and kept out of search engines: the only way
 * in is knowing this path *and* ADMIN_PASSCODE. The passcode is checked server-side in /api/session.
 */
export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false, nocache: true },
};

export default function StaffLoginPage() {
  return (
    <div className="hero-surface">
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <BrandMark className="mx-auto h-16" />
        <h1 className="mt-6 text-center text-2xl font-extrabold tracking-tight text-ink">Staff sign-in</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">For HealNest staff only.</p>
        <StaffLoginForm configured={staffLoginConfigured()} />
      </div>
    </div>
  );
}
