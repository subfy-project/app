#!/usr/bin/env bash
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
ADMIN="${ADMIN:-admin}"
USER="${USER:-user}"
TREASURY="${TREASURY:-treasury}"
TOKEN_ALIAS="${TOKEN_ALIAS:-sb_pay_token}"
SUBSCRIPTION_ALIAS="${SUBSCRIPTION_ALIAS:-sb_subscription}"
PLAN_ID="${PLAN_ID:-1}"
PERIOD_LEDGERS="${PERIOD_LEDGERS:-30}"
PRICE_STROOPS="${PRICE_STROOPS:-1000000}"

echo "== Build contract =="
(
  cd contracts
  stellar contract build
)

echo "== Ensure funded identities =="
stellar keys generate "$ADMIN" --network "$NETWORK" --fund >/dev/null || true
stellar keys generate "$USER" --network "$NETWORK" --fund >/dev/null || true
stellar keys generate "$TREASURY" --network "$NETWORK" --fund >/dev/null || true

ADMIN_ADDR="$(stellar keys address "$ADMIN")"
USER_ADDR="$(stellar keys address "$USER")"
TREASURY_ADDR="$(stellar keys address "$TREASURY")"

echo "== Deploy payment token =="
stellar contract asset deploy \
  --asset "SBSUB:${ADMIN_ADDR}" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  --alias "$TOKEN_ALIAS" >/dev/null

echo "== Deploy subscription contract =="
stellar contract deploy \
  --wasm "contracts/target/wasm32v1-none/release/sb_subscription.wasm" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  --alias "$SUBSCRIPTION_ALIAS" >/dev/null

TOKEN_ID="$(stellar contract alias show "$TOKEN_ALIAS")"
SUB_ID="$(stellar contract alias show "$SUBSCRIPTION_ALIAS")"

echo "== Init contract =="
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  init \
  --admin "$ADMIN_ADDR" \
  --payment-token "$TOKEN_ID" \
  --treasury "$TREASURY_ADDR" >/dev/null

echo "== Create plan =="
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  create-plan \
  --caller "$ADMIN_ADDR" \
  --plan-id "$PLAN_ID" \
  --period-ledgers "$PERIOD_LEDGERS" \
  --price-stroops "$PRICE_STROOPS" >/dev/null

echo "== Mint token to user =="
stellar contract invoke \
  --id "$TOKEN_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  mint \
  --to "$USER_ADDR" \
  --amount 10000000 >/dev/null

echo "== Subscribe (first debit) =="
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$USER" \
  --network "$NETWORK" \
  -- \
  subscribe \
  --subscriber "$USER_ADDR" \
  --plan-id "$PLAN_ID" >/dev/null

echo "== Approve allowance for auto-renew =="
stellar contract invoke \
  --id "$TOKEN_ID" \
  --source-account "$USER" \
  --network "$NETWORK" \
  -- \
  approve \
  --from "$USER_ADDR" \
  --spender "$SUB_ID" \
  --amount 100000000 \
  --expiration-ledger 1000000 >/dev/null

echo "== Paginated queries =="
echo "Plans page 1:"
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  list-plans \
  --offset 0 \
  --limit 10

echo "Subscribers page 1:"
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  list-subscribers \
  --offset 0 \
  --limit 10

echo "Subscriptions page 1:"
stellar contract invoke \
  --id "$SUB_ID" \
  --source-account "$ADMIN" \
  --network "$NETWORK" \
  -- \
  list-subscriptions \
  --offset 0 \
  --limit 10

echo "Done. Contract: ${SUB_ID} | Token: ${TOKEN_ID}"
