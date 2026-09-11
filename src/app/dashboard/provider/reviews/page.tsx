import type { Metadata } from "next";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { ReviewsPanel } from "@/components/reviews/reviews-panel";
import { Card, SectionHeading } from "@/components/ui/card";
import { getProviderDashboard } from "@/lib/provider-dashboard";

export const metadata: Metadata = { title: "Ratings & reviews" };

export default async function ProviderReviewsPage() {
  const { session, repo, provider, pickerOptions } = await getProviderDashboard();
  if (!provider) return <ProviderGate pickerOptions={pickerOptions} missing={session.role === "provider"} />;

  const reviews = await repo.listReviews(provider.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} pickerOptions={pickerOptions} eyebrow="Ratings & reviews" />
      <Card className="mt-8 p-6">
        <SectionHeading
          title="What your patients say"
          description="Customers rate completed visits: overall stars, punctuality, how clearly you explain, care & courtesy, and value for money. Reviews from bookings are marked as verified visits."
        />
        <ReviewsPanel reviews={reviews} rating={provider.rating} reviewCount={provider.reviewCount} />
      </Card>
    </div>
  );
}
