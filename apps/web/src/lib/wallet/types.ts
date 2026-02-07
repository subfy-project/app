/* ──────────────────────────────────────────────────────────
 * Wallet Types (powered by @creit.tech/stellar-wallets-kit)
 * ──────────────────────────────────────────────────────── */

export interface WalletState {
  /** Currently selected wallet module ID */
  walletId: string | null;
  /** Stellar public key of the connected account */
  publicKey: string | null;
  /** JWT token returned by the backend after SEP-10 verify */
  token: string | null;
  /** True while a connection / auth flow is in progress */
  connecting: boolean;
  /** Last error message (cleared on next connect attempt) */
  error: string | null;
}

export const INITIAL_WALLET_STATE: WalletState = {
  walletId: null,
  publicKey: null,
  token: null,
  connecting: false,
  error: null,
};
