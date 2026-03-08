# Subfy – The Future of On-Chain Recurring Payments

## Executive Summary

Subfy is a decentralized subscription management protocol designed to bridge the gap between traditional SaaS (Software as a Service) business models and the Web3 economy. While the subscription economy is booming, businesses currently lack a native, seamless way to accept recurring cryptocurrency payments without relying on centralized intermediaries or manual monthly transfers. Subfy leverages the speed, low cost, and smart contract capabilities of the Stellar network (Soroban) to provide a plug-and-play infrastructure for businesses to automate, manage, and scale their subscription services using digital assets.

## Project Vision & Problem Statement

Today, thousands of companies—from media streaming to cloud storage and professional services—rely on recurring revenue. However, the crypto payment landscape is predominantly transactional (one-off). For a business to accept crypto for a monthly plan, they usually face two hurdles:

**The User Friction:** Users must remember to sign a transaction every month, leading to high churn rates.

**The Integration Gap:** Merchants lack a unified dashboard to manage "allowances," track subscriber lifecycles, and handle automatic renewals on-chain.

Subfy solves this by creating a "Stripe for Crypto" experience on Stellar, allowing businesses to implement subscription logic (weekly, monthly, or yearly) with just a few lines of code.

## Why Stellar is the Ideal Blockchain for Subfy

Stellar was built for payments, making it the most logical foundation for a subscription-based protocol. Our choice is driven by three core pillars:

**Optimized for Real-World Assets & Stablecoins:** Subscriptions require price stability. Stellar's deep integration with regulated stablecoins (like USDC and EURC) and its network of global anchors make it the perfect environment for businesses that need to settle payments in assets that hold their value.

**Soroban Smart Contracts:** With the launch of Soroban, Stellar now supports the complex logic required for recurring billing. Subfy utilizes Soroban to handle "pull-payment" authorizations, where a user grants a contract the permission to withdraw a specific amount at specific intervals.

**Unrivaled Efficiency:** For a subscription model to be viable, transaction fees must not eat into the merchant's margin. Stellar's near-zero fees and 5-second settlement times ensure that even micro-subscriptions (e.g., $1/week) are economically feasible.

## Integration & Technical Architecture

Subfy is a modular protocol built natively on Soroban, leveraging Stellar's smart contract capabilities to automate recurring payments through a secure "pull-payment" architecture.

### Core Stellar Components

- **Soroban Smart Contracts (Rust/WASM):** Powers the core logic for deterministic execution and minimal fees.
- **Standard Token Interface:** Interacts directly with native assets (USDC, EURC), ensuring deep liquidity and immediate compatibility without custom wrappers.
- **Allowance & Auth Pattern:** Utilizes Soroban's native allowance mechanism. Users grant time-bound authorizations, enabling automated recurring transfers without requiring monthly manual signatures, thus reducing churn.
- **Stellar RPC & SDKs:** Uses soroban-sdk for on-chain logic and stellar-sdk for seamless off-chain indexing via Horizon, powering real-time merchant analytics.

### Smart Contract Architecture

- **Subscription Registry:** A decentralized ledger storing billing frequencies, merchant addresses, and next-execution timestamps.
- **Execution Logic:** A permissionless function that validates timing and allowance constraints before triggering the transfer_from call on the token contract.
- **Lifecycle Management:** Self-service functions for users to pause, resume, or revoke authorizations, ensuring full non-custodial sovereignty.

### Off-Chain Layer

- **Merchant SDK:** An abstraction layer for businesses to integrate "Pay with Subfy" buttons and manage plans via API.
- **Indexing Engine:** Monitors Soroban Events to provide a high-performance dashboard for tracking MRR and subscriber health.
- **Wallet Compatibility:** Standard integration with Freighter and Lobstr for secure transaction signing.

## Value Add to the Stellar Ecosystem

Subfy represents a significant "plus-value" for Stellar by expanding its utility from a remittance/trading network to a commercial layer for the global digital economy:

- **Driving On-Chain Volume:** By automating recurring payments, Subfy generates consistent, predictable transaction volume on the network.
- **Attracting Web2 Businesses:** Subfy lowers the barrier to entry for traditional companies (SaaS, Content Creators, NGOs) to join the Stellar ecosystem, providing them with a familiar business model (recurring revenue) in a decentralized format.
- **Enhancing the DeFi Stack:** A subscription protocol is a foundational "money lego." Other projects on Stellar can build on top of Subfy—for example, a decentralized insurance platform could use Subfy to collect monthly premiums.
- **Promoting Stablecoin Adoption:** By making it easy to pay for daily services in USDC or EURC, Subfy encourages users to keep their capital within the Stellar network rather than off-ramping.

## Conclusion

Subfy is more than just a payment gateway; it is the infrastructure layer that will enable the next generation of "Subscription-native" Web3 companies. By combining the power of Soroban smart contracts with Stellar's payment-centric DNA, Subfy provides a scalable, secure, and user-friendly solution for the $600 billion subscription economy. Participation in SCF#41 will allow us to accelerate our development, conduct rigorous security audits, and onboard our first cohort of pilot merchants to the Stellar network.
