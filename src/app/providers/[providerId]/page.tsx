import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmergencyBanner } from "@/components/emergency-banner";
import { ProviderProfileView } from "@/components/provider-profile";
import { getRepository } from "@/lib/db";
import { roundedDistanceKm } from "@/lib/geo";
import { flattenParams, locationFromParams, toQuery } from "@/lib/location";

type PageProps = {
  params: Promise<{ providerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const provider = await getRepository().getProvider((await params).providerId);
  return { title: provider ? provider.name : "Provider not found" };
}

export default async function ProviderPage({ params, searchParams }: PageProps) {
  const { providerId } = await params;
  const location = locationFromParams(flattenParams(await searchParams));
  const repo = getRepository();

  const provider = await repo.getProvider(providerId);
  if (!provider || !provider.active) notFound();

  const [services, slots, reviews, config] = await Promise.all([
    repo.listServices({ providerId }),
    repo.listSlots({ providerId, from: new Date().toISOString(), status: "open" }),
    repo.listReviews(providerId),
    repo.getPlatformConfig(),
  ]);

  const locationQuery = location ? { lat: location.latitude, lng: location.longitude, label: location.label } : {};
  const distanceKm = location ? roundedDistanceKm(location, provider.baseLocation) : null;

  return (
    <>
      <EmergencyBanner emergencyNumber={config.emergencyNumber} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href={`/discover${toQuery({ ...locationQuery, category: provider.category })}`}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" /> Back to results
        </Link>
        <ProviderProfileView
          provider={provider}
          services={services.filter((s) => s.active)}
          slots={slots}
          reviews={reviews}
          config={config}
          location={location}
          distanceKm={distanceKm}
          bookingHref={(extra) => `/booking/new${toQuery({ providerId: provider.id, ...extra, ...locationQuery })}`}
        />
      </div>
    </>
  );
}
