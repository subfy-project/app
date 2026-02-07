import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { WhyStellar } from "@/components/landing/why-stellar";
import { FAQ } from "@/components/landing/faq";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-950">
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
