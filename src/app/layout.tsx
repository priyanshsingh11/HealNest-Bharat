import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Devanagari } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { layoutMessages } from "@/lib/i18n/messages/layout";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
/** Manrope has no Devanagari glyphs; the browser falls back to this for Hindi text. */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

const METADATA: Record<Locale, Metadata> = {
  en: {
    title: {
      default: "HealNest Bharat — Verified home care near you",
      template: "%s · HealNest Bharat",
    },
    description:
      "Home nursing, injections & IV, wound dressing, catheter care, elderly care, post-operative care, physiotherapy and home lab collection from verified providers near you, with transparent itemised pricing.",
  },
  hi: {
    title: {
      default: "HealNest Bharat — आपके पास सत्यापित होम केयर",
      template: "%s · HealNest Bharat",
    },
    description:
      "होम नर्सिंग, इंजेक्शन और IV, घाव की ड्रेसिंग, कैथेटर देखभाल, बुज़ुर्गों की देखभाल, ऑपरेशन के बाद की देखभाल, फिजियोथेरेपी और घर पर लैब सैंपल — आपके पास के सत्यापित सेवा प्रदाताओं से, साफ़ और पूरी कीमत के साथ।",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { ...METADATA[await getLocale()], icons: { icon: "/images/logo.png", apple: "/images/logo.png" } };
}

export const viewport: Viewport = {
  themeColor: "#0d52b8",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const t = await getMessages(layoutMessages);
  return (
    <html lang={INTL_LOCALE[locale]} className={`${manrope.variable} ${devanagari.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a href="#main" className="skip-link">
          {t.skipToContent}
        </a>
        <LocaleProvider locale={locale}>
          <AppShell>{children}</AppShell>
        </LocaleProvider>
      </body>
    </html>
  );
}
