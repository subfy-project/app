import { Button } from "@subfy/ui";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-main-500/20 bg-gradient-to-br from-main-500/10 via-neutral-900 to-neutral-900 p-10 lg:p-16">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-main-500/10 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-main-400/10 blur-[80px]" />
          </div>

          <div className="relative flex flex-col items-center gap-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl border border-main-500/30 bg-main-500/10">
              <Sparkles className="size-7 text-main-400" />
            </div>

            <h2 className="max-w-2xl font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
              Ready to build the future of{" "}
              <span className="text-gradient">recurring payments?</span>
            </h2>

            <p className="max-w-xl font-outfit text-body-lg text-text-secondary">
              Start accepting automated subscription payments in stablecoins
              today. No credit card required — just connect your Stellar wallet
              and go.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="primary" size="lg">
                  Get Started Free
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Read the Docs
                </Button>
              </a>
            </div>

            <p className="font-outfit text-body-xs text-text-secondary">
              Your data stays private — always non-custodial and secure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
