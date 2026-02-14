# Soroban Testnet Integration (Frontend + Backend)

This document describes how to connect the `sb_subscription` contract to the current app stack on Testnet.

## Goals

- Keep wallet signing on the frontend (user custody).
- Keep automation (`renew`) on the backend.
- Use Testnet for contract and token interactions.

## Current contract capabilities

`sb_subscription` currently exposes:

- `init(admin, payment_token, treasury)`
- `create_plan(caller, plan_id, period_ledgers, price_stroops)`
- `set_plan_status(caller, plan_id, active)`
- `subscribe(subscriber, plan_id)` (charges immediately)
- `renew(subscriber)` (callable by anyone, due-ledger guarded)
- `cancel(subscriber)`
- `get_plan(plan_id)`
- `get_subscription(subscriber)`
- `list_plans(offset, limit)`
- `list_subscribers(offset, limit)`
- `list_subscriptions(offset, limit)`

Renewal requires token allowance on the payment token contract (`approve` done by the user).

## Environment variables

### Backend (`apps/api`)

Suggested env values:

```env
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SB_SUBSCRIPTION_CONTRACT_ID=<C...>
SB_PAYMENT_TOKEN_CONTRACT_ID=<C...>
SB_BACKEND_SIGNER_SECRET=<S...>  # server bot key to submit renew txs
```

### Frontend (`apps/web`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_SB_SUBSCRIPTION_CONTRACT_ID=<C...>
NEXT_PUBLIC_SB_PAYMENT_TOKEN_CONTRACT_ID=<C...>
```

## Integration architecture

1. Frontend authenticates wallet user (already implemented with SEP-10 flow).
2. Frontend asks backend for contract actions needing server orchestration (plan reads, renew queue status, etc.).
3. Frontend signs user-owned operations:
   - `subscribe`
   - `approve` on token contract (allowance for renewals)
   - `cancel`
4. Backend runs periodic renew job:
   - query `list_subscriptions(offset, limit)`
   - check each `next_renewal_ledger`
   - call `renew(subscriber)` when due
   - handle allowance/balance failures (mark for retry/notify)

## API design suggestion (backend)

Add a `subscriptions` module in `apps/api`:

- `GET /plans?offset=0&limit=20`
  - maps to `list_plans`
- `GET /subscriptions?offset=0&limit=20`
  - maps to `list_subscriptions`
- `GET /subscriptions/:publicKey`
  - maps to `get_subscription`
- `POST /subscriptions/renew-due`
  - admin-only/manual trigger of renew job

And add an internal cron worker:

- every N seconds:
  - fetch paginated subscriptions
  - call `renew` for due ones
  - persist success/failure metrics in DB

## Frontend flow recommendation

### Subscribe flow

1. User selects plan.
2. Frontend invokes `subscribe`.
3. Show success and `next_renewal_ledger`.

### Auto-renew setup flow

1. After subscribe, ask user to sign token `approve`:
   - spender = `sb_subscription` contract id
   - amount = monthly price * desired periods
   - expiration ledger = horizon (ex: 6-12 months)
2. Store allowance metadata in backend for reminders.

### Dashboard flow

- Plans page uses backend `/plans` (paginated).
- Subscription management page uses backend `/subscriptions/:publicKey`.

## Operational notes

- Keep `limit` <= 50 for contract list methods.
- Use retries with exponential backoff on renew failures.
- Monitor:
  - allowance exhaustion
  - low user balance
  - `RenewTooEarly` errors (scheduling issue)

## Useful local command

Use the scripts created in `scripts/soroban/`:

- Windows: `scripts/soroban/run_testnet.ps1`
- Linux/macOS: `scripts/soroban/run_testnet.sh`

They deploy and invoke the contract end-to-end on Testnet and call list methods.
