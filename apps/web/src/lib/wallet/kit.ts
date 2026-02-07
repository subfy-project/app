/* ──────────────────────────────────────────────────────────
 * Stellar Wallets Kit — Singleton
 *
 * Lazy-loaded to avoid SSR issues (Next.js).
 * A single instance is shared across the React tree.
 * ──────────────────────────────────────────────────────── */

import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

let kitInstance: StellarWalletsKit | null = null;

export function getKit(): StellarWalletsKit {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kitInstance;
}
