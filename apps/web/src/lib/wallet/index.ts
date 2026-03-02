/* ── Public API of the wallet layer ───────────────── */

export {
  WalletProvider,
  useWallet,
  type WalletProviderProps,
} from "./context";
export { getKit } from "./kit";
export type { WalletState } from "./types";
