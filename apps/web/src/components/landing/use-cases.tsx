import {
  MonitorSmartphone,
  Tv,
  Briefcase,
  Heart,
  Cpu,
} from "lucide-react";

const useCases = [
  {
    icon: MonitorSmartphone,
    title: "SaaS Platforms",
    description:
      "Crypto-native apps can implement monthly or yearly subscription plans, collecting payments in stablecoins with automatic renewals.",
    tag: "Popular",
  },
  {
    icon: Tv,
    title: "Content Creators",
    description:
      "Subscription-based streaming, exclusive content, and membership tiers — powered by decentralized recurring payments.",
    tag: "Trending",
  },
  {
    icon: Briefcase,
    title: "Professional Services",
    description:
      "Retainer-based consulting, legal, or accounting services with predictable recurring crypto payments.",
  },
  {
    icon: Heart,
    title: "NGOs & DAOs",
    description:
      "Enable predictable funding through automated monthly contributions. Transparent, traceable, and fully on-chain.",
  },
  {
    icon: Cpu,
    title: "API & Micro-Payments",
    description:
      "Affordable recurring charges for API access, data feeds, IoT services, or any micro-subscription model — viable with near-zero fees.",
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="relative py-24 lg:py-32">
      {/* Background accent */}
      <div className="pointer-events-none absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-main-500/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-inter text-body-sm font-semibold uppercase tracking-widest text-main-400">
            Use Cases
          </p>
          <h2 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
            Built for the{" "}
            <span className="text-gradient">subscription economy</span>
          </h2>
          <p className="mt-5 font-outfit text-body-lg text-text-secondary">
            Discover how businesses across industries leverage Subfy for
            seamless recurring crypto payments.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-lg border border-dark-500 bg-neutral-900 p-7 transition-all duration-300 hover:border-main-500/30"
            >
              {/* Tag */}
              {useCase.tag && (
                <span className="absolute right-4 top-4 rounded-full border border-main-500/30 bg-main-500/10 px-2.5 py-0.5 font-inter text-body-xs text-main-400">
                  {useCase.tag}
                </span>
              )}

              <div className="flex size-12 items-center justify-center rounded-lg border border-dark-500 bg-dark-500/30">
                <useCase.icon className="size-6 text-text-primary" />
              </div>

              <h3 className="font-sora text-body-md font-semibold text-text-primary">
                {useCase.title}
              </h3>

              <p className="font-outfit text-body-sm leading-relaxed text-text-secondary">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
