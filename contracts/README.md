# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:

```text
.
├── contracts
│   └── sb_subscription
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
├── rust-toolchain.toml
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.

## Existing Contract: `sb_subscription`

The `sb_subscription` contract is a subscription manager with:

- Contract admin initialization
- Plan creation and activation/deactivation by admin
- User subscription lifecycle (`subscribe`, `cancel`)
- Renewal (`renew`) callable by anyone with due-ledger check (anti-spam)
- Read APIs (`get_plan`, `get_subscription`)
- Paginated listing APIs (`list_plans`, `list_subscribers`, `list_subscriptions`)
- On-chain payment transfer during `subscribe` and `renew` via a Soroban token contract

`init` now expects `(admin, payment_token, treasury)` so fees can be debited from the subscriber and credited to the treasury.
`renew` requires the subscriber to have approved allowance for this contract on the payment token.

## Commands

From this directory:

```bash
cargo test
stellar contract build
```
