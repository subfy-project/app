param(
  [string]$Network = "testnet",
  [string]$Admin = "admin",
  [string]$User = "user",
  [string]$Treasury = "treasury",
  [string]$TokenAlias = "sb_pay_token",
  [string]$SubscriptionAlias = "sb_subscription",
  [int]$PlanId = 1,
  [int]$PeriodLedgers = 30,
  [long]$PriceStroops = 1000000
)

$ErrorActionPreference = "Stop"

Write-Host "== Build contract =="
Push-Location "contracts"
stellar contract build
Pop-Location

Write-Host "== Ensure funded identities =="
stellar keys generate $Admin --network $Network --fund | Out-Null
stellar keys generate $User --network $Network --fund | Out-Null
stellar keys generate $Treasury --network $Network --fund | Out-Null

$ADMIN_ADDR = stellar keys address $Admin
$USER_ADDR = stellar keys address $User
$TREASURY_ADDR = stellar keys address $Treasury

Write-Host "== Deploy payment token =="
stellar contract asset deploy `
  --asset "SBSUB:$ADMIN_ADDR" `
  --source-account $Admin `
  --network $Network `
  --alias $TokenAlias | Out-Null

Write-Host "== Deploy subscription contract =="
stellar contract deploy `
  --wasm "contracts/target/wasm32v1-none/release/sb_subscription.wasm" `
  --source-account $Admin `
  --network $Network `
  --alias $SubscriptionAlias | Out-Null

$TOKEN_ID = stellar contract alias show $TokenAlias
$SUB_ID = stellar contract alias show $SubscriptionAlias

Write-Host "== Init contract =="
stellar contract invoke `
  --id $SUB_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  init `
  --admin $ADMIN_ADDR `
  --payment-token $TOKEN_ID `
  --treasury $TREASURY_ADDR | Out-Null

Write-Host "== Create plan =="
stellar contract invoke `
  --id $SUB_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  create-plan `
  --caller $ADMIN_ADDR `
  --plan-id $PlanId `
  --period-ledgers $PeriodLedgers `
  --price-stroops $PriceStroops | Out-Null

Write-Host "== Mint token to user =="
stellar contract invoke `
  --id $TOKEN_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  mint `
  --to $USER_ADDR `
  --amount 10000000 | Out-Null

Write-Host "== Subscribe (first debit) =="
stellar contract invoke `
  --id $SUB_ID `
  --source-account $User `
  --network $Network `
  -- `
  subscribe `
  --subscriber $USER_ADDR `
  --plan-id $PlanId | Out-Null

Write-Host "== Approve allowance for auto-renew =="
stellar contract invoke `
  --id $TOKEN_ID `
  --source-account $User `
  --network $Network `
  -- `
  approve `
  --from $USER_ADDR `
  --spender $SUB_ID `
  --amount 100000000 `
  --expiration-ledger 1000000 | Out-Null

Write-Host "== Paginated queries =="
Write-Host "Plans page 1:"
stellar contract invoke `
  --id $SUB_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  list-plans `
  --offset 0 `
  --limit 10

Write-Host "Subscribers page 1:"
stellar contract invoke `
  --id $SUB_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  list-subscribers `
  --offset 0 `
  --limit 10

Write-Host "Subscriptions page 1:"
stellar contract invoke `
  --id $SUB_ID `
  --source-account $Admin `
  --network $Network `
  -- `
  list-subscriptions `
  --offset 0 `
  --limit 10

Write-Host "Done. Contract: $SUB_ID | Token: $TOKEN_ID"
