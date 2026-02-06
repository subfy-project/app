import { Badge } from "@subfy/ui";

const reasons = [
  {
    stat: "$0.00001",
    label: "Per Transaction",
    description:
      "Stellar's near-zero fees make micro-subscriptions economically viable. Even a $1/week plan is profitable for merchants.",
  },
  {
    stat: "~5 sec",
    label: "Settlement Time",
    description:
      "Lightning-fast consensus ensures subscribers and merchants experience near-instant payment confirmation.",
  },
  {
    stat: "USDC / EURC",
    label: "Stablecoin Native",
    description:
      "Subscriptions require price stability. Stellar's deep integration with regulated stablecoins ensures reliable billing.",
  },
  {
    stat: "Soroban",
    label: "Smart Contracts",
    description:
      "Soroban enables the complex pull-payment logic needed for recurring billing with deterministic execution and minimal overhead.",
  },
];

export function WhyStellar() {
  return (
    <section id="why-stellar" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-6">
            <p className="font-inter text-body-sm font-semibold uppercase tracking-widest text-main-400">
              Why Stellar
            </p>
            <h2 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
              The ideal blockchain for{" "}
              <span className="text-gradient">subscription payments</span>
            </h2>
            <p className="font-outfit text-body-lg leading-relaxed text-text-secondary">
              Stellar was built for payments, making it the most logical
              foundation for a subscription protocol. Low fees, fast settlement,
              and native stablecoin support create the perfect environment for
              recurring billing.
            </p>

            <div className="mt-2 flex flex-wrap gap-3">
              <Badge variant="active">Payment-First Chain</Badge>
              <Badge variant="default">Global Anchors</Badge>
              <Badge variant="default">Regulatory Compliant</Badge>
            </div>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div
                key={reason.label}
                className="flex flex-col gap-3 rounded-lg border border-dark-500 bg-neutral-900 p-6 transition-all duration-300 hover:border-main-500/30"
              >
                <p className="font-sora text-display-3 font-bold text-gradient">
                  {reason.stat}
                </p>
                <p className="font-inter text-body-sm font-semibold text-text-primary">
                  {reason.label}
                </p>
                <p className="font-outfit text-body-xs leading-relaxed text-text-secondary">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
