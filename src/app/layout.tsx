import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HealNest Bharat — Verified home care near you",
    template: "%s · HealNest Bharat",
  },
  description:
    "Home nursing, injections & IV, wound dressing, catheter care, elderly care, post-operative care, physiotherapy and home lab collection from verified providers near you, with transparent itemised pricing.",
};

export const viewport: Viewport = {
  themeColor: "#0b6a61",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
