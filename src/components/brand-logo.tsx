import { existsSync } from "node:fs";
import path from "node:path";
import { HeartPulse } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/** Official HealNest Bharat mark: house, caring hand and leaf. Transparent PNG, 1126 × 1211. */
export const LOGO_SRC = "/images/logo.png";

function logoAvailable(): boolean {
  return existsSync(path.join(process.cwd(), "public", LOGO_SRC));
}

/** Decorative logo mark — pair it with the wordmark. Until the logo file is added, shows a blue-to-green icon tile. */
export function BrandMark({ className }: { className?: string }) {
  if (!logoAvailable()) {
    return (
      <span
        aria-hidden
        className={cn("grid aspect-square place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-leaf-500 text-white", className)}
      >
        <HeartPulse className="size-1/2" />
      </span>
    );
  }
  return <Image src={LOGO_SRC} alt="" width={1126} height={1211} className={cn("w-auto object-contain", className)} />;
}

/** Two-tone name, echoing the logo: blue "HealNest", green "Bharat". `light` is for dark backgrounds. */
export function Wordmark({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <span className={cn("font-extrabold tracking-tight", className)}>
      <span className={tone === "light" ? "text-white" : "text-brand-700"}>HealNest</span>{" "}
      <span className={tone === "light" ? "text-leaf-300" : "text-leaf-700"}>Bharat</span>
    </span>
  );
}
