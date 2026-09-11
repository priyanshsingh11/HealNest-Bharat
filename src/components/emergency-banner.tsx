import { Siren } from "lucide-react";

/** Shown on every care-seeking screen. HealNest Bharat is not an emergency or diagnostic service. */
export function EmergencyBanner({ emergencyNumber = "112", compact = false }: { emergencyNumber?: string; compact?: boolean }) {
  return (
    <aside
      aria-label="Emergency notice"
      className={
        compact
          ? "flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          : "border-b border-rose-200 bg-rose-50 text-rose-900"
      }
    >
      <div className={compact ? "contents" : "mx-auto flex max-w-7xl items-start gap-2 px-2 py-2.5 text-sm sm:items-center sm:px-6"}>
        <Siren aria-hidden className="mt-0.5 size-4 shrink-0 sm:mt-0" />
        <p>
          <strong>For life-threatening emergencies, contact local emergency services</strong> (dial{" "}
          <a href={`tel:${emergencyNumber}`} className="font-bold underline underline-offset-2">
            {emergencyNumber}
          </a>{" "}
          in India). HealNest Bharat does not provide emergency care or diagnosis.
        </p>
      </div>
    </aside>
  );
}
