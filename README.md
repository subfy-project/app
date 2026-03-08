# Subfy – The Future of On-Chain Recurring Payments

**MVP (Minimum Viable Product) Edition**

## Overview

Subfy is a decentralized subscription management protocol designed to bridge the gap between traditional SaaS business models and the Web3 economy. It leverages the speed, low cost, and smart contract capabilities of the Stellar network (Soroban) to provide plug-and-play infrastructure for businesses to automate, manage, and scale their subscription services using digital assets—without relying on centralized intermediaries or manual monthly transfers. Think of it as **"Stripe for Crypto"** on Stellar.

## The Problem

Today, thousands of companies rely on recurring revenue, but the crypto payment landscape is predominantly transactional (one-off). For a business to accept crypto for a monthly plan, they usually face two hurdles:

1. **User Friction:** Users must remember to sign a transaction every month, leading to high churn rates.
2. **Integration Gap:** Merchants lack a unified dashboard to manage allowances, track subscriber lifecycles, and handle automatic renewals on-chain.

Subfy solves this by creating a familiar subscription experience on Stellar, allowing businesses to implement recurring logic (weekly, monthly, or yearly) with minimal integration effort.

## Why Stellar?

Stellar was built for payments, making it the ideal foundation for a subscription-based protocol:

- **Optimized for Real-World Assets & Stablecoins:** Deep integration with USDC, EURC, and global anchors ensures price stability for business operations.
- **Soroban Smart Contracts:** Enables the complex logic required for recurring billing and "pull-payment" authorizations.
- **Unrivaled Efficiency:** Near-zero fees and 5-second settlement times make even micro-subscriptions (e.g., $1/week) economically feasible.

## Documentation

- **[Full project description](docs/description.md)** — Executive summary, vision, problem statement, why Stellar, integration & architecture, value to the ecosystem.
- **[Technical architecture](docs/technical-architecture.md)** — Component diagrams, Soroban contract focus, runtime flows, and deployment view.

## Project Structure

This monorepo contains:

```
├── apps/
│   ├── web/           # Web dashboard for merchants
│   └── api/           # Backend API services
├── packages/
│   ├── ui/            # Shared UI components
│   └── shared/        # Shared utilities and types
└── package.json       # Root workspace configuration
```

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v10.26.1 (specified in `packageManager`)

### Installation

Clone the repository and install dependencies:

```bash
# Install all dependencies
pnpm install
```

### Running the Project

Start the development server for all applications:

```bash
# Start all development servers
pnpm dev
```

Individual apps can be started from their respective directories:

```bash
# Start web dashboard
cd apps/web && pnpm dev

# Start API server
cd apps/api && pnpm dev
```

### Available Scripts

- **`pnpm dev`** — Start all development servers using Turbo
- **`pnpm build`** — Build all applications and packages
- **`pnpm typecheck`** — Run TypeScript type checking
- **`pnpm lint`** — Run linters across the monorepo
- **`pnpm test`** — Run test suites
- **`pnpm clean`** — Clean all build artifacts and dependencies

## Use Cases

Subfy enables recurring payment models for:

- **SaaS Platforms** — Crypto-native apps with monthly/yearly plans
- **Content Creators** — Subscription-based streaming or exclusive content
- **Professional Services** — Retainer-based blockchain consulting
- **NGOs & DAOs** — Predictable funding through automated contributions
- **Micro-Payments** — Affordable recurring services like API access or data feeds


## Technology Stack

- **Smart Contracts**: Soroban (Rust/WASM)
- **Frontend**: React/Next.js
- **Backend**: Node.js (NestJS or Express)
- **Blockchain**: Stellar Network
- **Package Manager**: pnpm
- **Monorepo Tool**: Turbo

---

## Soroban Resources

- Contract workspace and scripts: `contracts/` and `scripts/soroban/`
- Testnet app integration guide: `docs/soroban-testnet-integration.md`

---

**Questions or feedback?** Open an issue or reach out to the development team.
