import { Settings, KeyRound, RefreshCcw } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Merchant Creates a Plan",
    description:
      "Use the Subfy SDK or Merchant Dashboard to define subscription plans — set pricing in USDC/EURC, billing frequency, and plan details.",
    code: `await subfy.plans.create({
  name: 'Pro Plan',
  amount: '9.99',
  currency: 'USDC',
  interval: 'monthly',
});`,
  },
  {
    number: "02",
    icon: KeyRound,
    title: "User Authorizes Allowance",
    description:
      "Subscribers approve a one-time, time-bound token allowance via their Freighter or Lobstr wallet. No funds are locked — full control stays with the user.",
    code: `// One-time wallet approval
await subfy.authorize({
  planId: 'plan_abc123',
  wallet: userWallet,
  // Time-bound allowance
});`,
  },
  {
    number: "03",
    icon: RefreshCcw,
    title: "Automatic Recurring Payments",
    description:
      "Soroban smart contracts handle the rest. At each billing cycle, the contract validates timing and allowance, then executes the transfer automatically.",
    code: `// Executed automatically by Soroban
// contract.transfer_from(
//   subscriber, merchant,
//   amount, token
// )
// ✓ Validated timing
// ✓ Checked allowance
// ✓ Payment complete`,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-inter text-body-sm font-semibold uppercase tracking-widest text-main-400">
            How It Works
          </p>
          <h2 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
            Three steps to{" "}
            <span className="text-gradient">automated payments</span>
          </h2>
          <p className="mt-5 font-outfit text-body-lg text-text-secondary">
            From plan creation to automatic renewals — get up and running in
            minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 flex flex-col gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group grid items-center gap-8 rounded-lg border border-dark-500 bg-neutral-900 p-8 transition-all duration-300 hover:border-main-500/30 lg:grid-cols-2 lg:gap-12 lg:p-10"
            >
              {/* Content - alternate sides */}
              <div
                className={`flex flex-col gap-5 ${index % 2 === 1 ? "lg:order-2" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-sora text-display-3 font-bold text-main-500/20">
                    {step.number}
                  </span>
                  <div className="flex size-11 items-center justify-center rounded-lg border border-main-500/20 bg-main-500/10">
                    <step.icon className="size-5 text-main-400" />
                  </div>
                </div>
                <h3 className="font-sora text-body-lg font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="font-outfit text-body-base leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>

              {/* Code Block */}
              <div
                className={`overflow-hidden rounded-lg border border-dark-500/60 bg-neutral-950 ${index % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <div className="flex items-center gap-2 border-b border-dark-500/60 px-4 py-2.5">
                  <div className="size-2.5 rounded-full bg-danger/50" />
                  <div className="size-2.5 rounded-full bg-[#FFD666]/50" />
                  <div className="size-2.5 rounded-full bg-success/50" />
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-text-secondary">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
