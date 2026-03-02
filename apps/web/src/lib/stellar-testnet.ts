/* ──────────────────────────────────────────────────────────
 * Stellar testnet utilities
 *
 * Check if account exists and fund via Friendbot.
 * ──────────────────────────────────────────────────────── */

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = `${HORIZON_TESTNET}/friendbot`;

/**
 * Check if a Stellar account exists on testnet.
 * Returns true if the account exists, false if 404.
 */
export async function accountExistsOnTestnet(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`, {
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fund an account on Stellar testnet via Friendbot.
 * GET request with address as query param.
 * Returns true on success, false on failure.
 */
export async function fundAccountViaFriendbot(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    return res.ok;
  } catch {
    return false;
  }
}
