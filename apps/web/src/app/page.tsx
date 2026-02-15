import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { WhyStellar } from "@/components/landing/why-stellar";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import type { Metadata } from "next";
import { OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Onchain Subscription Infrastructure",
  description:
    "Create plans, manage subscriptions, and automate recurring payments on Stellar with Subfy.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Create plans, manage subscriptions, and automate recurring payments on Stellar.",
        url: SITE_URL,
        image: `${SITE_URL}${OG_IMAGE_PATH}`,
        brand: {
          "@id": `${SITE_URL}/#organization`,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-950">
      <script
        type="application/ld+json"
        // JSON-LD enables richer semantic understanding by search engines.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingNavbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <WhyStellar />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
