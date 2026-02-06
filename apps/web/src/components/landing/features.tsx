import {
  ArrowDownUp,
  ShieldCheck,
  Coins,
  Timer,
  Wallet,
  LayoutDashboard,
} from "lucide-react";

const features = [
  {
    icon: ArrowDownUp,
    title: "Pull-Payment Architecture",
    description:
      "Users grant time-bound authorizations for automated recurring transfers. No manual monthly signatures required.",
  },
  {
    icon: ShieldCheck,
    title: "Non-Custodial",
    description:
      "Users maintain full sovereignty over their funds. No assets are ever locked in smart contracts. Pause, resume, or revoke anytime.",
  },
  {
    icon: Coins,
    title: "Near-Zero Fees",
    description:
      "Stellar's transaction fees cost pennies, making even micro-subscriptions like $1/week economically viable for any business.",
  },
  {
    icon: Timer,
    title: "5-Second Settlement",
    description:
      "Lightning-fast confirmation times on Stellar ensure rapid transaction finality for both merchants and subscribers.",
  },
  {
    icon: Wallet,
    title: "Stablecoin Support",
    description:
      "Deep integration with USDC, EURC, and other regulated stablecoins ensures price stability for your business operations.",
  },
  {
    icon: LayoutDashboard,
    title: "Merchant Dashboard",
    description:
      "Real-time tracking of MRR, subscriber lifecycle, churn rates, and revenue analytics — all from one unified interface.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      {/* Background accent */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-main-500/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-inter text-body-sm font-semibold uppercase tracking-widest text-main-400">
            Features
          </p>
          <h2 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
            Everything you need to accept{" "}
            <span className="text-gradient">recurring crypto payments</span>
          </h2>
          <p className="mt-5 font-outfit text-body-lg text-text-secondary">
            A complete infrastructure for automating subscription billing on
            Stellar — from smart contracts to merchant analytics.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-lg border border-dark-500 bg-neutral-900 p-7 transition-all duration-300 hover:border-main-500/30 hover:bg-neutral-900/80"
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-main-500/10 blur-3xl" />
              </div>

              <div className="relative">
                <div className="mb-5 flex size-12 items-center justify-center rounded-lg border border-main-500/20 bg-main-500/10">
                  <feature.icon className="size-6 text-main-400" />
                </div>
                <h3 className="mb-3 font-sora text-body-md font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="font-outfit text-body-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
