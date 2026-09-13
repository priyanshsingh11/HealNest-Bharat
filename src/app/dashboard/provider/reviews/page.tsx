import type { Metadata } from "next";
import { ProviderDashboardHeader, ProviderGate } from "@/components/dashboard/provider-header";
import { ReviewsPanel } from "@/components/reviews/reviews-panel";
import { Card, SectionHeading } from "@/components/ui/card";
import { providerDashboardMessages } from "@/lib/i18n/messages/provider-dashboard";
import { getMessages } from "@/lib/i18n/server";
import { getProviderDashboard } from "@/lib/provider-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(providerDashboardMessages);
  return { title: t.reviews.title };
}

export default async function ProviderReviewsPage() {
  const { session, repo, provider } = await getProviderDashboard();
  if (!provider) return <ProviderGate missing={session.role === "provider"} />;

  const [reviews, { reviews: t }] = await Promise.all([repo.listReviews(provider.id), getMessages(providerDashboardMessages)]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProviderDashboardHeader provider={provider} eyebrow={t.title} />
      <Card className="mt-8 p-6">
        <SectionHeading
          title={t.heading}
          description={t.description}
        />
        <ReviewsPanel reviews={reviews} rating={provider.rating} reviewCount={provider.reviewCount} />
      </Card>
    </div>
  );
}
