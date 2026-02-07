import { Button } from "@subfy/ui";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { CodeExample } from "./code-example";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[72px]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-main-500/5 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-main-400/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        {/* Trust Badge */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-bg px-3 py-1">
            <img
              src="/stellar-xlm-logo.svg"
              alt="Stellar"
              className="size-4 brightness-0 invert"
            />
            <span className="font-outfit text-body-xs text-success">
              Built on Stellar
            </span>
          </div>
          <span className="font-outfit text-body-xs text-text-secondary">
            Powered by Soroban Smart Contracts
          </span>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Copy */}
          <div className="flex flex-col gap-8">
            <h1 className="font-sora text-display-2 leading-[1.1] tracking-tight text-text-primary lg:text-display-1">
              The Future of{" "}
              <span className="text-gradient">On-Chain</span>
              <br />
              Recurring Payments
            </h1>

            <p className="max-w-lg font-outfit text-body-lg leading-relaxed text-text-secondary">
              Subfy is{" "}
              <span className="text-text-primary">Stripe for Crypto</span> —
              enabling businesses to automate subscription payments on Stellar
              with near-zero fees and 5-second settlement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/whitelist">
                <Button variant="primary" size="lg">
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/subfy-project/app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Documentation
                </Button>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-8 border-t border-dark-500/50 pt-8">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-main-500/10">
                  <Zap className="size-5 text-main-500" />
                </div>
                <div>
                  <p className="font-inter text-body-sm font-semibold text-text-primary">
                    ~5 sec
                  </p>
                  <p className="font-outfit text-body-xs text-text-secondary">
                    Settlement
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-main-500/10">
                  <Shield className="size-5 text-main-500" />
                </div>
                <div>
                  <p className="font-inter text-body-sm font-semibold text-text-primary">
                    Non-Custodial
                  </p>
                  <p className="font-outfit text-body-xs text-text-secondary">
                    Full control
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-main-500/10">
                  <Globe className="size-5 text-main-500" />
                </div>
                <div>
                  <p className="font-inter text-body-sm font-semibold text-text-primary">
                    Near-Zero
                  </p>
                  <p className="font-outfit text-body-xs text-text-secondary">
                    Transaction fees
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Code Example */}
          <div className="relative">
            <CodeExample />
          </div>
        </div>
      </div>
    </section>
  );
}
