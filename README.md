# Subfy – The Future of On-Chain Recurring Payments

**MVP (Minimum Viable Product) Edition**

## Overview

Subfy is a decentralized subscription management protocol built on the Stellar network (Soroban). It enables businesses to seamlessly accept recurring cryptocurrency payments without relying on centralized intermediaries or manual monthly transfers. Think of it as "Stripe for Crypto"—bringing the familiar subscription economy to Web3.

## The Problem

Today's crypto payment landscape is predominantly transactional (one-off transfers). Businesses that want to accept crypto for subscriptions face two major challenges:

1. **User Friction**: Customers must manually approve transactions every month, leading to high churn rates
2. **Integration Gap**: Merchants lack a unified dashboard to manage subscriptions, track subscribers, and automate renewals on-chain

Subfy solves this by providing plug-and-play infrastructure for automated, recurring payments using digital assets on Stellar.

## Why Stellar?

Stellar is the ideal blockchain for subscription payments:

- **Built for Payments**: Stellar's core DNA is optimized for real-world value transfer
- **Soroban Smart Contracts**: Enable complex billing logic with deterministic execution
- **Stablecoin Support**: Deep integration with USDC, EURC, and other regulated assets ensures price stability for business operations
- **Near-Zero Fees**: Transactions cost pennies, making even micro-subscriptions ($1/week) economically viable
- **Fast Settlement**: 5-second confirmation times ensure rapid transaction finality

## Key Features

- **Pull-Payment Architecture**: Users grant time-bound authorizations for automated recurring transfers
- **Non-Custodial**: Users maintain full control—no funds locked in smart contracts
- **Merchant Dashboard**: Real-time tracking of subscription metrics and subscriber lifecycle management
- **Standard Token Support**: Direct integration with native Stellar assets (USDC, EURC, etc.)
- **Wallet Integration**: Works seamlessly with Freighter and Lobstr wallets

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

**Questions or feedback?** Open an issue or reach out to the development team.
