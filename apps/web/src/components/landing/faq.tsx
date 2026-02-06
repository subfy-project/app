"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Subfy?",
    answer:
      "Subfy is a decentralized subscription management protocol built on the Stellar network (Soroban). It allows businesses to accept automated recurring cryptocurrency payments without relying on centralized intermediaries — essentially, Stripe for Crypto.",
  },
  {
    question: "How does the pull-payment mechanism work?",
    answer:
      "Users grant a time-bound token allowance to the Subfy smart contract via their wallet (Freighter or Lobstr). This authorization permits the contract to withdraw a specific amount at defined intervals. The process is fully non-custodial — users can pause, resume, or revoke at any time.",
  },
  {
    question: "Which wallets are supported?",
    answer:
      "Subfy integrates with popular Stellar wallets including Freighter and Lobstr. Users sign a single authorization transaction, and subsequent recurring payments are handled automatically by the smart contract.",
  },
  {
    question: "What stablecoins can I use?",
    answer:
      "Subfy supports all Stellar-native stablecoins including USDC and EURC. Since subscriptions require price stability, stablecoins ensure that both merchants and subscribers have predictable billing amounts.",
  },
  {
    question: "What are the transaction fees?",
    answer:
      "Stellar's transaction fees are near-zero (approximately $0.00001 per transaction). This makes even micro-subscriptions like $1/week economically viable, as fees never eat into the merchant's margin.",
  },
  {
    question: "Is Subfy non-custodial?",
    answer:
      "Yes, Subfy is fully non-custodial. User funds are never locked in smart contracts. The allowance mechanism only permits the contract to pull the agreed-upon amount at the agreed-upon frequency. Users retain full sovereignty over their assets.",
  },
  {
    question: "How do I integrate Subfy into my application?",
    answer:
      "Subfy provides an SDK (available in JavaScript, Rust, and Python) and a Merchant Dashboard. You can create subscription plans, manage subscribers, and track revenue with just a few lines of code. Detailed documentation and guides are available.",
  },
  {
    question: "Can subscribers cancel at any time?",
    answer:
      "Absolutely. Subscribers maintain full control over their authorizations. They can pause, resume, or completely revoke their allowance at any time through their wallet, ensuring a trustless and user-friendly experience.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <p className="mb-3 font-inter text-body-sm font-semibold uppercase tracking-widest text-main-400">
            FAQ
          </p>
          <h2 className="font-sora text-display-3 tracking-tight text-text-primary lg:text-display-2">
            Frequently Asked Questions
          </h2>
          <p className="mt-5 font-outfit text-body-lg text-text-secondary">
            Everything you need to know about Subfy. Can&apos;t find the answer
            you&apos;re looking for? Reach out to our team.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="mt-14 flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg border border-dark-500 bg-neutral-900 transition-colors duration-200 hover:border-dark-500/80"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="pr-4 font-sora text-body-base font-medium text-text-primary">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`size-5 shrink-0 text-text-secondary transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 font-outfit text-body-sm leading-relaxed text-text-secondary">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
